import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Sparkles, BookOpen, Compass } from 'lucide-react';

export const OurStory: React.FC = () => {
  return (
    <section className="py-section-gap px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto bg-surface overflow-hidden">
      
      {/* Section 1: Gurudev Ji */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] }}
        viewport={{ once: true, amount: 0.1 }}
        className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center mb-28"
      >
        {/* Image Editorial Frame (Left) */}
        <div className="order-1 lg:col-span-5 relative group flex flex-col items-center w-full max-w-[520px] mx-auto mb-10 lg:mb-0">
          {/* Subtle Decorative Background Blob */}
          <div className="absolute -inset-6 bg-primary/5 rounded-[3rem] blur-2xl transition-all duration-700 group-hover:bg-primary/10 pointer-events-none"></div>
          
          <div className="w-full rounded-[2rem] overflow-hidden shadow-2xl relative z-10 aspect-[3/4] border border-outline-variant/30 bg-surface-container-lowest">
            <img 
              className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-[1.03]" 
              style={{ objectPosition: '65% -38%' }}
              alt="Param Pujya Shri Swami Harichaitanyanand Saraswatiji Maharaj" 
              src="/assets/gurudev.jpg" 
              loading="lazy"
            />
            {/* Soft inner shadow for framing */}
            <div className="absolute inset-0 shadow-[inset_0_0_40px_rgba(0,0,0,0.05)] pointer-events-none"></div>
          </div>
          
          <div className="mt-5 text-center font-display-lg text-[22px] sm:text-[28px] md:text-[32px] lg:text-[34px] leading-[1.2] font-semibold text-primary z-10">
            <p>Param Pujya Shri Swami</p>
            <p>Harichaitanyanand Saraswatiji Maharaj</p>
          </div>
        </div>

        {/* Biography Content (Right) */}
        <div className="order-2 lg:col-span-7 lg:pl-10">
          <span className="font-label-caps text-xs tracking-[0.2em] text-secondary mb-4 block uppercase font-semibold">
            Under the Blessings of Gurudev
          </span>
          <div className="space-y-6 text-on-surface-variant leading-relaxed font-body-md text-lg font-light">
            <p>
              Founder and spiritual guide of <strong className="font-medium text-on-surface">Shri Gurudev Ashram (Palaskhed Sapkal, Chikhli, Buldhana)</strong> and <strong className="font-medium text-on-surface">Swami Harichaitanya Shanti Ashram Trust (Datala, Malkapur)</strong>.
            </p>
            <p>
              Gurudev Ji has guided countless devotees on the path of <span className="text-primary font-medium">Bhakti</span> (Devotion), <span className="text-primary font-medium">Gyan</span> (Wisdom), and Nishkam <span className="text-primary font-medium">Seva</span> (Selfless Service), inspiring a life rooted in spirituality, compassion, and discipline.
            </p>
            <p>
              Through daily Satsang, Gita Path, Haripath, and various seva initiatives including <span className="text-primary font-medium">Annadan</span>, Education, Medical Service, <span className="text-primary font-medium">Gaushala</span>, Gurukulam, Adivasi Seva, Anath Ashram, and Seva Tirth Dham, the Ashram continues to serve society with dedication and humility.
            </p>
            <p>
              Every seva undertaken at the Ashram is devoted to the purification of the mind, the welfare of society, and the spiritual upliftment of every individual.
            </p>
            <p>
              Inspired by Gurudev Ji's teachings, the Ashram and its branches continue to connect devotees across different parts of India through faith, service, and <span className="text-primary font-medium">Sacred Yatras</span>.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Section 2: About Our Ashram */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] }}
        viewport={{ once: true, amount: 0.2 }}
        className="max-w-4xl mx-auto text-center font-body-md"
      >
        <h2 className="font-display-lg text-[38px] sm:text-[46px] md:text-[54px] text-primary mb-6 leading-tight font-bold">
          About Shri Gurudev Ashram
        </h2>
        <p className="text-on-surface-variant leading-relaxed font-body-md text-lg font-light max-w-3xl mx-auto mb-12">
          Shri Gurudev Ashram is dedicated to nurturing individual spiritual growth and societal well-being. Under the divine blessings of Gurudev Ji, the Ashram serves devotees through sacred satsangs, traditional teachings, and key social initiatives, alongside organizing sacred Yatras that offer pilgrims an immersive experience of devotion and community.
        </p>

        {/* 4 Highlight Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
          {[
            { title: 'Annadan', desc: 'Selfless food distribution for all seekers.', icon: Heart },
            { title: 'Gau Seva', desc: 'Loving care for cows in our Gaushala.', icon: Sparkles },
            { title: 'Education', desc: 'Gurukulam training and rural youth support.', icon: BookOpen },
            { title: 'Sacred Yatras', desc: 'Devotional pilgrimages across holy nodes.', icon: Compass },
          ].map((item) => (
            <div key={item.title} className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/30 text-center hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-primary-container/20 flex items-center justify-center text-primary mb-3">
                <item.icon className="w-6 h-6" strokeWidth={1.5} />
              </div>
              <h4 className="font-bold text-primary mb-1 text-base">{item.title}</h4>
              <p className="text-xs text-on-surface-variant leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>

    </section>
  );
};
