/**
 * Mechi-YDO çeviri proxy'si (Cloudflare Worker). Yalnızca iki iş yapar:
 *   GET  /health     → bağlantı denemesi
 *   POST /translate  → Türkçe ⇄ Mısır Arapçası çevirisi + kelime çıkarımı (Claude)
 *
 * API anahtarı yalnızca burada durur (wrangler secret ANTHROPIC_API_KEY); uygulamaya girmez.
 */
import Anthropic from '@anthropic-ai/sdk';
import { parseModelResult, RESULT_JSON_SCHEMA } from '../../../src/core/chat/schema.ts';
import {
  buildUserContent, corsHeaders, DEFAULT_MODEL, MAX_BODY_BYTES, originAllowed, parseRequest, SYSTEM_PROMPT,
} from './logic.ts';

export interface Env {
  ANTHROPIC_API_KEY: string;
  /** Model kimliği; verilmezse DEFAULT_MODEL. */
  MODEL?: string;
  /** Virgülle ayrılmış izinli kaynaklar (Origin). */
  ALLOWED_ORIGINS?: string;
  /** İsteğe bağlı paylaşılan gizli anahtar; tanımlıysa her istekte x-app-token başlığı gerekir. */
  APP_TOKEN?: string;
}

const json = (body: unknown, status: number, headers: Record<string, string>) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', ...headers } });

const fail = (code: string, message: string) => ({ ok: false, error: { code, message } });

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('origin');
    const cors = corsHeaders(origin, env.ALLOWED_ORIGINS);
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (!originAllowed(origin, env.ALLOWED_ORIGINS)) return json(fail('forbidden', 'Bu kaynağa izin verilmiyor'), 403, cors);

    if (env.APP_TOKEN && request.headers.get('x-app-token') !== env.APP_TOKEN) {
      return json(fail('unauthorized', 'Geçersiz veya eksik uygulama anahtarı'), 401, cors);
    }

    if (url.pathname === '/health' && request.method === 'GET') {
      return json({ ok: true, service: 'mechi-translate-proxy', model: env.MODEL ?? DEFAULT_MODEL, tokenRequired: !!env.APP_TOKEN }, 200, cors);
    }
    if (url.pathname !== '/translate' || request.method !== 'POST') return json(fail('not_found', 'Bulunamadı'), 404, cors);
    if (!env.ANTHROPIC_API_KEY) return json(fail('server_error', 'Sunucu yapılandırması eksik'), 500, cors);

    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) return json(fail('bad_request', 'İstek çok büyük'), 413, cors);
    let body: unknown;
    try {
      body = JSON.parse(raw);
    } catch {
      return json(fail('bad_request', 'Geçersiz JSON'), 400, cors);
    }
    const parsed = parseRequest(body);
    if (!parsed.ok) return json(fail(parsed.code, parsed.message), 400, cors);

    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, maxRetries: 1 });
    try {
      const response = await client.beta.messages.create({
        model: env.MODEL ?? DEFAULT_MODEL,
        max_tokens: 8000,
        // Reddedilen istekte sunucu tarafı yedek modele geçer (Claude Opus 5.5 için varsayılan kural).
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        // Sohbet için hız: düşük çaba. (Claude Opus 5.5'te düşünme kapatılamaz; derinlik effort ile ayarlanır.)
        output_config: { effort: 'low', format: { type: 'json_schema', schema: RESULT_JSON_SCHEMA } },
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: buildUserContent(parsed.req) }],
      });

      if (response.stop_reason === 'refusal') return json(fail('refused', 'Model bu metni çevirmeyi reddetti'), 422, cors);
      if (response.stop_reason === 'max_tokens') return json(fail('truncated', 'Çeviri tamamlanamadı'), 502, cors);
      const text = response.content.find((b) => b.type === 'text');
      if (!text || text.type !== 'text') return json(fail('bad_response', 'Modelden metin gelmedi'), 502, cors);
      let result;
      try {
        result = parseModelResult(JSON.parse(text.text));
      } catch {
        return json(fail('bad_response', 'Modelden geçersiz çeviri geldi'), 502, cors);
      }
      return json({ ok: true, result }, 200, cors);
    } catch (e) {
      // Ayrıntı kullanıcıya sızdırılmaz (anahtar/hesap bilgisi olabilir); yalnızca kod döner.
      if (e instanceof Anthropic.RateLimitError) return json(fail('rate_limited', 'Çok fazla istek, biraz sonra tekrar deneyin'), 429, cors);
      if (e instanceof Anthropic.AuthenticationError || e instanceof Anthropic.PermissionDeniedError) {
        return json(fail('server_error', 'Sunucu yapılandırma hatası'), 500, cors);
      }
      if (e instanceof Anthropic.APIConnectionError) return json(fail('server_error', 'Claude servisine ulaşılamadı'), 502, cors);
      return json(fail('server_error', 'Çeviri şu anda yapılamıyor'), 502, cors);
    }
  },
};
