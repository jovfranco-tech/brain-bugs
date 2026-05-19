import React from 'react';

interface StarRatingProps {
  stars: number;
  maxStars?: number;
  size?: number;
  animated?: boolean;
}

export default function StarRating({ stars, maxStars = 3, size = 20, animated = false }: StarRatingProps) {
  return (
    <div className="flex gap-0.5 items-center">
      {Array.from({ length: maxStars }).map((_, i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24"
          className={i < stars && animated ? 'animate-bounce-in' : ''}
          style={i < stars && animated ? { animationDelay: `${i * 0.1}s` } : {}}>
          <path
            d="M12 2l3.1 6.3L22 9.3l-5 4.9L18.2 22 12 18.6 5.8 22 7 14.2l-5-4.9 6.9-1z"
            fill={i < stars ? '#FFC83D' : 'rgba(255,255,255,0.25)'}
            stroke={i < stars ? '#D9A015' : 'rgba(35,19,71,0.2)'}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      ))}
    </div>
  );
}
