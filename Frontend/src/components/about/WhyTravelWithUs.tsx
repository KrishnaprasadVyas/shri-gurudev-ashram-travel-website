import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { BookOpen, Heart, Users, Sparkles, Activity, Utensils } from 'lucide-react';

const features = [
  {
    icon: Sparkles,
    title: 'Daily Satsang',
    desc: 'Immerse yourself in daily spiritual discourses and guided meditation sessions.',
  },
  {
    icon: Utensils,
    title: 'Annadan',
    desc: 'Participate in the continuous selfless service of providing food to all seekers and the needy.',
  },
  {
    icon: BookOpen,
    title: 'Gurukul',
    desc: 'Supporting traditional education and spiritual training for the next generation.',
  },
  {
    icon: Heart,
    title: 'Gau Shala',
    desc: 'Dedicated loving care and protection for sacred cows within the Ashram premises.',
  },
  {
    icon: Activity,
    title: 'Medical Service',
    desc: 'Providing essential healthcare and free medical camps for rural and underserved communities.',
  },
  {
    icon: Users,
    title: 'Adiwasi Seva',
    desc: 'Uplifting tribal communities through dedicated social initiatives and continuous support.',
  },
];

export const WhyTravelWithUs: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 768);
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  return (
    <section className="bg-surface-container py-16 md:py-section-gap px-4 md:px-margin-desktop">
      <div className="max-w-container-max mx-auto">
        <div className="text-center mb-16">
          <span className="section-eyebrow">The Difference</span>
          <h2 className="section-heading max-w-2xl mx-auto">What Makes Us Different</h2>
        </div>

        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          <AnimatePresence mode="popLayout">
            {features.map((feat, index) => {
              const shouldRender = isDesktop || isExpanded || index < 1;
              if (!shouldRender) return null;

              return (
                <motion.div
                  key={feat.title}
                  layout
                  initial={!isDesktop && index >= 1 ? { opacity: 0, y: 30 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ 
                    duration: 0.5, 
                    ease: [0.21, 0.47, 0.32, 0.98],
                    delay: !isDesktop && index >= 1 ? (index - 1) * 0.1 : 0 
                  }}
                  className="card-sacred p-8 flex gap-6"
                >
                  <div className="w-14 h-14 rounded-full bg-primary-container/20 flex items-center justify-center shrink-0 text-primary">
                    <feat.icon className="w-6 h-6" strokeWidth={1.5} aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-primary mb-2">{feat.title}</h3>
                    <p className="text-on-surface-variant text-sm leading-relaxed">{feat.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {/* View More Toggle */}
        {!isDesktop && features.length > 1 && (
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
                <span className="font-label-caps text-xs tracking-wider uppercase font-bold">View More</span>
              </>
            )}
          </motion.button>
        )}
      </div>
    </section>
  );
};

