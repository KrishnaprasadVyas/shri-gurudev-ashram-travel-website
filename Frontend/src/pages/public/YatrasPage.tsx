import React from 'react';

import { Hero as YatrasHero } from '@/components/yatras/Hero';
import { UpcomingPilgrimages } from '@/components/yatras/UpcomingPilgrimages';
import { WhyTravelWithUs } from '@/components/about/WhyTravelWithUs';
import { JourneyTimeline } from '@/components/yatras/JourneyTimeline';
import { YatrasCta } from '@/components/yatras/YatrasCta';
import { usePageTitle } from '@/hooks/usePageTitle';

export const YatrasPage: React.FC = () => {
  usePageTitle('Sacred Yatras');

  return (
    <main className="pb-section-gap bg-surface text-on-surface ">
      <YatrasHero />
      <UpcomingPilgrimages />
      <WhyTravelWithUs />
      <JourneyTimeline />
      <YatrasCta />
    </main>
  );
};
