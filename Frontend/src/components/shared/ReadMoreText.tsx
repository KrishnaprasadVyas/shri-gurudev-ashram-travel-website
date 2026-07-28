import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface ReadMoreTextProps {
  text: string;
  characterLimit?: number;
  className?: string;
}

export const ReadMoreText: React.FC<ReadMoreTextProps> = ({
  text,
  characterLimit = 200,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const shouldTruncate = text.length > characterLimit;

  const renderText = (content: string) => {
    return content.split('\n\n').map((paragraph, idx) => (
      <p key={idx} className={className} dangerouslySetInnerHTML={{ __html: paragraph }} />
    ));
  };

  if (!shouldTruncate) {
    return <div className="space-y-6">{renderText(text)}</div>;
  }

  // Find a good breaking point (space) to avoid cutting words in half
  let cutPos = characterLimit;
  while (cutPos > 0 && text[cutPos] !== ' ' && text[cutPos] !== '\n') {
    cutPos--;
  }
  if (cutPos === 0) cutPos = characterLimit; // fallback
  
  const truncatedText = text.slice(0, cutPos).trim() + '...';

  return (
    <>
      {/* Desktop View: Always show full text */}
      <div className="hidden md:block space-y-6">
        {renderText(text)}
      </div>

      {/* Mobile View: Expandable */}
      <div className="md:hidden flex flex-col items-center">
        <AnimatePresence initial={false}>
          <motion.div
            key="content"
            initial={false}
            animate={{ height: 'auto' }}
            transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
            className="overflow-hidden space-y-4 w-full"
            style={{ 
              WebkitMaskImage: isExpanded ? 'none' : 'linear-gradient(to bottom, black 60%, transparent 100%)',
              maskImage: isExpanded ? 'none' : 'linear-gradient(to bottom, black 60%, transparent 100%)'
            }}
          >
            {isExpanded ? renderText(text) : renderText(truncatedText)}
          </motion.div>
        </AnimatePresence>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-2 flex items-center justify-center gap-1.5 font-label-caps font-bold text-xs tracking-wider uppercase text-[#B8860B] hover:text-[#8C6A0A] transition-colors py-3 px-6 min-h-[44px] focus-ring active:scale-95"
          aria-expanded={isExpanded}
        >
          {isExpanded ? 'Read Less' : 'Read More'}
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
            className="flex items-center justify-center"
          >
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        </button>
      </div>
    </>
  );
};
