import { usePageTitle } from '@/hooks/usePageTitle';

import { ContactHero } from '@/components/contact/ContactHero';
import { ContactSection } from '@/components/contact/ContactSection';
import { VisitAshram } from '@/components/contact/VisitAshram';
import { AshramMap } from '@/components/contact/AshramMap';
import { DailySchedule } from '@/components/contact/DailySchedule';
import { ContactQuote } from '@/components/contact/ContactQuote';
import { ContactCta } from '@/components/contact/ContactCta';

export function ContactPage() {
  usePageTitle('Contact & Visit');

  return (
    <div className="font-body-md text-body-md bg-surface text-on-surface w-full ">
      <ContactHero />
      <ContactSection />
      <VisitAshram />
      <AshramMap />
      <DailySchedule />
      <ContactQuote />
      <ContactCta />
    </div>
  );
}
