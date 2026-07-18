import { usePageTitle } from '@/hooks/usePageTitle'

import { OurStory } from '@/components/about/OurStory'
import { WhyYatras } from '@/components/about/WhyYatras'
import { Values } from '@/components/about/Values'
import { WhyTravelWithUs } from '@/components/about/WhyTravelWithUs'
import { SacredDestinations } from '@/components/about/SacredDestinations'
import { Testimonials } from '@/components/about/Testimonials'
import { CallToAction } from '@/components/about/CallToAction'

export function AboutPage() {
  usePageTitle('About Us')

  return (
    <div className="font-body-md text-body-md bg-surface text-on-surface w-full ">
      <OurStory />
      <WhyYatras />
      <Values />
      <WhyTravelWithUs />
      <SacredDestinations />
      <Testimonials />
      <CallToAction />
    </div>
  )
}


