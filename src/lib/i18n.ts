import { initParaglide } from '@inlang/paraglide-js';
import type { AvailableLanguageTag } from '$paraglide/runtime';

export const { locale, locales } = initParaglide<AvailableLanguageTag>({
  project: new URL('../../project.inlang', import.meta.url),
  outDir: 'src/lib/paraglide'
});
