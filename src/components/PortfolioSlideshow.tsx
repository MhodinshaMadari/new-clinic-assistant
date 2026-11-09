import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface PortfolioSlideshowProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  autoSlideIntervalMs?: number;
  keyExtractor?: (item: T, index: number) => string;
  themeColor?: 'blue' | 'teal';
  itemLabelSingular?: string;
  itemLabelPlural?: string;
  headerRightContent?: React.ReactNode;
  className?: string;
}

export function PortfolioSlideshow<T>({
  items,
  renderItem,
  autoSlideIntervalMs = 3000,
  keyExtractor,
  themeColor = 'blue',
  itemLabelSingular = 'item',
  itemLabelPlural = 'items',
  headerRightContent,
  className = ''
}: PortfolioSlideshowProps<T>) {
  // Responsive batch size: 4 for desktop (>=1024), 2 for tablet (640-1023), 1 for mobile (<640)
  const [itemsPerPage, setItemsPerPage] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth >= 1024) return 4;
      if (window.innerWidth >= 640) return 2;
      return 1;
    }
    return 4;
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width >= 1024) {
        setItemsPerPage(4);
      } else if (width >= 640) {
        setItemsPerPage(2);
      } else {
        setItemsPerPage(1);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const totalBatches = useMemo(() => {
    return Math.max(1, Math.ceil(items.length / itemsPerPage));
  }, [items.length, itemsPerPage]);

  const [currentBatchIndex, setCurrentBatchIndex] = useState<number>(0);
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isUserPaused, setIsUserPaused] = useState<boolean>(false);

  // Keep batch index clamped if items change
  useEffect(() => {
    setCurrentBatchIndex((prev) => {
      if (prev >= totalBatches) {
        return Math.max(0, totalBatches - 1);
      }
      return prev;
    });
  }, [totalBatches]);

  // Navigate functions
  const handleNext = useCallback(() => {
    setDirection('right');
    setCurrentBatchIndex((prev) => (prev + 1) % totalBatches);
  }, [totalBatches]);

  const handlePrev = useCallback(() => {
    setDirection('left');
    setCurrentBatchIndex((prev) => (prev - 1 + totalBatches) % totalBatches);
  }, [totalBatches]);

  const handleJumpToBatch = useCallback((index: number) => {
    setDirection(index > currentBatchIndex ? 'right' : 'left');
    setCurrentBatchIndex(index);
  }, [currentBatchIndex]);

  // Auto-advance loop (3 seconds by default)
  useEffect(() => {
    if (totalBatches <= 1 || isHovered || isUserPaused) {
      return;
    }

    const timer = setInterval(() => {
      handleNext();
    }, autoSlideIntervalMs);

    return () => clearInterval(timer);
  }, [totalBatches, isHovered, isUserPaused, autoSlideIntervalMs, handleNext]);

  // Batch item slice
  const startIndex = currentBatchIndex * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, items.length);
  const currentBatchItems = useMemo(() => {
    return items.slice(startIndex, endIndex);
  }, [items, startIndex, endIndex]);

  // Formatted counter: e.g. "Batch 1 of 4 (1-4 of 14)"
  const counterText = useMemo(() => {
    if (items.length === 0) return '0 items';
    return `Batch ${currentBatchIndex + 1} of ${totalBatches} (${startIndex + 1}–${endIndex} of ${items.length})`;
  }, [currentBatchIndex, totalBatches, startIndex, endIndex, items.length]);

  const isTeal = themeColor === 'teal';

  if (items.length === 0) {
    return null;
  }

  return (
    <div 
      className={`space-y-4 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocusCapture={() => setIsHovered(true)}
      onBlurCapture={() => setIsHovered(false)}
    >
      {/* Slideshow Top Controls Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        {/* Left: Counter & Status */}
        <div className="flex items-center space-x-2.5">
          <div className="flex items-center space-x-2 text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
            <span className={`inline-block w-2 h-2 rounded-full ${
              !isHovered && !isUserPaused && totalBatches > 1
                ? isTeal ? 'bg-teal-500 animate-pulse' : 'bg-revon-blue animate-pulse'
                : 'bg-slate-400 dark:bg-slate-600'
            }`} />
            <span>{counterText}</span>
          </div>

          {totalBatches > 1 && (
            <span className="text-[11px] text-slate-400 dark:text-slate-500 hidden sm:inline">
              ({itemsPerPage} {itemsPerPage === 1 ? itemLabelSingular : itemLabelPlural} per slide)
            </span>
          )}
        </div>

        {/* Right: Manual Controls (Previous, Next, Play/Pause) */}
        <div className="flex items-center space-x-2">
          {headerRightContent}

          {totalBatches > 1 && (
            <div className="flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-700">
              {/* Play / Pause Toggle */}
              <button
                type="button"
                onClick={() => setIsUserPaused((prev) => !prev)}
                className="p-1.5 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                title={isUserPaused ? 'Resume auto slideshow (every 3s)' : 'Pause auto slideshow'}
                aria-label={isUserPaused ? 'Resume auto slideshow' : 'Pause auto slideshow'}
              >
                {isUserPaused ? (
                  <Play className="w-3.5 h-3.5 fill-current" />
                ) : (
                  <Pause className="w-3.5 h-3.5" />
                )}
              </button>

              <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 my-auto" />

              {/* Previous Batch */}
              <button
                type="button"
                onClick={handlePrev}
                className="p-1.5 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer flex items-center justify-center shadow-2xs"
                title="Previous batch"
                aria-label="Previous batch"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Next Batch */}
              <button
                type="button"
                onClick={handleNext}
                className="p-1.5 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer flex items-center justify-center shadow-2xs"
                title="Next batch"
                aria-label="Next batch"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Slide Viewport & Container */}
      <div className="relative overflow-hidden min-h-[300px]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentBatchIndex}
            initial={{ opacity: 0, x: direction === 'right' ? 30 : -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction === 'right' ? -30 : 30 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className={`grid gap-6 ${
              itemsPerPage === 4
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
                : itemsPerPage === 2
                ? 'grid-cols-1 sm:grid-cols-2'
                : 'grid-cols-1'
            }`}
          >
            {currentBatchItems.map((item, idx) => {
              const actualIndex = startIndex + idx;
              const key = keyExtractor ? keyExtractor(item, actualIndex) : String(actualIndex);
              return (
                <div key={key} className="h-full flex flex-col">
                  {renderItem(item, actualIndex)}
                </div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Batch Indicators / Pagination Dots */}
      {totalBatches > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/80">
          {/* Subtle note about auto-slideshow with hover pause */}
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            Auto-advancing every 3s · Hover to pause
          </span>

          {/* Dots Indicator */}
          <div className="flex items-center space-x-1.5">
            {Array.from({ length: totalBatches }).map((_, idx) => {
              const isActive = idx === currentBatchIndex;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleJumpToBatch(idx)}
                  className={`h-2 transition-all rounded-full cursor-pointer ${
                    isActive
                      ? isTeal
                        ? 'w-7 bg-teal-600 dark:bg-teal-400'
                        : 'w-7 bg-revon-blue dark:bg-blue-400'
                      : 'w-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600'
                  }`}
                  aria-label={`Go to slide batch ${idx + 1}`}
                  title={`Batch ${idx + 1} of ${totalBatches}`}
                />
              );
            })}
          </div>

          {/* Quick jump prev/next on mobile */}
          <div className="flex items-center space-x-2 sm:hidden">
            <button
              type="button"
              onClick={handlePrev}
              className="px-3 py-1 text-xs font-bold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="px-3 py-1 text-xs font-bold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
