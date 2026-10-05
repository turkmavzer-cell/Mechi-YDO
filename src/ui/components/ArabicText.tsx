import { stripHarakat } from '../../core/tokenizer/normalize';
import { useSettingsStore } from '../../core/settings/store';

interface Props {
  text: string;
  className?: string;
  size?: number;
}

/** Arapça metin: her zaman dir="rtl"; hareke gösterimi ayara bağlı. */
export function ArabicText({ text, className = '', size }: Props) {
  const showHarakat = useSettingsStore((s) => s.settings.showHarakat);
  const fontSize = useSettingsStore((s) => s.settings.arabicFontSize);
  const shown = showHarakat ? text : stripHarakat(text);
  const px = size ?? fontSize;
  return (
    <span
      className={`arabic ${className}`}
      dir="rtl"
      lang="ar"
      style={{ fontSize: px, lineHeight: showHarakat ? 1.9 : 1.5 }}
    >
      {shown}
    </span>
  );
}
