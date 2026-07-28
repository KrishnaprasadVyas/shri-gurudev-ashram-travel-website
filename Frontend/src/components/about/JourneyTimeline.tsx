import React from 'react';
import { motion } from 'framer-motion';

export const JourneyTimeline: React.FC = () => {
  return (
    <section className="py-24 md:py-32 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto overflow-hidden">
      <div className="text-center mb-16 animate-fade-in-up">
        <span className="font-label-caps text-label-caps text-secondary mb-2 block tracking-widest">OUR MILESTONES</span>
        <h2 className="font-headline-md text-headline-md text-primary mb-4">Journey Through the Years</h2>
        <p className="text-on-surface-variant max-w-xl mx-auto">Steadfast milestones of our spiritual expansion, guided by divine devotion.</p>
      </div>

      <div className="relative border-l border-[#C98B1A]/30 ml-4 md:ml-[50%] md:-translate-x-[0.5px]">
        {/* Timeline item 1 */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 relative flex items-center md:-translate-x-[50%] md:w-[100%]"
        >
          <div className="absolute w-4.5 h-4.5 bg-[#C98B1A] rounded-full -left-[9.5px] md:left-[50%] md:-translate-x-[9px] ring-4 ring-surface shadow-sm"></div>
          <div className="ml-8 md:ml-0 md:w-[50%] md:pr-12 md:text-right">
            <span className="font-label-caps text-secondary font-bold block mb-1">1992</span>
            <h3 className="font-bold text-lg text-primary mb-2">Ashram Established</h3>
            <p className="text-sm text-on-surface-variant md:ml-auto md:max-w-md">माँ वैष्णवी टूरिज़्म was founded under Maharaj Ji's vision, creating a holy sanctuary of prayer and silent meditation.</p>
          </div>
        </motion.div>

        {/* Timeline item 2 */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 relative flex items-center md:flex-row-reverse md:translate-x-[50%] md:w-[100%]"
        >
          <div className="absolute w-4.5 h-4.5 bg-[#C98B1A] rounded-full -left-[9.5px] md:left-0 md:-translate-x-[9px] ring-4 ring-surface shadow-sm"></div>
          <div className="ml-8 md:ml-0 md:w-[50%] md:pl-12 md:text-left">
            <span className="font-label-caps text-secondary font-bold block mb-1">2005</span>
            <h3 className="font-bold text-lg text-primary mb-2">Beginning of Yatra Tradition</h3>
            <p className="text-sm text-on-surface-variant md:mr-auto md:max-w-md">The sacred Yatra tradition began, leading devout seekers on guided pilgrimages to the holy Himalayas and sacred rivers.</p>
          </div>
        </motion.div>

        {/* Timeline item 3 */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 relative flex items-center md:-translate-x-[50%] md:w-[100%]"
        >
          <div className="absolute w-4.5 h-4.5 bg-[#C98B1A] rounded-full -left-[9.5px] md:left-[50%] md:-translate-x-[9px] ring-4 ring-surface shadow-sm"></div>
          <div className="ml-8 md:ml-0 md:w-[50%] md:pr-12 md:text-right">
            <span className="font-label-caps text-secondary font-bold block mb-1">2018</span>
            <h3 className="font-bold text-lg text-primary mb-2">Thousands of Devotees Guided</h3>
            <p className="text-sm text-on-surface-variant md:ml-auto md:max-w-md">Having served and safely guided over 10,000 pilgrims through deep spiritual practices and sacred chants.</p>
          </div>
        </motion.div>

        {/* Timeline item 4 */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative flex items-center md:flex-row-reverse md:translate-x-[50%] md:w-[100%]"
        >
          <div className="absolute w-4.5 h-4.5 bg-[#C98B1A] rounded-full -left-[9.5px] md:left-0 md:-translate-x-[9px] ring-4 ring-surface shadow-sm"></div>
          <div className="ml-8 md:ml-0 md:w-[50%] md:pl-12 md:text-left">
            <span className="font-label-caps text-secondary font-bold block mb-1">Present</span>
            <h3 className="font-bold text-lg text-primary mb-2">Multiple Sacred Destinations</h3>
            <p className="text-sm text-on-surface-variant md:mr-auto md:max-w-md">Expanding routes across Char Dham, Varanasi, South India, and other holy nodes of Bharat, uniting seekers globally.</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
