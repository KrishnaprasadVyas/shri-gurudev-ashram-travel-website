import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export const Newsletter: React.FC = () => {
  return (
    <section className="mt-section-gap max-w-container-max mx-auto px-margin-desktop text-center">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        viewport={{ once: true, amount: 0.2 }}
        className="bg-surface-container-low p-12 md:p-16 rounded-3xl border border-outline-variant/30 relative overflow-hidden flex flex-col items-center"
      >
        {/* Subtle radial glow */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(201,139,26,0.04)_0%,transparent_70%)]" />
        
        <div className="relative z-10 max-w-3xl flex flex-col items-center">
          {/* Logo above the heading */}
          <div className="mb-6">
            <img
              src="/assets/Ashram vector logo_2022_white-01.png"
              alt="Shri Gurudev Ashram Logo"
              className="h-20 w-20 object-contain select-none drop-shadow-[0_3px_10px_rgba(117,91,0,0.22)] filter brightness-95"
            />
          </div>
          
          <h2 className="font-display-lg text-primary text-[28px] sm:text-[34px] md:text-[38px] font-bold mb-6 leading-tight">
            Take the First Step Towards a Sacred Journey
          </h2>
          
          <p className="font-body-lg text-on-surface-variant mb-10 max-w-2xl text-center leading-relaxed">
            Every Yatra begins with a single step of faith.
            <span className="block mt-2">
              Join माँ वैष्णवी टूरिज़्म and experience sacred pilgrimages guided by devotion, discipline, and selfless service. Travel alongside fellow devotees to some of Bharat's holiest destinations under the blessings of Param Pujya Shri Swami Harichaitanyanand Saraswatiji Maharaj.
            </span>
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full">
            <Link 
              to="/yatras"
              className="btn-primary w-full sm:w-auto justify-center"
            >
              Explore Upcoming Yatras
            </Link>
            <Link 
              to="/contact"
              className="btn-outline w-full sm:w-auto justify-center"
            >
              Contact the Ashram
            </Link>
          </div>
        </div>
      </motion.div>
    </section>
  );
};
