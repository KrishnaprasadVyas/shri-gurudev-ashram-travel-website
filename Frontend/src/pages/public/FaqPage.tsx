import { usePageTitle } from '@/hooks/usePageTitle';

import { FaqHero } from '@/components/faq/FaqHero';
import { FaqSection } from '@/components/faq/FaqSection';
import { SpiritualGuidance } from '@/components/faq/SpiritualGuidance';
import { SanskritQuote } from '@/components/faq/SanskritQuote';
import { FaqCta } from '@/components/faq/FaqCta';
import { useTranslation } from "react-i18next";

export function FaqPage() {
  const { t } = useTranslation();
  usePageTitle(t('public.faq.title'));

  return (
    <div className="font-body-md text-body-md bg-surface text-on-surface w-full ">
      <FaqHero />
      <FaqSection />
      <SpiritualGuidance />
      <SanskritQuote />
      <FaqCta />
    </div>
  );
}
