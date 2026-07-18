import React, { useEffect } from 'react';

import { AshramEthos } from '@/components/home/AshramEthos';
import { SpiritualPaths } from '@/components/home/SpiritualPaths';
import { QuoteSection } from '@/components/home/QuoteSection';
import { Statistics } from '@/components/home/Statistics';
import { Hero as HomeHero } from '@/components/home/Hero';
import { usePageTitle } from '@/hooks/usePageTitle';

export const HomePage: React.FC = () => {
  usePageTitle('Begin Your Sacred Journey');
  useEffect(() => {
    // Entrance animation logic
    const observerOptions = {
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-in-up');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    document.querySelectorAll('section > div').forEach(el => {
      // In React, direct DOM manipulation for styles can sometimes conflict,
      // but for simple entrance animations it's okay if not overused.
      // Better way is to use a CSS class approach that we added in index.css
      (el as HTMLElement).style.opacity = '0';
      (el as HTMLElement).style.transform = 'translateY(20px)';
      (el as HTMLElement).style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out';
      observer.observe(el);
    });
    
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <HomeHero />
      <Statistics />
      <AshramEthos />
      <SpiritualPaths />
      <QuoteSection />
    </>
  );
};
