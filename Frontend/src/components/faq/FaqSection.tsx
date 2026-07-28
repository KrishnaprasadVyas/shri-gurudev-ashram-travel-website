import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, Search } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════
   FAQ DATA
   ═══════════════════════════════════════════════════════════ */

export type FaqCategory = 'All' | 'Yatras' | 'Registration' | 'Ashram' | 'Accommodation' | 'Donations' | 'Contact';

interface FaqItem {
  question: string;
  answer: string;
  category: FaqCategory;
}

const faqData: FaqItem[] = [
  // ── Yatras ──
  {
    category: 'Yatras',
    question: 'Who can participate in a Yatra organized by the Ashram?',
    answer: 'All devotees are welcome to join our Sacred Yatras regardless of age or background. We encourage families, individuals, and groups to participate. Every Yatra is conducted under Gurudev Ji\'s blessings with an emphasis on devotion, discipline, and community.',
  },
  {
    category: 'Yatras',
    question: 'How do I register for an upcoming Yatra?',
    answer: 'You can register by visiting the Ashram office at Palaskhed Sapkal, contacting our volunteers via phone, or by creating an account on our website. Once registration opens for a specific Yatra, announcements are made through our social media channels and at the Ashram during daily satsang.',
  },
  {
    category: 'Yatras',
    question: 'When are new Yatras announced?',
    answer: 'New Yatras are announced during special occasions, festivals, and through the Ashram\'s official communication channels. We recommend following our Facebook page and YouTube channel for the latest updates. Announcements are also made during daily evening satsang at the Ashram.',
  },
  {
    category: 'Yatras',
    question: 'What should I carry for a Yatra?',
    answer: 'We recommend carrying comfortable clothing suitable for temple visits, personal medications, a copy of your Aadhaar card, warm clothing for hill station Yatras, and personal hygiene items. A detailed packing guide is shared with all registered participants before departure.',
  },
  {
    category: 'Yatras',
    question: 'Are meals included during the Yatra?',
    answer: 'Yes. Pure Sattvic vegetarian meals are arranged throughout the Yatra. Breakfast, lunch, and dinner are provided. The meals are prepared with care following the principles of Annadan (sacred food offering). Special dietary needs can be communicated during registration.',
  },
  {
    category: 'Yatras',
    question: 'Is medical assistance available during Yatras?',
    answer: 'Yes. A basic first-aid kit and common medicines are always carried by our seva volunteers. For Yatras to remote or high-altitude locations, we coordinate with local medical facilities. Devotees with pre-existing health conditions are advised to carry their own prescribed medications and inform us during registration.',
  },

  // ── Ashram ──
  {
    category: 'Ashram',
    question: 'Can I visit the Ashram without joining a Yatra?',
    answer: 'Absolutely. माँ वैष्णवी टूरिज़्म at Palaskhed Sapkal welcomes all visitors and devotees throughout the year. You can attend daily satsang, Gita Path, Haripath, participate in Annadan seva, and seek darshan during regular visiting hours.',
  },
  {
    category: 'Ashram',
    question: 'What are the Darshan timings at the Ashram?',
    answer: 'Morning session is from 04:30 AM to 01:00 PM and evening session is from 04:30 PM to 09:00 PM. Kakda Aarti begins at 04:00 AM, Daily Morning Aarti at 06:00 AM, Haripath at 06:00 PM, and Gita Path at 08:00 PM. Timings may vary during special occasions and festivals.',
  },
  {
    category: 'Ashram',
    question: 'Can families with children visit the Ashram?',
    answer: 'Yes, families with children of all ages are warmly welcomed. The Ashram provides a serene and safe environment. Children are encouraged to participate in bhajans, seva activities, and learn about our spiritual traditions in a joyful setting.',
  },

  // ── Registration ──
  {
    category: 'Registration',
    question: 'What documents are required for Yatra registration?',
    answer: 'You will need a valid government-issued photo ID (Aadhaar card preferred), a recent passport-size photograph, and emergency contact details. For Yatras to certain regions, additional documents may be required, which will be communicated at the time of registration.',
  },
  {
    category: 'Registration',
    question: 'Can I cancel my registration after confirming?',
    answer: 'Yes, you may cancel your registration by contacting the Ashram office. We request that you inform us as early as possible so that the seat can be offered to another devotee. Specific terms regarding any advance amounts paid will be communicated by the Ashram office.',
  },

  // ── Accommodation ──
  {
    category: 'Accommodation',
    question: 'What kind of accommodation is provided during Yatras?',
    answer: 'We arrange clean, comfortable dharamshala-style accommodations or hotel stays depending on the Yatra destination. Rooms are typically shared among devotees to foster community spirit. Families are accommodated together whenever possible.',
  },
  {
    category: 'Accommodation',
    question: 'Can I stay at the Ashram overnight?',
    answer: 'Yes, the Ashram offers accommodation for visiting devotees. Simple, clean rooms are available. Meals are provided through our Annadan seva. We recommend contacting the Ashram office in advance to arrange your stay, especially during festivals and special events.',
  },

  // ── Donations ──
  {
    category: 'Donations',
    question: 'How can I donate to माँ वैष्णवी टूरिज़्म?',
    answer: 'Donations can be made directly at the Ashram office, via bank transfer to the official account, or through our website. All donations support our seva initiatives including Annadan, Gaushala, Education, Medical Service, and Sacred Yatras.',
  },
  {
    category: 'Donations',
    question: 'Will I receive a receipt for my donation?',
    answer: 'Yes. Official receipts are issued for all donations. For donations made via bank transfer, you will receive a digital receipt on your registered contact details. Tax exemption certificates under Section 80G are provided where applicable.',
  },

  // ── Contact ──
  {
    category: 'Contact',
    question: 'How can I contact the Ashram for further queries?',
    answer: 'You can reach us at +91 9158740007 or +91 9834151577, or email us at info@shrigurudevashram.org. You may also visit the Ashram in person at Palaskhed Sapkal, Tehsil Chikhli, District Buldhana, Maharashtra – 443001.',
  },
  {
    category: 'Contact',
    question: 'Does the Ashram have official social media channels?',
    answer: 'Yes. You can follow us on Facebook (Swami Harichaitanyanand S), YouTube (@shrigurudevashram), Instagram (@swami_harichaitanyaji_), and X/Twitter (@Harichaitanyaji). These channels share Ashram updates, satsang recordings, Yatra announcements, and spiritual discourses.',
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
}> = ({ item, isOpen, onToggle }) => {
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
                  {item.category}
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
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<FaqCategory>('All');
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const filteredFaqs = useMemo(() => {
    let result = faqData;

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
  }, [activeCategory, searchQuery]);

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="pt-0 pb-section-gap px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto bg-surface">
      {/* ── Search Bar ── */}
      <div className="max-w-2xl mx-auto mb-12">
        <div className="relative group">
          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#C98B1A] transition-colors duration-300 group-focus-within:text-[#C98B1A]">
            <Search className="w-5 h-5" strokeWidth={2} />
          </div>
          <input
            type="text"
            placeholder="Search your question..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setOpenIndex(null);
            }}
            className="w-full pl-14 pr-6 py-4 sm:py-5 bg-surface border border-outline-variant/40 rounded-2xl text-on-surface placeholder:text-on-surface-variant/50 font-body-md text-base shadow-sm focus:shadow-lg focus:shadow-[#C98B1A]/10 focus:border-[#C98B1A]/50 focus:outline-none transition-all duration-300 focus-ring"
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
            className={`px-5 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold tracking-wider uppercase transition-all duration-300 select-none cursor-pointer focus-ring ${
              activeCategory === cat
                ? 'bg-primary text-on-primary shadow-md'
                : 'bg-surface-container-low text-on-surface-variant border border-outline-variant/30 hover:border-primary/30 hover:text-primary hover:-translate-y-0.5'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ── FAQ Accordions ── */}
      <div className="max-w-3xl mx-auto space-y-4">
        {filteredFaqs.length > 0 ? (
          filteredFaqs.map((faq, index) => (
            <FaqAccordionItem
              key={faq.question}
              item={faq}
              isOpen={openIndex === index}
              onToggle={() => handleToggle(index)}
            />
          ))
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
              No questions found
            </h3>
            <p className="text-on-surface-variant text-sm font-light">
              Try adjusting your search or selecting a different category.
            </p>
          </motion.div>
        )}
      </div>
    </section>
  );
};
