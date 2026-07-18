import React from 'react';
import { motion } from 'framer-motion';

const stats = [
  { value: '20+', label: 'Years of Seva' },
  { value: '5000+', label: 'Devotees' },
  { value: '100+', label: 'Spiritual Camps' },
  { value: '50+', label: 'Sacred Yatras' },
];

export const Statistics: React.FC = () => {
  return (
    <section className="bg-surface pt-4 pb-16 md:pt-6 md:pb-20 border-b border-outline-variant/30">
      <div className="max-w-container-max mx-auto px-margin-desktop">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          viewport={{ once: true, amount: 0.3 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x-0 md:divide-x divide-outline-variant/30"
        >
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: i * 0.08, ease: 'easeOut' }}
              viewport={{ once: true }}
              className="space-y-2"
            >
              <p className="font-display-lg text-4xl text-primary">{stat.value}</p>
              <p className="section-eyebrow text-secondary">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
