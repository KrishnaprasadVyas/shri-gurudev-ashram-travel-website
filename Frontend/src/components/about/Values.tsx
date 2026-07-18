import React from 'react';
import { Heart, HandHeart, Sparkles, Users } from 'lucide-react';

const valueCards = [
  {
    icon: Heart,
    title: 'Bhakti',
    desc: 'Unwavering devotion and surrender to the divine will in every step.',
  },
  {
    icon: HandHeart,
    title: 'Seva',
    desc: 'Selfless service to fellow travelers and the sacred environments we visit.',
  },
  {
    icon: Sparkles,
    title: 'Sadhana',
    desc: 'Maintaining spiritual discipline, meditation, and silence even amidst the journey.',
  },
  {
    icon: Users,
    title: 'Sanskar',
    desc: 'Upholding righteous conduct, moral values, and traditional teachings in daily life.',
  },
];

export const Values: React.FC = () => {
  return (
    <section className="py-section-gap px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
      <div className="text-center mb-16">
        <span className="section-eyebrow">Our Pillars</span>
        <h2 className="section-heading">Guiding Values on the Path</h2>
        <p className="section-desc max-w-xl mx-auto">
          Four timeless principles that shape every Yatra, every Seva, and every moment at the Ashram.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {valueCards.map((card) => (
          <div key={card.title} className="card-sacred p-8 text-center flex flex-col items-center">
            <card.icon className="w-12 h-12 text-primary mb-4" strokeWidth={1.5} aria-hidden="true" />
            <h3 className="font-headline-sm text-primary mb-2">{card.title}</h3>
            <p className="text-sm text-on-surface-variant">{card.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
};
