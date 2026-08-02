import React from 'react';
import { MapPin } from 'lucide-react';
import { useTranslation } from "react-i18next";

export const AshramMap: React.FC = () => {
    const { t } = useTranslation();
  return (
    <section id="ashram-map-section" className="py-20 md:py-28 bg-surface px-4 sm:px-6 relative">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Google Map Embedded inside Rounded Premium Container */}
        <div className="rounded-3xl overflow-hidden border border-outline-variant/30 h-[400px] md:h-[520px] shadow-2xl relative bg-surface-container-lowest">
          <iframe
            title={t('public.contact.mapAlt')}
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3748.8!2d73.79!3d20.00!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjDCsDAwJzAwLjAiTiA3M8KwNDcnMjQuMCJF!5e0!3m2!1sen!2sin!4v1234567890"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

        {/* Location Info Text */}
        <div className="mt-8 text-center max-w-2xl mx-auto">
          <p className="font-body-md text-sm text-on-surface-variant leading-relaxed font-light">
            {t('public.contact.locationDesc')}
          </p>
        </div>
      </div>
    </section>
  );
};
