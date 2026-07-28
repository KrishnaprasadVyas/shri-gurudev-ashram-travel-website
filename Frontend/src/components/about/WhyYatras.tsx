import React from 'react';
import { Footprints, Users, Leaf } from 'lucide-react';
import { ReadMore } from '../shared/ReadMore';

export const WhyYatras: React.FC = () => {
  return (
    <section className="bg-surface-container-low py-16 md:py-section-gap">
      <div className="px-4 md:px-margin-desktop max-w-container-max mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
          <div className="order-2 lg:order-1 rounded-xl overflow-hidden shadow-sm aspect-video lg:aspect-square relative">
            <img className="w-full h-full object-cover" alt="" src="/assets/TULSI MALA.jpg" loading="lazy" />
            <div className="absolute inset-0 bg-primary/10 mix-blend-multiply"></div>
          </div>
          
          <div className="order-1 lg:order-2">
            <span className="font-label-caps text-label-caps text-secondary mb-2 block tracking-widest">THE PURPOSE</span>
            <h2 className="font-headline-md text-headline-md text-primary mb-6">Why We Organize Yatras</h2>
            <div className="space-y-6 text-on-surface-variant leading-relaxed font-body-md">
              <ReadMore>
                <p>
                  A Yatra is more than tourism; it is a moving meditation. In the scriptures, pilgrimage is described as 'Tirth Yatra'—the crossing over from the mundane to the divine.
                </p>
                <ul className="space-y-6 mt-6">
                  <li className="flex gap-4 items-start">
                    <div className="bg-primary-container/20 p-2.5 rounded-full text-primary shrink-0">
                      <Footprints className="w-5 h-5" strokeWidth={1.5} />
                    </div>
                    <div>
                      <strong className="text-on-surface block mb-1">Breaking the Routine</strong>
                      <p className="text-sm">Stepping away from daily life breaks the habitual patterns of the mind, making it receptive to higher frequencies.</p>
                    </div>
                  </li>
                  <li className="flex gap-4 items-start">
                    <div className="bg-primary-container/20 p-2.5 rounded-full text-primary shrink-0">
                      <Users className="w-5 h-5" strokeWidth={1.5} />
                    </div>
                    <div>
                      <strong className="text-on-surface block mb-1">Power of Sangha (Community)</strong>
                      <p className="text-sm">Traveling with fellow devotees amplifies spiritual energy. The collective chants and shared silence create an uplifting atmosphere.</p>
                    </div>
                  </li>
                  <li className="flex gap-4 items-start">
                    <div className="bg-primary-container/20 p-2.5 rounded-full text-primary shrink-0">
                      <Leaf className="w-5 h-5" strokeWidth={1.5} />
                    </div>
                    <div>
                      <strong className="text-on-surface block mb-1">Sacred Geography</strong>
                      <p className="text-sm">We visit energy centers consecrated by enlightened masters over millennia. These places have the power to instantly quiet the mind.</p>
                    </div>
                  </li>
                </ul>
              </ReadMore>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
