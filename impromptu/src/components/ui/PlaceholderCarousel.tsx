import React, { useState, useEffect } from "react";

type PlaceholderCarouselProps = {
  placeholders: string[];
  duration?: number;
  className?: string;
};

const PlaceholderCarousel = ({ 
  placeholders, 
  duration = 3000,
  className = ""
}: PlaceholderCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (placeholders.length <= 1) return;

    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % placeholders.length);
        setIsAnimating(false);
      }, 300);
    }, duration);

    return () => clearInterval(interval);
  }, [placeholders.length, duration]);

  if (!placeholders.length) return null;

  return (
    <div className={`flex items-center gap-2 text-4xl font-mono font-bold text-gray-800 ${className}`}>
      <span className="whitespace-nowrap">Prompt a new</span>
      <div className="relative h-8 min-w-0 flex-1 gap-4">
        <div 
          className={`absolute inset-0 flex items-center transition-all duration-300 ease-in-out ${
            isAnimating ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
          }`}
        >
          <span className="text-primary font-semibold whitespace-nowrap overflow-hidden text-ellipsis">
            {placeholders[currentIndex]}
          </span>
        </div>
      </div>
      
    </div>
  );
};

export default PlaceholderCarousel;