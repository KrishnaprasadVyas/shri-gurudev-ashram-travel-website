import React from 'react';
import { Link } from 'react-router-dom';
import { usePackages } from '@/hooks/usePackages';
import { gangaAarti, shikharMeditation, anandaRetreat, aboutDiya, aboutTempleGate, heroBg } from '@/assets/images';

const fallbackImages = [aboutDiya, gangaAarti, shikharMeditation, heroBg, aboutTempleGate, anandaRetreat];

export const SpiritualPaths: React.FC = () => {
  const { data: packages, isLoading, error } = usePackages();

  return (
    <section className="bg-surface-container-low py-section-gap px-margin-desktop">
      <div className="max-w-container-max mx-auto space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="section-eyebrow">Divine Pilgrimages</span>
          <h2 className="section-heading">Upcoming Yatras</h2>
          <p className="section-desc italic">Embark on a pilgrimage that transcends the physical plane.</p>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="relative overflow-hidden rounded-xl bg-surface shadow-sm border border-outline-variant/30 aspect-[4/5] sm:aspect-square md:aspect-[4/5] animate-pulse">
                <div className="absolute inset-0 bg-surface-container-low" />
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="text-center py-16">
            <p className="text-red-600 font-medium text-lg mb-2">Unable to load yatras</p>
            <p className="text-on-surface-variant text-sm">Please try refreshing the page.</p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && packages && packages.length === 0 && (
          <div className="text-center py-16">
            <p className="text-on-surface-variant text-lg font-light">No upcoming yatras at the moment. Please check back soon.</p>
          </div>
        )}

        {/* Package cards */}
        {!isLoading && !error && packages && packages.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {packages.map((pkg, index) => (
              <Link key={pkg.id} to={`/yatras/${pkg.id}`} className="group relative overflow-hidden rounded-xl bg-surface shadow-sm cursor-pointer border border-outline-variant/30 block aspect-[4/5] sm:aspect-square md:aspect-[4/5]">
                <img className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={pkg.title} src={pkg.image_url ?? fallbackImages[index % fallbackImages.length]} loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                <div className="absolute bottom-0 p-6 text-white w-full flex flex-col justify-end h-full">
                  <div className="flex justify-between items-center mb-4">
                    <span className="bg-primary/90 px-3 py-1 rounded-full text-[10px] font-label-caps tracking-widest inline-block text-white">
                      {pkg.duration} • ₹{pkg.price.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] font-label-caps tracking-widest text-white/80 uppercase">
                      {pkg.remaining_seats} seats left
                    </span>
                  </div>
                  <h3 className="text-2xl font-headline-sm mb-2 text-white">{pkg.title}</h3>
                  <p className="text-white/80 text-sm mb-6">{pkg.description}</p>
                  <div className="mt-auto pt-4 border-t border-white/20 font-label-caps tracking-widest text-xs flex items-center justify-between text-white group-hover:text-primary transition-colors">
                    <span>VIEW DETAILS</span>
                    <svg className="w-[18px] h-[18px] transform group-hover:translate-x-2 transition-transform duration-300 ease-out" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H7M17 7v10" /></svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
