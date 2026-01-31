'use client';

import { useTranslation } from '../context/LocaleContext';

export default function SkipToMain() {
  const t = useTranslation();
  return (
    <a href="#main" className="skip-to-main">
      {t('common.skipToMain')}
    </a>
  );
}
