import React from 'react';
import { aboutGarden, aboutMeditation, aboutManuscript } from '@/assets/images';

export const SacredMomentsGallery: React.FC = () => {
  return (
    <section className="px-4 md:px-margin-desktop mb-12 md:mb-section-gap max-w-container-max mx-auto">
      <div className="text-center mb-12">
        <h2 className="font-headline-md text-headline-md text-primary mb-4">Sacred Moments</h2>
        <p className="text-on-surface-variant max-w-2xl mx-auto">Glimpses of stillness and devotion from our Ashram and Yatras.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="h-80 rounded-xl overflow-hidden group relative shadow-md hover:shadow-lg transition-all duration-300">
          <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Satsang" src={aboutGarden} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent flex items-end p-6">
            <span className="font-headline-sm text-white font-medium text-[20px] drop-shadow-sm">Satsang</span>
          </div>
        </div>
        <div className="h-80 rounded-xl overflow-hidden group relative shadow-md hover:shadow-lg transition-all duration-300 md:mt-12">
          <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Gurukulam" src={aboutMeditation} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent flex items-end p-6">
            <span className="font-headline-sm text-white font-medium text-[20px] drop-shadow-sm">Gurukulam</span>
          </div>
        </div>
        <div className="h-80 rounded-xl overflow-hidden group relative shadow-md hover:shadow-lg transition-all duration-300">
          <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Sacred Yatras" src={aboutManuscript} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent flex items-end p-6">
            <span className="font-headline-sm text-white font-medium text-[20px] drop-shadow-sm">Sacred Yatras</span>
          </div>
        </div>
      </div>
    </section>
  );
};
