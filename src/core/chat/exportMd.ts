import { Capacitor } from '@capacitor/core';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { MD_FILENAME } from './markdown.ts';

/** Uygulamanın özel veri klasöründeki sürekli güncellenen kopya (kullanıcı dosya yöneticisinden görmez, uygulama silinince gider). */
export const AUTOSAVE_PATH = `chat/${MD_FILENAME}`;

export type ExportResult = 'shared' | 'downloaded' | 'cancelled';

/**
 * Yeni kelime çıkınca md'yi cihazdaki uygulama klasörüne sessizce yazar (yalnızca Android/iOS).
 * Hata kullanıcıyı durdurmaz: kelimeler zaten uygulama deposundadır, md dışa aktarımdan her zaman yeniden üretilir.
 */
export async function autoSaveMarkdown(md: string): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    await Filesystem.writeFile({ path: AUTOSAVE_PATH, data: md, directory: Directory.Data, encoding: Encoding.UTF8, recursive: true });
    return true;
  } catch (e) {
    console.warn('md otomatik kaydı yazılamadı', e);
    return false;
  }
}

/**
 * md'yi kullanıcıya verir: cihazda paylaşım menüsü (Drive, WhatsApp, Dosyalar…), tarayıcıda dosya indirme.
 * Cihazda önce önbelleğe yazılır (paylaşım için FileProvider yolu), sonra paylaşılır.
 */
export async function exportMarkdown(md: string): Promise<ExportResult> {
  if (Capacitor.isNativePlatform()) {
    const written = await Filesystem.writeFile({
      path: MD_FILENAME, data: md, directory: Directory.Cache, encoding: Encoding.UTF8,
    });
    try {
      await Share.share({ title: 'Mısır Arapçası kelimeleri', dialogTitle: 'Kelime listesini paylaş', files: [written.uri] });
      return 'shared';
    } catch {
      return 'cancelled'; // kullanıcı paylaşım menüsünü kapattı
    }
  }
  const url = URL.createObjectURL(new Blob([md], { type: 'text/markdown;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = MD_FILENAME;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return 'downloaded';
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
