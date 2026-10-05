import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { BUNDLED_PACK, validatePack, type LibraryPack } from '../src/core/library/pack';
import { createSeedRepo } from '../src/core/library/seed';
import { checkUpdate, downloadPack, isAllowedUrl, parseManifest, UpdateError, type Manifest } from '../src/core/library/update';

const MANIFEST_URL = 'https://example.com/lib/manifest.json';

function makePack(version: number, extraWord = true): LibraryPack {
  const words = [...BUNDLED_PACK.words] as Record<string, unknown>[];
  if (extraWord) words.push({ tr: 'deneme kelimesi', ar: 'كَلِمَةٌ', translit: 'kelime', pos: 'noun', category: 'test' });
  return { ...BUNDLED_PACK, version, builtAt: '2030-01-01T00:00:00.000Z', words };
}
function packResponse(pack: LibraryPack) {
  const body = JSON.stringify(pack);
  const manifest: Manifest = {
    format: 1, version: pack.version, url: 'library-pack.json', size: Buffer.byteLength(body),
    sha256: createHash('sha256').update(body).digest('hex'), builtAt: pack.builtAt,
  };
  return { body, manifest };
}
const ok = (body: string) => new Response(body, { status: 200 });

describe('paket doğrulama', () => {
  it('gömülü paket geçerlidir', () => {
    expect('pack' in validatePack(BUNDLED_PACK)).toBe(true);
  });
  it('bozuk biçimleri reddeder', () => {
    expect(validatePack(null)).toHaveProperty('error');
    expect(validatePack({ ...BUNDLED_PACK, format: 2 })).toHaveProperty('error');
    expect(validatePack({ ...BUNDLED_PACK, version: 0 })).toHaveProperty('error');
    expect(validatePack({ ...BUNDLED_PACK, words: 'x' })).toHaveProperty('error');
    expect(validatePack({ ...BUNDLED_PACK, words: [{ tr: 'a' }] })).toHaveProperty('error');
  });
  it('gömülünün yarısından küçük paketi reddeder', () => {
    expect(validatePack({ ...BUNDLED_PACK, words: BUNDLED_PACK.words.slice(0, 5) })).toHaveProperty('error');
  });
});

describe('manifest ve adres', () => {
  it('yalnızca https (ve localhost http) kabul edilir', () => {
    expect(isAllowedUrl('https://a.com/x')).toBe(true);
    expect(isAllowedUrl('http://localhost:5173/x')).toBe(true);
    expect(isAllowedUrl('http://a.com/x')).toBe(false);
    expect(isAllowedUrl('file:///etc/passwd')).toBe(false);
    expect(isAllowedUrl('javascript:alert(1)')).toBe(false);
  });
  it('geçersiz manifesti reddeder', () => {
    const { manifest } = packResponse(makePack(5));
    expect(parseManifest(manifest)).not.toBeNull();
    expect(parseManifest({ ...manifest, sha256: 'xyz' })).toBeNull();
    expect(parseManifest({ ...manifest, size: 0 })).toBeNull();
    expect(parseManifest({ ...manifest, size: 999_999_999 })).toBeNull();
    expect(parseManifest({ ...manifest, version: 1.5 })).toBeNull();
    expect(parseManifest(null)).toBeNull();
  });
});

describe('güncelleme kontrolü', () => {
  const { manifest } = packResponse(makePack(5));
  it('yeni sürümü bulur', async () => {
    const r = await checkUpdate(MANIFEST_URL, 1, async () => ok(JSON.stringify(manifest)));
    expect(r.kind).toBe('available');
  });
  it('aynı veya eski sürümde "güncel" der', async () => {
    expect((await checkUpdate(MANIFEST_URL, 5, async () => ok(JSON.stringify(manifest)))).kind).toBe('uptodate');
    expect((await checkUpdate(MANIFEST_URL, 9, async () => ok(JSON.stringify(manifest)))).kind).toBe('uptodate');
  });
  it('ağ ve sunucu hatalarını anlaşılır hataya çevirir', async () => {
    await expect(checkUpdate(MANIFEST_URL, 1, async () => { throw new TypeError('x'); })).rejects.toThrow(UpdateError);
    await expect(checkUpdate(MANIFEST_URL, 1, async () => new Response('', { status: 404 }))).rejects.toThrow(/404/);
    await expect(checkUpdate(MANIFEST_URL, 1, async () => ok('<html>'))).rejects.toThrow(UpdateError);
    await expect(checkUpdate('http://example.com/m.json', 1, async () => ok('{}'))).rejects.toThrow(/https/);
  });
});

describe('paket indirme', () => {
  it('geçerli paketi indirir ve yeni verinin aranabilir olduğunu gösterir', async () => {
    const { body, manifest } = packResponse(makePack(5));
    const pack = await downloadPack(manifest, MANIFEST_URL, async (u) => {
      expect(u).toBe('https://example.com/lib/library-pack.json'); // göreli adres manifeste göre çözülür
      return ok(body);
    });
    expect(pack.version).toBe(5);
    const repo = createSeedRepo(pack);
    expect(repo.version).toBe(5);
    expect(repo.findWords('deneme kelimesi')[0]?.ar).toBe('كَلِمَةٌ');
    // Gömülü depoda bu kelime yok; el yazması tohum ve kalan veri sağlam.
    expect(createSeedRepo().findWords('deneme kelimesi')).toEqual([]);
    expect(repo.findVerb('binmek')).toBeDefined();
  });
  it('değiştirilmiş (sha256 uyuşmayan) paketi reddeder', async () => {
    const { body, manifest } = packResponse(makePack(5));
    await expect(downloadPack(manifest, MANIFEST_URL, async () => ok(body.replace('deneme', 'denemX')))).rejects.toThrow(/sha256|eksik veya fazla/);
  });
  it('yarım inen (kısa) paketi reddeder', async () => {
    const { body, manifest } = packResponse(makePack(5));
    await expect(downloadPack(manifest, MANIFEST_URL, async () => ok(body.slice(0, body.length - 100)))).rejects.toThrow(/eksik/);
  });
  it('manifestle uyuşmayan sürümü reddeder', async () => {
    const { body, manifest } = packResponse(makePack(5));
    await expect(downloadPack({ ...manifest, version: 6 }, MANIFEST_URL, async () => ok(body))).rejects.toThrow(/sürümü/);
  });
  it('hash doğru olsa bile şema bozuksa reddeder', async () => {
    const bad = { ...makePack(5), words: [{ tr: 'x' }] } as unknown as LibraryPack;
    const { body, manifest } = packResponse(bad);
    await expect(downloadPack(manifest, MANIFEST_URL, async () => ok(body))).rejects.toThrow(UpdateError);
  });
});
