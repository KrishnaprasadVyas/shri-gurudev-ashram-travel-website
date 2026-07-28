import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, MessageCircleQuestion, ClipboardCheck, Compass, Navigation, Landmark, Home } from 'lucide-react';

const steps = [
  { label: 'Inquiry', icon: MessageCircleQuestion },
  { label: 'Registration', icon: ClipboardCheck },
  { label: 'Preparation', icon: Compass },
  { label: 'Departure', icon: Navigation },
  { label: 'Pilgrimage', icon: Landmark },
  { label: 'Return', icon: Home },
];

export const JourneyTimeline: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 640); // sm breakpoint for timeline
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  return (
    <section className="py-20 md:py-28 bg-surface-container-lowest border-y border-outline-variant/20 px-margin-mobile md:px-margin-desktop overflow-hidden">
      <div className="max-w-container-max mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="font-label-caps text-xs tracking-[0.2em] text-secondary mb-3 block uppercase font-semibold">
            SACRED PROCESS
          </span>
          <h2 className="font-display-lg text-3xl sm:text-4xl font-bold text-primary">
            Yatra Journey Timeline
          </h2>
        </div>

        {/* Timeline Grid */}
        <div className="relative max-w-6xl mx-auto">
          {/* Desktop Connecting Line */}
          <div className="hidden lg:block absolute top-[40px] left-[8%] right-[8%] h-[2px] bg-gradient-to-r from-[#C98B1A]/10 via-[#C98B1A] to-[#C98B1A]/10 z-0" />

          {/* Mobile Vertical Connecting Line */}
          <div className="sm:hidden absolute left-[39px] top-8 bottom-8 w-[2px] bg-gradient-to-b from-[#C98B1A]/10 via-[#C98B1A] to-[#C98B1A]/10 z-0" />

          <motion.div layout className="flex flex-col sm:grid sm:grid-cols-3 lg:grid-cols-6 gap-10 sm:gap-8 lg:gap-4 relative z-10">
            <AnimatePresence mode="popLayout">
              {steps.map((step, idx) => {
                const shouldRender = isDesktop || isExpanded || idx < 1;
                if (!shouldRender) return null;

                return (
                  <motion.div
                    key={step.label}
                    layout
                    initial={!isDesktop && idx >= 1 ? { opacity: 0, y: 30 } : { opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ 
                      duration: 0.6, 
                      delay: !isDesktop && idx >= 1 ? (idx - 1) * 0.1 : idx * 0.1, 
                      ease: 'easeOut' 
                    }}
                    viewport={{ once: true, amount: 0.3 }}
                    className="flex flex-row sm:flex-col items-center sm:text-center group relative gap-6 sm:gap-0"
                  >
                    {/* Circular Golden Node with Soft Hover Glow */}
                    <div className="w-20 h-20 rounded-full bg-surface border-2 border-[#C98B1A]/30 group-hover:border-[#C98B1A] group-hover:bg-[#C98B1A] group-hover:text-white text-[#C98B1A] flex items-center justify-center shadow-md group-hover:shadow-[0_0_20px_rgba(201,139,26,0.45)] group-hover:-translate-y-1 transition-all duration-300 sm:mb-4 shrink-0 z-10">
                      <step.icon className="w-7 h-7 transition-transform duration-300 group-hover:scale-110" strokeWidth={1.5} />
                    </div>
                    
                    <div className="flex flex-col text-left sm:text-center">
                      <h4 className="font-display-lg font-bold text-[#3a2d00] text-lg mb-1 tracking-wide group-hover:text-[#C98B1A] transition-colors">
                        {step.label}
                      </h4>
                      
                      <span className="text-[10px] font-semibold text-secondary tracking-widest uppercase opacity-75">
                        Step 0{idx + 1}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* View More Toggle */}
        {!isDesktop && steps.length > 1 && (
          <motion.button
            layout
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-12 w-full flex items-center justify-center gap-2 py-4 border-y border-outline-variant/30 text-[#C98B1A] hover:bg-[#C98B1A]/5 active:bg-[#C98B1A]/10 transition-colors focus-ring min-h-[44px]"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-5 h-5" />
                <span className="font-label-caps text-xs tracking-wider uppercase font-bold">Show Less</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-5 h-5" />
                <span className="font-label-caps text-xs tracking-wider uppercase font-bold">View Full Timeline</span>
              </>
            )}
          </motion.button>
        )}
      </div>
    </section>
  );
};
