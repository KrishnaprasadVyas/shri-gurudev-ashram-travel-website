import React from 'react';
import { BookOpen, Heart, Users, Sparkles, Activity, Utensils } from 'lucide-react';

const features = [
  {
    icon: Sparkles,
    title: 'Daily Satsang',
    desc: 'Immerse yourself in daily spiritual discourses and guided meditation sessions.',
  },
  {
    icon: Utensils,
    title: 'Annadan',
    desc: 'Participate in the continuous selfless service of providing food to all seekers and the needy.',
  },
  {
    icon: BookOpen,
    title: 'Gurukul',
    desc: 'Supporting traditional education and spiritual training for the next generation.',
  },
  {
    icon: Heart,
    title: 'Gau Shala',
    desc: 'Dedicated loving care and protection for sacred cows within the Ashram premises.',
  },
  {
    icon: Activity,
    title: 'Medical Service',
    desc: 'Providing essential healthcare and free medical camps for rural and underserved communities.',
  },
  {
    icon: Users,
    title: 'Adiwasi Seva',
    desc: 'Uplifting tribal communities through dedicated social initiatives and continuous support.',
  },
];

export const WhyTravelWithUs: React.FC = () => {
  return (
    <section className="bg-surface-container py-section-gap px-margin-mobile md:px-margin-desktop">
      <div className="max-w-container-max mx-auto">
        <div className="text-center mb-16">
          <span className="section-eyebrow">The Difference</span>
          <h2 className="section-heading max-w-2xl mx-auto">What Makes Us Different</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feat) => (
            <div key={feat.title} className="card-sacred p-8 flex gap-6">
              <div className="w-14 h-14 rounded-full bg-primary-container/20 flex items-center justify-center shrink-0 text-primary">
                <feat.icon className="w-6 h-6" strokeWidth={1.5} aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-primary mb-2">{feat.title}</h3>
                <p className="text-on-surface-variant text-sm leading-relaxed">{feat.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

