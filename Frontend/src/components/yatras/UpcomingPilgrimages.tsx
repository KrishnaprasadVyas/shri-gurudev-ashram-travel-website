import React from 'react';
import { Link } from 'react-router-dom';
import { kedarnath, varanasi, thanjavur, desert } from '@/assets/images';

interface YatraItem {
  id: string;
  title: string;
  description: string;
  duration: string;
  departure: string;
  travelMode: string;
  imageUrl: string;
}

const upcomingYatras: YatraItem[] = [
  {
    id: 'kedarnath-badrinath',
    title: 'Himalayan Awakening: Kedarnath & Badrinath',
    description: 'A soul-stirring trek through the high peaks of the Garhwal Himalayas. Visit the ancient shrines of Lord Shiva and Lord Vishnu amidst pristine natural beauty.',
    duration: '12 Days',
    departure: 'Haridwar / Rishikesh',
    travelMode: 'Luxury Coach & Trek',
    imageUrl: kedarnath,
  },
  {
    id: 'kashi-experience',
    title: 'The Eternal Kashi Experience',
    description: 'Explore the oldest living city in the world. Witness the magical Ganga Aarti, visit the Kashi Vishwanath temple, and walk the mystical lanes of Varanasi.',
    duration: '7 Days',
    departure: 'Varanasi',
    travelMode: 'AC Coach & Boat',
    imageUrl: varanasi,
  },
  {
    id: 'southern-bharat',
    title: 'Temple Trails of Southern Bharat',
    description: 'A journey through the architectural marvels of the Chola and Pandya dynasties. Experience the grandeur of Madurai Meenakshi and Rameswaram.',
    duration: '10 Days',
    departure: 'Chennai',
    travelMode: 'Flight & Luxury Coach',
    imageUrl: thanjavur,
  },
  {
    id: 'rajasthan-retreat',
    title: 'Desert Silence: Rajasthan Retreat',
    description: 'A contemplative retreat into the silence of the desert. Meditation sessions under the starlit sky and visits to the sacred Pushkar lake.',
    duration: '5 Days',
    departure: 'Jaipur',
    travelMode: 'AC Sleeper Coach',
    imageUrl: desert,
  },
];

export const UpcomingPilgrimages: React.FC = () => {
  return (
    <section id="upcoming" className="pt-12 md:pt-16 pb-20 md:pb-28 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto bg-surface">
      <div className="text-center max-w-3xl mx-auto mb-16 md:mb-24">
        <span className="font-label-caps text-xs tracking-[0.2em] text-secondary mb-3 block uppercase font-semibold">
          DIVINE JOURNEYS
        </span>
        <h2 className="font-display-lg text-3xl sm:text-4xl md:text-5xl font-bold text-primary mb-4 tracking-tight">
          Upcoming Sacred Pilgrimages
        </h2>
        <p className="font-body-lg text-lg text-on-surface-variant font-light">
          Every pilgrimage is carefully organized under the divine guidance of Gurudev Ji.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
        {upcomingYatras.map((yatra) => (
          <div
            key={yatra.id}
            className="group bg-surface rounded-2xl overflow-hidden border border-outline-variant/30 hover:border-[#C98B1A]/50 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-500 flex flex-col h-full"
          >
            {/* Identical Image Height */}
            <div className="relative h-72 w-full shrink-0 overflow-hidden bg-surface-container-low">
              <img
                className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                alt={yatra.title}
                src={yatra.imageUrl}
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-300"></div>
              
              {/* Coming Soon Badge */}
              <div className="absolute top-4 left-4 bg-[#C98B1A] text-white px-3.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase shadow-md border border-white/20">
                COMING SOON
              </div>
            </div>

            {/* Card Body with Equal Height Flex Grow */}
            <div className="p-8 flex-grow flex flex-col justify-between bg-surface">
              <div>
                {/* Temple Name */}
                <h3 className="font-display-lg text-xl md:text-2xl font-bold text-[#3a2d00] group-hover:text-[#C98B1A] transition-colors duration-300 mb-3 leading-snug">
                  {yatra.title}
                </h3>

                {/* Description */}
                <p className="font-body-md text-on-surface-variant text-sm leading-relaxed mb-6 font-light">
                  {yatra.description}
                </p>

                {/* Information Rows */}
                <div className="space-y-2.5 py-4 my-4 border-y border-outline-variant/30 text-xs text-on-surface-variant bg-[#f5efe4]/40 -mx-8 px-8">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold tracking-wider text-secondary uppercase text-[11px]">Duration</span>
                    <span className="font-medium text-on-surface">{yatra.duration}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold tracking-wider text-secondary uppercase text-[11px]">Departure</span>
                    <span className="font-medium text-on-surface">{yatra.departure}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold tracking-wider text-secondary uppercase text-[11px]">Travel Mode</span>
                    <span className="font-medium text-on-surface">{yatra.travelMode}</span>
                  </div>
                </div>
              </div>

              {/* Card Footer: Aligned at bottom */}
              <div className="mt-auto pt-5 border-t border-outline-variant/30 flex items-center justify-between gap-3">
                <span className="text-[#C98B1A] font-semibold text-xs sm:text-sm tracking-wide">
                  Registration Opening Soon
                </span>
                
                <Link
                  to={`/yatras/${yatra.id}`}
                  className="inline-flex items-center gap-1.5 bg-[#f5efe4] group-hover:bg-[#C98B1A] text-[#3a2d00] group-hover:text-white px-4 py-2.5 rounded-xl font-bold text-xs tracking-wider uppercase transition-all duration-300 shadow-sm hover:shadow shrink-0"
                >
                  <span>Know More</span>
                  <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
