import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Heart, HandHeart, Sparkles, Users } from 'lucide-react';

const valueCards = [
  {
    icon: Heart,
    title: 'Bhakti',
    desc: 'Unwavering devotion and surrender to the divine will in every step.',
  },
  {
    icon: HandHeart,
    title: 'Seva',
    desc: 'Selfless service to fellow travelers and the sacred environments we visit.',
  },
  {
    icon: Sparkles,
    title: 'Sadhana',
    desc: 'Maintaining spiritual discipline, meditation, and silence even amidst the journey.',
  },
  {
    icon: Users,
    title: 'Sanskar',
    desc: 'Upholding righteous conduct, moral values, and traditional teachings in daily life.',
  },
];

export const Values: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 768);
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  return (
    <section className="py-section-gap px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
      <div className="text-center mb-16">
        <span className="section-eyebrow">Our Pillars</span>
        <h2 className="section-heading">Guiding Values on the Path</h2>
        <p className="section-desc max-w-xl mx-auto">
          Four timeless principles that shape every Yatra, every Seva, and every moment at the Ashram.
        </p>
      </div>
      
      <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnimatePresence mode="popLayout">
          {valueCards.map((card, index) => {
            const shouldRender = isDesktop || isExpanded || index < 1;
            if (!shouldRender) return null;

            return (
              <motion.div
                key={card.title}
                layout
                initial={!isDesktop && index >= 1 ? { opacity: 0, y: 30 } : false}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ 
                  duration: 0.5, 
                  ease: [0.21, 0.47, 0.32, 0.98],
                  delay: !isDesktop && index >= 1 ? (index - 1) * 0.1 : 0 
                }}
                className="card-sacred p-8 text-center flex flex-col items-center"
              >
                <card.icon className="w-12 h-12 text-primary mb-4" strokeWidth={1.5} aria-hidden="true" />
                <h3 className="font-headline-sm text-primary mb-2">{card.title}</h3>
                <p className="text-sm text-on-surface-variant">{card.desc}</p>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {/* View More Toggle */}
      {!isDesktop && valueCards.length > 1 && (
        <motion.button
          layout
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-6 w-full flex items-center justify-center gap-2 py-4 border-y border-outline-variant/30 text-[#C98B1A] hover:bg-[#C98B1A]/5 active:bg-[#C98B1A]/10 transition-colors focus-ring min-h-[44px]"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-5 h-5" />
              <span className="font-label-caps text-xs tracking-wider uppercase font-bold">Show Less</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-5 h-5" />
              <span className="font-label-caps text-xs tracking-wider uppercase font-bold">View All Pillars</span>
            </>
          )}
        </motion.button>
      )}
    </section>
  );
};
