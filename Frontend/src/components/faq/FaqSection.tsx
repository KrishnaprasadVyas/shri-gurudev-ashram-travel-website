import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, Search, ChevronDown, ChevronUp } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════
   FAQ DATA
   ═══════════════════════════════════════════════════════════ */

export type FaqCategory = 'All' | 'Yatras' | 'Registration' | 'Ashram' | 'Accommodation' | 'Donations' | 'Contact';

interface FaqItem {
  question: string;
  answer: string;
  category: FaqCategory;
}

import { useTranslation } from "react-i18next";

export const getFaqData = (t: any): FaqItem[] => [
  // ── Yatras ──
  {
    category: 'Yatras',
    question: t('faq.q1q'),
    answer: t('faq.q1a'),
  },
  {
    category: 'Yatras',
    question: t('faq.q2q'),
    answer: t('faq.q2a'),
  },
  {
    category: 'Yatras',
    question: t('faq.q3q'),
    answer: t('faq.q3a'),
  },
  {
    category: 'Yatras',
    question: t('faq.q4q'),
    answer: t('faq.q4a'),
  },
  {
    category: 'Yatras',
    question: t('faq.q5q'),
    answer: t('faq.q5a'),
  },
  {
    category: 'Yatras',
    question: t('faq.q6q'),
    answer: t('faq.q6a'),
  },

  // ── Ashram ──
  {
    category: 'Ashram',
    question: t('faq.q7q'),
    answer: t('faq.q7a'),
  },
  {
    category: 'Ashram',
    question: t('faq.q8q'),
    answer: t('faq.q8a'),
  },
  {
    category: 'Ashram',
    question: t('faq.q9q'),
    answer: t('faq.q9a'),
  },

  // ── Registration ──
  {
    category: 'Registration',
    question: t('faq.q10q'),
    answer: t('faq.q10a'),
  },
  {
    category: 'Registration',
    question: t('faq.q11q'),
    answer: t('faq.q11a'),
  },

  // ── Accommodation ──
  {
    category: 'Accommodation',
    question: t('faq.q12q'),
    answer: t('faq.q12a'),
  },
  {
    category: 'Accommodation',
    question: t('faq.q13q'),
    answer: t('faq.q13a'),
  },

  // ── Donations ──
  {
    category: 'Donations',
    question: t('faq.q14q'),
    answer: t('faq.q14a'),
  },
  {
    category: 'Donations',
    question: t('faq.q15q', { defaultValue: 'Will I receive a receipt for my donation?' }),
    answer: t('faq.q15a', { defaultValue: 'Yes. Official receipts are issued for all donations. For donations made via bank transfer, you will receive a digital receipt on your registered contact details. Tax exemption certificates under Section 80G are provided where applicable.' }),
  },

  // ── Contact ──
  {
    category: 'Contact',
    question: t('faq.q16q', { defaultValue: 'How can I contact the Ashram for further queries?' }),
    answer: t('faq.q16a', { defaultValue: 'You can reach us at +91 9158740007 or +91 9834151577, or email us at info@shrigurudevashram.org. You may also visit the Ashram in person at Palaskhed Sapkal, Tehsil Chikhli, District Buldhana, Maharashtra – 443001.' }),
  },
  {
    category: 'Contact',
    question: t('faq.q17q', { defaultValue: 'Does the Ashram have official social media channels?' }),
    answer: t('faq.q17a', { defaultValue: 'Yes. You can follow us on Facebook (Swami Harichaitanyanand S), YouTube (@shrigurudevashram), Instagram (@swami_harichaitanyaji_), and X/Twitter (@Harichaitanyaji). These channels share Ashram updates, satsang recordings, Yatra announcements, and spiritual discourses.' }),
  },
];

const categories: FaqCategory[] = ['All', 'Yatras', 'Registration', 'Ashram', 'Accommodation', 'Donations', 'Contact'];

/* ═══════════════════════════════════════════════════════════
   ACCORDION ITEM
   ═══════════════════════════════════════════════════════════ */

const FaqAccordionItem: React.FC<{
  item: FaqItem;
  isOpen: boolean;
  onToggle: () => void;
  t: any;
}> = ({ item, isOpen, onToggle, t }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.5 }}
      className={`bg-surface rounded-2xl border transition-all duration-300 overflow-hidden ${
        isOpen 
          ? 'border-[#C98B1A]/40 shadow-lg shadow-[#C98B1A]/5' 
          : 'border-outline-variant/30 shadow-sm hover:shadow-md hover:-translate-y-0.5'
      }`}
    >
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between gap-4 px-6 sm:px-8 py-5 sm:py-6 text-left group cursor-pointer focus-ring rounded-2xl"
      >
        <span className={`font-display-lg text-base sm:text-lg font-semibold leading-snug transition-colors duration-300 ${
          isOpen ? 'text-[#C98B1A]' : 'text-[#3a2d00] group-hover:text-[#C98B1A]'
        }`}>
          {item.question}
        </span>
        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
          isOpen 
            ? 'bg-[#C98B1A] text-white shadow-md' 
            : 'bg-[#f5efe4] text-[#C98B1A] group-hover:bg-[#C98B1A]/10'
        }`}>
          {isOpen ? (
            <Minus className="w-4 h-4" strokeWidth={2.5} />
          ) : (
            <Plus className="w-4 h-4" strokeWidth={2.5} />
          )}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="overflow-hidden"
          >
            <div className="px-6 sm:px-8 pb-6 sm:pb-8 pt-0">
              <div className="h-px w-full bg-outline-variant/30 mb-5" />
              <p className="text-on-surface-variant text-sm sm:text-base leading-relaxed font-light">
                {item.answer}
              </p>
              <div className="mt-4 flex items-center gap-2">
                <span className="text-[10px] font-label-caps tracking-widest text-secondary uppercase font-semibold">
                  {item.category === 'All' ? t('faq.all') :
                   item.category === 'Yatras' ? t('faq.yatras') :
                   item.category === 'Registration' ? t('faq.registration') :
                   item.category === 'Ashram' ? t('faq.ashram') :
                   item.category === 'Accommodation' ? t('faq.accommodation') :
                   item.category === 'Donations' ? t('faq.donations') :
                   item.category === 'Contact' ? t('faq.contact') : item.category}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/* ═══════════════════════════════════════════════════════════
   MAIN FAQ SECTION
   ═══════════════════════════════════════════════════════════ */

export const FaqSection: React.FC = () => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<FaqCategory>('All');
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 768);
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  const filteredFaqs = useMemo(() => {
    let result = getFaqData(t);

    if (activeCategory !== 'All') {
      result = result.filter((faq) => faq.category === activeCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (faq) =>
          faq.question.toLowerCase().includes(query) ||
          faq.answer.toLowerCase().includes(query)
      );
    }

    return result;
  }, [activeCategory, searchQuery, t]);

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="pt-0 pb-12 md:pb-section-gap px-4 md:px-margin-desktop max-w-container-max mx-auto bg-surface">
      {/* ── Search Bar ── */}
      <div className="max-w-2xl mx-auto mb-12">
        <div className="relative group">
          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#C98B1A] transition-colors duration-300 group-focus-within:text-[#C98B1A]">
            <Search className="w-5 h-5" strokeWidth={2} />
          </div>
          <input
            type="text"
            placeholder={t('faq.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setOpenIndex(null);
            }}
            className="w-full pl-14 pr-6 py-4 sm:py-5 min-h-[44px] bg-surface border border-outline-variant/40 rounded-2xl text-on-surface placeholder:text-on-surface-variant/50 font-body-md text-base shadow-sm focus:shadow-lg focus:shadow-[#C98B1A]/10 focus:border-[#C98B1A]/50 focus:outline-none transition-all duration-300 focus-ring"
          />
        </div>
      </div>

      {/* ── Category Filters ── */}
      <div className="flex flex-wrap justify-center gap-2.5 sm:gap-3 mb-16">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              setActiveCategory(cat);
              setOpenIndex(null);
            }}
            className={`px-5 sm:px-6 py-2 sm:py-2.5 min-h-[44px] flex items-center justify-center rounded-full text-xs sm:text-sm font-semibold tracking-wider uppercase transition-all duration-300 select-none cursor-pointer focus-ring ${
              activeCategory === cat
                ? 'bg-primary text-on-primary shadow-md'
                : 'bg-surface-container-low text-on-surface-variant border border-outline-variant/30 hover:border-primary/30 hover:text-primary hover:-translate-y-0.5'
            }`}
          >
            {cat === 'All' ? t('faq.all') :
             cat === 'Yatras' ? t('faq.yatras') :
             cat === 'Registration' ? t('faq.registration') :
             cat === 'Ashram' ? t('faq.ashram') :
             cat === 'Accommodation' ? t('faq.accommodation') :
             cat === 'Donations' ? t('faq.donations') :
             cat === 'Contact' ? t('faq.contact') : cat}
          </button>
        ))}
      </div>

      {/* ── FAQ Accordions ── */}
      <motion.div layout className="max-w-3xl mx-auto space-y-4">
        <AnimatePresence mode="popLayout">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq, index) => {
              const shouldRender = isDesktop || isExpanded || index < 4;
              if (!shouldRender) return null;

              return (
                <motion.div
                  key={faq.question}
                  layout
                  initial={!isDesktop && index >= 4 ? { opacity: 0, y: 30 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ 
                    duration: 0.5, 
                    delay: !isDesktop && index >= 4 ? (index - 4) * 0.1 : 0 
                  }}
                  className="w-full"
                >
                  <FaqAccordionItem
                    item={faq}
                    isOpen={openIndex === index}
                    onToggle={() => handleToggle(index)}
                    t={t}
                  />
                </motion.div>
              );
            })
          ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="w-16 h-16 rounded-full bg-[#f5efe4] flex items-center justify-center mx-auto mb-4">
              <Search className="w-7 h-7 text-[#C98B1A]" strokeWidth={1.5} />
            </div>
            <h3 className="font-display-lg text-xl font-bold text-[#3a2d00] mb-2">
              {t('faq.noResultsTitle')}
            </h3>
            <p className="text-on-surface-variant text-sm font-light">
              {t('faq.noResultsDesc')}
            </p>
          </motion.div>
        )}
        </AnimatePresence>
      </motion.div>

      {/* View More Toggle */}
      {!isDesktop && filteredFaqs.length > 4 && (
        <motion.button
          layout
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-8 mb-4 max-w-3xl mx-auto w-full flex items-center justify-center gap-2 py-4 border-y border-outline-variant/30 text-[#C98B1A] hover:bg-[#C98B1A]/5 active:bg-[#C98B1A]/10 transition-colors focus-ring min-h-[44px]"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-5 h-5" />
              <span className="font-label-caps text-xs tracking-wider uppercase font-bold">{t('faq.showLess')}</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-5 h-5" />
              <span className="font-label-caps text-xs tracking-wider uppercase font-bold">{t('faq.viewMore')}</span>
            </>
          )}
        </motion.button>
      )}
    </section>
  );
};
