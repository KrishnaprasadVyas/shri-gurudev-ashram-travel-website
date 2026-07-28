import React from 'react';
import { motion } from 'framer-motion';
import { ReadMoreText } from '../shared/ReadMoreText';

export const AshramEthos: React.FC = () => {
  return (
    <section className="py-12 md:py-section-gap px-4 md:px-margin-desktop max-w-container-max mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24 items-center">
        <div className="order-2 md:order-1 space-y-8">
          <div className="space-y-4">
            <span className="section-eyebrow">Founder & Spiritual Guide</span>
            <div className="w-12 h-1 bg-primary"></div>
          </div>

          <div className="font-body-lg text-base md:text-body-lg text-on-surface-variant leading-relaxed space-y-6 max-w-prose">
            <ReadMoreText
              text={`Founder and spiritual guide of <strong>Shri Gurudev Ashram (Palaskhed Sapkal, Chikhli, Buldhana)</strong> and <strong>Swami Harichaitanya Shanti Ashram Trust (Datala, Malkapur)</strong>.\n\nGurudev Ji has shown countless devotees the path of <strong>Bhakti</strong> (Devotion), <strong>Gyan</strong> (Wisdom), and Nishkam <strong>Seva</strong> (Selfless Service).\n\nThrough daily <strong>Satsang</strong>, <strong>Gita Path</strong>, <strong>Haripath</strong>, <strong>Annadan</strong>, <strong>Education</strong>, <strong>Medical Service</strong>, <strong>Gaushala</strong>, <strong>Gurukulam</strong>, <strong>Adivasi Seva</strong>, <strong>Anath Ashram</strong>, and <strong>Seva Tirth Dham</strong>, the Ashram continues to serve society with compassion and dedication.\n\nThe purpose of every seva is the purification of the mind and the upliftment of society.\n\nInspired by Gurudev Ji, the Ashram continues to connect devotees across India through spirituality, service, and sacred Yatras.`}
              characterLimit={200}
            />
            <div className="mt-8 border-l-2 border-primary pl-6 py-2">
              <p className="font-display-lg text-2xl text-primary italic leading-snug">
                "Service to humanity is the highest form of worship."
              </p>
            </div>
          </div>
        </div>

        <div className="order-1 md:order-2 relative flex flex-col items-center mb-4 md:mb-0">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            viewport={{ once: true, amount: 0.3 }}
            className="w-full flex flex-col items-center"
          >
            <div className="w-full aspect-[3/4] lg:aspect-[4/5] rounded-2xl overflow-hidden shadow-xl shadow-primary/5 border border-primary/20 group transform transition-all duration-700 hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary/10">
              <img
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                style={{ objectPosition: '65% -38%' }}
                alt="Param Pujya Shri Swami Harichaitanyanand Saraswatiji Maharaj"
                src="/assets/gurudev.jpg"
                loading="lazy"
              />
            </div>
            <div className="mt-5 text-center font-display-lg text-[22px] sm:text-[28px] md:text-[32px] lg:text-[34px] leading-[1.2] font-semibold text-primary">
              <p>Param Pujya Shri Swami</p>
              <p>Harichaitanyanand Saraswatiji Maharaj</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
