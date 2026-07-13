import { motion } from 'framer-motion';

// Exquisite Indian Temple Ornamental Divider SVG
const OrnamentalDivider = () => (
  <svg width="340" height="24" viewBox="0 0 340 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto text-[#d09d43] my-4 opacity-90 drop-shadow-sm">
    {/* Left Line */}
    <path d="M0 12H130" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="138" cy="12" r="2.5" fill="currentColor"/>
    <circle cx="148" cy="12" r="1.5" fill="currentColor"/>
    
    {/* Center Ornament (Floral/Diamond) */}
    <path d="M170 1C173 7 177 10 182 12C177 14 173 17 170 23C167 17 163 14 158 12C163 10 167 7 170 1Z" fill="currentColor"/>
    <circle cx="170" cy="12" r="2.5" fill="#fffdf8"/>
    
    {/* Right Line */}
    <circle cx="192" cy="12" r="1.5" fill="currentColor"/>
    <circle cx="202" cy="12" r="2.5" fill="currentColor"/>
    <path d="M210 12H340" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);

// Elegant Lotus SVG Line Art
const LotusOutline = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.2" className={`text-[#d09d43] opacity-80 ${className}`}>
    {/* Center Petal */}
    <path d="M16 28C16 28 8 18 11 10C13 5 16 3 16 3C16 3 19 5 21 10C24 18 16 28 16 28Z" />
    {/* Side Petals */}
    <path d="M16 28C16 28 5 22 3 15C1 8 8 8 11 10" />
    <path d="M16 28C16 28 27 22 29 15C31 8 24 8 21 10" />
    {/* Outer Drooping Petals */}
    <path d="M16 28C16 28 5 28 1 23" />
    <path d="M16 28C16 28 27 28 31 23" />
  </svg>
);

// Tiny Clover/Knot Ornament below English Text
const BottomOrnament = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto text-[#d09d43] mt-8 opacity-90">
    <path d="M12 2C13.5 6 18 10.5 22 12C18 13.5 13.5 18 12 22C10.5 18 6 13.5 2 12C6 10.5 10.5 6 12 2Z" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="12" cy="12" r="2" fill="currentColor"/>
  </svg>
);

export const QuoteSection = () => {
  return (
    <section className="py-section-gap bg-[#fffdf8] flex flex-col items-center justify-center text-center px-margin-mobile relative overflow-visible border-t border-outline-variant/30 min-h-[70vh]">
      
      {/* Cinematic Spiritual Background Image with Fade */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img
          src="/assets/temple_sunrise_bg.png"
          alt=""
          aria-hidden="true"
          className="w-full h-full object-cover scale-105"
          style={{ objectPosition: 'center 30%' }}
          loading="lazy"
        />
        {/* Radial gradient perfectly blending the text center to cream, leaving edges visible */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#fffdf8_30%,_#fffdf8e6_55%,_#fffdf880_80%,_#fffdf840_100%)]"></div>
        {/* Soft warm global tint */}
        <div className="absolute inset-0 bg-[#fffdf8]/30"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
        viewport={{ once: true, amount: 0.2 }}
        className="max-w-5xl mx-auto flex flex-col items-center relative z-10 w-full"
      >
        {/* Om Symbol - Properly padded to prevent bindu clipping */}
        <div className="pt-8 pb-4">
          <span className="font-display-lg text-[7rem] md:text-[8.5rem] text-transparent bg-clip-text bg-gradient-to-b from-[#e88b17] to-[#cba258] drop-shadow-sm leading-normal inline-block select-none">
            ॐ
          </span>
        </div>
        
        <OrnamentalDivider />
        
        {/* Sanskrit Verse in Deep Olive/Brown */}
        <p className="font-display-lg text-5xl md:text-7xl text-[#4a4d3a] my-8 leading-tight drop-shadow-sm px-4">
          ॥ तीर्थी कुर्वन्ति तीर्थानि ॥
        </p>
        
        <OrnamentalDivider />
        
        {/* Transliteration */}
        <p className="font-label-caps text-xs md:text-sm tracking-[0.45em] uppercase text-[#b88636] mt-10 mb-14">
          TĪRTHĪ KURVANTI TĪRTHĀNI
        </p>
        
        {/* English Translation with Side Lotuses */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 w-full px-4">
          <LotusOutline className="hidden md:block w-14 h-14" />
          
          <p className="font-display-lg text-xl md:text-3xl text-[#3b3228] italic max-w-xl mx-auto leading-relaxed">
            It is the devotion of pilgrims<br/>
            that makes a pilgrimage truly sacred.
          </p>
          
          <LotusOutline className="hidden md:block w-14 h-14 -scale-x-100" />
        </div>
        
        <BottomOrnament />
        
      </motion.div>
    </section>
  );
};
