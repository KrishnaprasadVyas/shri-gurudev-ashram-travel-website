import React from 'react';
import { Hero } from '@/components/yatras/Hero';
import { GurudevBlessings } from '@/components/yatras/GurudevBlessings';
import { UpcomingPilgrimages } from '@/components/yatras/UpcomingPilgrimages';
import { WhyTravelWithUs } from '@/components/about/WhyTravelWithUs';
import { JourneyTimeline } from '@/components/yatras/JourneyTimeline';
import { YatrasCta } from '@/components/yatras/YatrasCta';
import { usePageTitle } from '@/hooks/usePageTitle';

export const YatrasPage: React.FC = () => {
  usePageTitle('Sacred Yatras');

  return (
    <main className="pb-section-gap bg-surface text-on-surface overflow-hidden">
      <Hero />
      <GurudevBlessings />
      <UpcomingPilgrimages />
      <WhyTravelWithUs />
      <JourneyTimeline />
      <YatrasCta />
    </main>
  );
};
