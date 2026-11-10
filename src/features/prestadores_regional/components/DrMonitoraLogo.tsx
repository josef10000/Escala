import React from 'react';

interface DrMonitoraLogoProps {
  className?: string;
  theme?: 'dark' | 'light';
  size?: 'sm' | 'md' | 'lg';
}

export const DrMonitoraLogo: React.FC<DrMonitoraLogoProps> = ({
  className = '',
  theme = 'dark',
  size = 'md',
}) => {
  // Height configurations
  const heightClasses = {
    sm: 'h-7',
    md: 'h-8 sm:h-9',
    lg: 'h-11 sm:h-12',
  }[size];

  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-8 h-8 sm:w-9 sm:h-9',
    lg: 'w-10 h-10 sm:w-11 sm:h-11',
  }[size];

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl sm:text-2xl',
    lg: 'text-2xl sm:text-3xl',
  }[size];

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Official dr.monitora Icon: Location Pin with 3D Isometric Tracker Box */}
      <div className={`relative ${iconSizes} shrink-0 drop-shadow-sm`}>
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Outer Pin Body */}
          <path
            d="M50 8C30.67 8 15 23.67 15 43C15 63.5 44 88.5 48.2 92.1C49.3 93 50.7 93 51.8 92.1C56 88.5 85 63.5 85 43C85 23.67 69.33 8 50 8Z"
            fill="url(#drPinGrad)"
          />

          {/* Inner Light Circle */}
          <circle cx="50" cy="42" r="24" fill="#FFFFFF" />

          {/* 3D Isometric Cube Box inside the pin (the tracking device) */}
          {/* Top Face */}
          <path
            d="M50 28L64 35L50 42L36 35L50 28Z"
            fill="#1E40AF"
          />
          {/* Left Face */}
          <path
            d="M36 35L50 42V56L36 49V35Z"
            fill="#172554"
          />
          {/* Right Face */}
          <path
            d="M50 42L64 35V49L50 56V42Z"
            fill="#2563EB"
          />
          {/* Cube highlights */}
          <path
            d="M50 42V56"
            stroke="#FFFFFF"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          <path
            d="M36 35L50 42L64 35"
            stroke="#FFFFFF"
            strokeWidth="1.2"
            strokeLinecap="round"
          />

          {/* Gradient Definition */}
          <defs>
            <linearGradient id="drPinGrad" x1="15" y1="8" x2="85" y2="92" gradientUnits="userSpaceOnUse">
              <stop stopColor="#2563EB" />
              <stop offset="1" stopColor="#1D4ED8" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Brand Typography: "dr.monitora®" */}
      <div className="flex items-baseline">
        <span
          className={`font-extrabold tracking-tight ${textSizes} ${
            theme === 'dark' ? 'text-white' : 'text-[#1340B0]'
          }`}
          style={{ letterSpacing: '-0.03em' }}
        >
          dr<span className="text-blue-500 font-black">.</span>monitora
        </span>
        <span
          className={`text-xs font-bold ml-1 ${
            theme === 'dark' ? 'text-blue-400' : 'text-[#1D4ED8]'
          }`}
        >
          ®
        </span>
      </div>
    </div>
  );
};
