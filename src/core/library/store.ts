import { create } from 'zustand';
import { BUNDLED_PACK, type LibraryPack } from './pack';
import { createSeedRepo } from './seed';
import type { LibraryRepo } from './repo';
import {
  checkUpdate, clearInstalledPack, downloadPack, loadInstalledPack, saveInstalledPack, UpdateError,
  type Manifest,
} from './update';

export type UpdateStatus =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'uptodate' }
  | { kind: 'available'; manifest: Manifest; manifestUrl: string }
  | { kind: 'installing' }
  | { kind: 'installed'; version: number }
  | { kind: 'error'; message: string };

interface LibraryState {
  pack: LibraryPack;
  repo: LibraryRepo;
  /** Paket cihazdaki indirilmiş sürüm mü (false = uygulamayla gelen gömülü paket). */
  downloaded: boolean;
  status: UpdateStatus;
  load: () => Promise<void>;
  check: (manifestUrl: string) => Promise<void>;
  install: () => Promise<void>;
  revert: () => Promise<void>;
}

const errMsg = (e: unknown) => (e instanceof UpdateError ? e.message : 'Beklenmeyen hata.');

export const useLibraryStore = create<LibraryState>((set, get) => ({
  pack: BUNDLED_PACK,
  repo: createSeedRepo(BUNDLED_PACK),
  downloaded: false,
  status: { kind: 'idle' },
  load: async () => {
    const pack = await loadInstalledPack();
    if (pack) set({ pack, repo: createSeedRepo(pack), downloaded: true });
  },
  check: async (manifestUrl) => {
    set({ status: { kind: 'checking' } });
    try {
      const r = await checkUpdate(manifestUrl, get().pack.version);
      set({ status: r.kind === 'available' ? r : { kind: 'uptodate' } });
    } catch (e) {
      set({ status: { kind: 'error', message: errMsg(e) } });
    }
  },
  install: async () => {
    const st = get().status;
    if (st.kind !== 'available') return;
    set({ status: { kind: 'installing' } });
    try {
      const pack = await downloadPack(st.manifest, st.manifestUrl);
      // Önce çalışan depoyu kur: kaydetme başarısız olsa bile bu oturumda yeni veri kullanılır.
      const repo = createSeedRepo(pack);
      await saveInstalledPack(pack);
      set({ pack, repo, downloaded: true, status: { kind: 'installed', version: pack.version } });
    } catch (e) {
      set({ status: { kind: 'error', message: errMsg(e) } });
    }
  },
  revert: async () => {
    await clearInstalledPack();
    set({ pack: BUNDLED_PACK, repo: createSeedRepo(BUNDLED_PACK), downloaded: false, status: { kind: 'idle' } });
  },
}));

/** Aktif kütüphane (kancasız erişim: sohbet gibi React dışı kod için). */
export const getRepo = (): LibraryRepo => useLibraryStore.getState().repo;
