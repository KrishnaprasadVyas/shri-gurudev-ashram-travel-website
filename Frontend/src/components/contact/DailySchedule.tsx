import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Sparkles, Flame, BookOpen, Music, ChevronDown, ChevronUp } from 'lucide-react';

export const DailySchedule: React.FC = () => {
  const scheduleItems = [
    {
      title: 'Morning Darshan',
      time: '6:00 AM – 12:00 PM',
      icon: Sun,
      desc: 'Begin your day with peaceful darshan and silent meditation in the main temple hall.',
    },
    {
      title: 'Kakda Aarti',
      time: '5:30 AM',
      icon: Sparkles,
      desc: 'The traditional early morning waking aarti filled with divine chants and cymbals.',
    },
    {
      title: 'Daily Morning Aarti',
      time: '7:30 AM',
      icon: Flame,
      desc: 'Sacred invocation offering light and gratitude to Param Pujya Shri Gurudev.',
    },
    {
      title: 'Haripath',
      time: '4:30 PM',
      icon: Music,
      desc: 'Melodious congregational singing of Saint Dnyaneshwar Maharaj’s sacred abhangs.',
    },
    {
      title: 'Gita Path',
      time: '6:00 PM',
      icon: BookOpen,
      desc: 'Daily recitation and reflection upon the timeless verses of the Shrimad Bhagavad Gita.',
    },
    {
      title: 'Evening Darshan',
      time: '4:00 PM – 8:30 PM',
      icon: Moon,
      desc: 'Serene evening atmosphere concluding with Mangal Aarti and spiritual discourse.',
    },
  ];

  const [isExpanded, setIsExpanded] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 640);
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  return (
    <section className="py-20 md:py-28 bg-[#fffdf8] px-4 sm:px-6 border-t border-outline-variant/20 relative">
      <div className="max-w-6xl mx-auto space-y-16">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="font-label-caps text-xs md:text-sm text-secondary uppercase tracking-[0.25em] block font-semibold">
            Ashram Daily Rhythm
          </span>
          <h2 className="font-display-lg text-3xl sm:text-4xl md:text-5xl text-primary font-bold tracking-tight">
            Darshan & Daily Schedule
          </h2>
          <div className="flex items-center justify-center gap-4 pt-2">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-[#C98B1A]" />
            <span className="text-[#C98B1A] text-lg">ॐ</span>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-[#C98B1A]" />
          </div>
        </div>

        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {scheduleItems.map((item, index) => {
              const shouldRender = isDesktop || isExpanded || index < 1;
              if (!shouldRender) return null;

              const IconComp = item.icon;
              return (
                <motion.div
                  key={item.title}
                  layout
                  initial={!isDesktop && index >= 1 ? { opacity: 0, y: 30 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ 
                    duration: 0.5, 
                    delay: !isDesktop && index >= 1 ? (index - 1) * 0.1 : 0 
                  }}
                  className="rounded-2xl bg-surface-container-lowest p-8 border border-outline-variant/30 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center group relative overflow-hidden"
                >
                  {/* Top golden accent hover bar */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#C98B1A] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                  <div className="w-14 h-14 rounded-2xl bg-[#C98B1A]/10 text-primary flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-on-primary group-hover:scale-110 transition-all duration-300 shadow-inner">
                    <IconComp className="w-6 h-6" />
                  </div>

                  <h3 className="font-headline-sm text-xl font-bold text-primary mb-2">
                    {item.title}
                  </h3>

                  <span className="font-label-caps text-xs tracking-widest text-secondary uppercase font-semibold mb-4 bg-surface px-3 py-1 rounded-full border border-outline-variant/30">
                    {item.time}
                  </span>

                  <p className="font-body-md text-sm text-on-surface-variant leading-relaxed font-light">
                    {item.desc}
                  </p>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {/* View More Toggle */}
        {!isDesktop && scheduleItems.length > 1 && (
          <motion.button
            layout
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-6 mb-4 w-full flex items-center justify-center gap-2 py-4 border-y border-outline-variant/30 text-[#C98B1A] hover:bg-[#C98B1A]/5 active:bg-[#C98B1A]/10 transition-colors focus-ring min-h-[44px]"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-5 h-5" />
                <span className="font-label-caps text-xs tracking-wider uppercase font-bold">Show Less</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-5 h-5" />
                <span className="font-label-caps text-xs tracking-wider uppercase font-bold">View Full Schedule</span>
              </>
            )}
          </motion.button>
        )}
      </div>
    </section>
  );
};
