import { parseModelResult } from './schema.ts';
import type { ChatErrorCode, ModelResult, TurnRequest } from './types.ts';

export class ChatError extends Error {
  readonly code: ChatErrorCode;
  readonly status?: number;
  constructor(code: ChatErrorCode, message: string, status?: number) {
    super(message);
    this.name = 'ChatError';
    this.code = code;
    this.status = status;
  }
}

export interface ProxyConfig {
  /** Cloudflare Worker adresi (sonda "/" olsa da olmasa da). */
  url: string;
  /** İsteğe bağlı paylaşılan gizli anahtar (Worker'da APP_TOKEN tanımlıysa). */
  token?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

/** Sunucu hata kodunu uygulama koduna çevirir. */
const SERVER_CODES: Record<string, ChatErrorCode> = {
  unauthorized: 'unauthorized', forbidden: 'forbidden', bad_request: 'bad_request', rate_limited: 'rate_limited',
  refused: 'refused', truncated: 'bad_response', bad_response: 'bad_response',
};

const endpoint = (url: string, path: string) => `${url.trim().replace(/\/+$/, '')}${path}`;

async function request(cfg: ProxyConfig, path: string, init: RequestInit): Promise<{ status: number; body: unknown }> {
  const f = cfg.fetchImpl ?? fetch;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), cfg.timeoutMs ?? 45_000);
  try {
    const res = await f(endpoint(cfg.url, path), {
      ...init,
      headers: { 'content-type': 'application/json', ...(cfg.token ? { 'x-app-token': cfg.token } : {}) },
      signal: ctrl.signal,
    });
    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      /* JSON değil: aşağıda durum koduna göre işlenir */
    }
    return { status: res.status, body };
  } catch (e) {
    if ((e as { name?: string }).name === 'AbortError') throw new ChatError('timeout', 'Çeviri zaman aşımına uğradı');
    throw new ChatError('network', 'Çeviri sunucusuna ulaşılamadı');
  } finally {
    clearTimeout(timer);
  }
}

/** Bir turu proxy üzerinden çevirir. Her hata `ChatError` olarak, kullanıcıya gösterilebilir kodla döner. */
export async function translateViaProxy(cfg: ProxyConfig, req: TurnRequest): Promise<ModelResult> {
  if (!cfg.url.trim()) throw new ChatError('no_proxy', 'Çeviri sunucusu adresi tanımlı değil');
  const { status, body } = await request(cfg, '/translate', { method: 'POST', body: JSON.stringify(req) });
  const b = (body && typeof body === 'object' ? body : {}) as { ok?: boolean; result?: unknown; error?: { code?: string; message?: string } };
  if (status === 200 && b.ok) {
    try {
      return parseModelResult(b.result);
    } catch {
      throw new ChatError('bad_response', 'Sunucudan geçersiz çeviri geldi', status);
    }
  }
  const code = SERVER_CODES[b.error?.code ?? ''] ?? (status === 401 ? 'unauthorized' : status === 403 ? 'forbidden' : status === 429 ? 'rate_limited' : 'server_error');
  throw new ChatError(code, b.error?.message ?? `Sunucu hatası (${status})`, status);
}

/** "Bağlantıyı dene": Worker'ın /health uç noktasını çağırır. */
export async function checkProxy(cfg: ProxyConfig): Promise<{ ok: true; model?: string; tokenRequired: boolean }> {
  if (!cfg.url.trim()) throw new ChatError('no_proxy', 'Çeviri sunucusu adresi tanımlı değil');
  const { status, body } = await request(cfg, '/health', { method: 'GET' });
  const b = (body && typeof body === 'object' ? body : {}) as { ok?: boolean; model?: string; tokenRequired?: boolean };
  if (status === 200 && b.ok) return { ok: true, model: b.model, tokenRequired: !!b.tokenRequired };
  throw new ChatError(status === 401 ? 'unauthorized' : status === 403 ? 'forbidden' : 'server_error', `Sunucu yanıt vermedi (${status})`, status);
}
