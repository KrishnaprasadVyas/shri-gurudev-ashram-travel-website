import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  kedarnath, 
  stoneTemple, 
  anandaRetreat 
} from '@/assets/images';

interface Destination {
  name: string;
  description: string;
  image: string;
}

const destinations: Destination[] = [
  {
    name: 'Kedarnath',
    description: 'A sacred sanctuary nestled in the snow-clad peaks, home to the eternal Lord Shiva.',
    image: kedarnath,
  },
  {
    name: 'Badrinath',
    description: 'The ancient seat of Lord Vishnu, situated peacefully along the Alaknanda river.',
    image: stoneTemple,
  },
  {
    name: 'Dwarka',
    description: 'The legendary golden kingdom of Lord Krishna standing majestic by the Arabian Sea.',
    image: anandaRetreat,
  },
];

export const SacredDestinations: React.FC = () => {
  return (
    <section className="py-16 md:py-32 px-4 md:px-margin-desktop bg-surface-container-low max-w-container-max mx-auto overflow-hidden">
      <div className="text-center mb-16 max-w-2xl mx-auto">
        <span className="section-eyebrow">Our Sacred Destinations</span>
        <h2 className="section-heading">Our Sacred Destinations</h2>
        <p className="section-desc">
          Discover the divine places where faith, history, and devotion come together.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {destinations.map((dest, idx) => (
          <motion.div
            key={dest.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: idx * 0.1 }}
            className="card-sacred overflow-hidden flex flex-col"
          >
            <div className="aspect-[4/3] w-full overflow-hidden relative">
              <img 
                src={dest.image} 
                alt={`${dest.name} — Sacred Yatra Destination`}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />
            </div>
            
            <div className="p-4 md:p-6 flex-1 flex flex-col justify-between border-t border-amber-900/5">
              <div>
                <h3 className="font-headline-sm text-2xl text-primary font-bold tracking-wide">{dest.name}</h3>
                <span className="font-label-caps text-xs text-secondary tracking-widest uppercase block mt-1.5 mb-3 font-semibold">Sacred Yatra</span>
                <p className="text-sm text-on-surface-variant leading-relaxed font-light">{dest.description}</p>
              </div>
              <div className="mt-6 pt-4 border-t border-outline-variant/20 flex items-center justify-between">
                <span className="text-xs font-label-caps text-secondary font-bold tracking-wider">Coming Soon</span>
                <div className="w-1.5 h-1.5 rounded-full bg-[#C98B1A]" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="text-center mt-12">
        <Link 
          to="/yatras" 
          className="btn-primary"
        >
          <span>Explore All Yatras</span>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </Link>
      </div>
    </section>
  );
};
