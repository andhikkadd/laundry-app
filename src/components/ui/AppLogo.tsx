import React from 'react';
import Image from 'next/image';

interface AppLogoProps {
  className?: string;
  iconSize?: number;
  textSize?: string;
  textSuffix?: string;
  lightText?: boolean;
  lightBg?: boolean;
  customText?: string;
}

export default function AppLogo({
  className = '',
  iconSize = 28,
  textSize = 'text-xl',
  textSuffix = '',
  lightText = false,
  lightBg = false,
  customText,
}: AppLogoProps) {
  return (
    <div className={`flex items-center gap-2.5 font-bold ${className}`}>
      {/* Custom Brand Logo Image */}
      <Image
        src="/logo.png"
        alt="Bilasin Logo"
        width={iconSize}
        height={iconSize}
        className="shrink-0 object-contain"
        priority
      />
      
      <span className={`${textSize} tracking-tight font-black ${
        lightText 
          ? 'text-white' 
          : lightBg 
          ? 'text-slate-800' 
          : 'text-slate-800 dark:text-white'
      }`}>
        {customText ? (
          customText
        ) : (
          <>
            Bila<span className="text-emerald-brand">sin</span>
          </>
        )}
        {textSuffix && <span className="ml-1 text-sm font-bold text-slate-400">{textSuffix}</span>}
      </span>
    </div>
  );
}
