import React from 'react';
import { Link } from 'react-router-dom';

export const ContactCta: React.FC = () => {
  return (
    <section className="py-20 md:py-28 px-4 sm:px-6 text-center max-w-4xl mx-auto animate-fade-in-up">
      <h2 className="font-display-lg text-3xl sm:text-4xl md:text-5xl text-primary font-bold tracking-tight mb-6">
        We Look Forward to Welcoming You
      </h2>
      <p className="font-body-lg text-base sm:text-lg md:text-xl text-on-surface-variant mb-10 leading-relaxed font-light max-w-2xl mx-auto">
        Whether you are planning your first visit, joining a Sacred Yatra, or seeking spiritual guidance, माँ वैष्णवी टूरिज़्म warmly welcomes every devotee.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <Link
          to="/yatras"
          className="inline-flex items-center justify-center gap-2 bg-primary text-on-primary px-8 py-4 rounded-xl font-label-caps text-xs tracking-widest uppercase hover:bg-secondary transition-all duration-300 shadow-md hover:shadow-lg w-full sm:w-auto active:scale-95"
        >
          Explore Yatras
        </Link>
        <Link
          to="/signup"
          className="inline-flex items-center justify-center gap-2 border-2 border-primary text-primary hover:bg-primary hover:text-on-primary px-8 py-4 rounded-xl font-label-caps text-xs tracking-widest uppercase transition-all duration-300 shadow-sm w-full sm:w-auto active:scale-95"
        >
          Register Free
        </Link>
      </div>
    </section>
  );
};
