import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ReadMoreProps {
  text?: string;
  className?: string;
  children?: React.ReactNode;
}

export const ReadMore: React.FC<ReadMoreProps> = ({
  text,
  className = '',
  children,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const paragraphs = text ? text.split('\n\n') : [];

  return (
    <div className="flex flex-col w-full">
      <motion.div
        layout
        className="space-y-4 md:space-y-6 w-full"
      >
        {/* Render the first paragraph. On mobile, it's clamped to 3 lines when collapsed. On desktop, it's never clamped. */}
        {paragraphs.length > 0 && (
          <motion.p
            layout
            className={`${className} ${!isExpanded ? 'line-clamp-3 md:line-clamp-none' : ''}`}
            style={{
              WebkitMaskImage: !isExpanded ? 'linear-gradient(to bottom, black 60%, transparent 100%)' : 'none',
              maskImage: !isExpanded ? 'linear-gradient(to bottom, black 60%, transparent 100%)' : 'none'
            }}
            dangerouslySetInnerHTML={{ __html: paragraphs[0] }}
          />
        )}

        {/* If text is not provided but children are, render them inside the line-clamp container initially if we want? Actually, it's better to just render children conditionally. */}
        {children && !text && (
          <motion.div
            layout
            className={`${className} ${!isExpanded ? 'line-clamp-3 md:line-clamp-none' : ''}`}
            style={{
              WebkitMaskImage: !isExpanded ? 'linear-gradient(to bottom, black 60%, transparent 100%)' : 'none',
              maskImage: !isExpanded ? 'linear-gradient(to bottom, black 60%, transparent 100%)' : 'none'
            }}
          >
            {children}
          </motion.div>
        )}

        {/* Render the rest of the paragraphs */}
        <AnimatePresence initial={false}>
          {paragraphs.slice(1).map((paragraph, idx) => (
            <motion.p
              key={idx}
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className={`${className} ${!isExpanded ? 'hidden md:block' : 'block'}`}
              dangerouslySetInnerHTML={{ __html: paragraph }}
            />
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Mobile-only toggle button */}
      <motion.button
        layout
        onClick={() => setIsExpanded(!isExpanded)}
        className="md:hidden mt-6 w-full flex items-center justify-center gap-2 py-4 border-y border-outline-variant/30 text-[#C98B1A] hover:bg-[#C98B1A]/5 active:bg-[#C98B1A]/10 transition-colors focus-ring min-h-[44px]"
        aria-expanded={isExpanded}
        aria-controls="read-more-content"
      >
        {isExpanded ? (
          <>
            <ChevronUp className="w-5 h-5" />
            <span className="font-label-caps text-xs tracking-wider uppercase font-bold">Read Less</span>
          </>
        ) : (
          <>
            <ChevronDown className="w-5 h-5" />
            <span className="font-label-caps text-xs tracking-wider uppercase font-bold">Read More</span>
          </>
        )}
      </motion.button>
    </div>
  );
};
