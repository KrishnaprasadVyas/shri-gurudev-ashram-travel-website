import React, { useEffect } from 'react';
import { Hero } from '@/components/yatras/Hero';
import { UpcomingPilgrimages } from '@/components/yatras/UpcomingPilgrimages';
import { WhyTravelWithUs } from '@/components/about/WhyTravelWithUs';
import { JourneyTimeline } from '@/components/yatras/JourneyTimeline';
import { YatrasCta } from '@/components/yatras/YatrasCta';

export const YatrasPage: React.FC = () => {
  useEffect(() => {
    document.title = 'Sacred Yatras | Shri Gurudev Ashram';
  }, []);

  return (
    <main className="pb-section-gap bg-surface text-on-surface overflow-hidden">
      <Hero />
      <UpcomingPilgrimages />
      <WhyTravelWithUs />
      <JourneyTimeline />
      <YatrasCta />
    </main>
  );
};
