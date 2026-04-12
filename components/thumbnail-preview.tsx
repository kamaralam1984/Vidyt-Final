'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface ThumbnailPreviewProps {
  text: string;
  ctrScore: number;
  colors: string[];
  isActive?: boolean;
  onClick?: () => void;
}

export default function ThumbnailPreview({ 
  text, 
  ctrScore, 
  colors, 
  isActive = false, 
  onClick 
}: ThumbnailPreviewProps) {
  const [glowIntensity, setGlowIntensity] = useState(0.8);

  useEffect(() => {
    const interval = setInterval(() => {
      setGlowIntensity(prev => {
        const next = prev + 0.1;
        return next > 1.2 ? 0.8 : next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      onClick={onClick}
      className={`relative w-full h-64 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 ${
        isActive ? 'ring-4 ring-red-500 scale-105' : 'hover:scale-102'
      }`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      style={{
        background: `linear-gradient(135deg, ${colors[0]}88, ${colors[1]}88)`,
        boxShadow: isActive 
          ? `0 0 40px ${colors[0]}66` 
          : `0 0 20px ${colors[0]}33`
      }}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 10px,
              ${colors[2]}33 10px,
              ${colors[2]}33 20px
            )`
          }}
        />
      </div>

      {/* Light Flare Effect */}
      <motion.div
        className="absolute top-0 right-0 w-32 h-32 rounded-full"
        style={{
          background: `radial-gradient(circle, ${colors[1]}66, transparent)`,
          filter: 'blur(20px)',
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Main Text */}
      <div className="relative z-10 h-full flex items-center justify-center p-6">
        <motion.h2
          className="text-3xl md:text-4xl font-black text-center text-white leading-tight"
          style={{
            textShadow: `
              0 0 ${20 * glowIntensity}px ${colors[1]},
              2px 2px 4px rgba(0,0,0,0.9),
              0 0 40px ${colors[0]}88
            `,
            transform: 'perspective(500px) rotateX(5deg)'
          }}
          animate={{
            y: [0, -2, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          {text}
        </motion.h2>
      </div>

      {/* CTR Score Badge */}
      <motion.div
        className="absolute top-4 right-4 bg-green-500 text-black px-3 py-1 rounded-full font-bold text-sm shadow-lg"
        style={{
          boxShadow: `0 0 20px ${ctrScore > 80 ? '#10b981' : '#f59e0b'}66`
        }}
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        CTR: {ctrScore}%
      </motion.div>

      {/* Bottom Gradient Overlay */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-20"
        style={{
          background: `linear-gradient(to top, ${colors[1]}88, transparent)`
        }}
      />

      {/* Particles Effect */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full"
          style={{
            backgroundColor: colors[2],
            left: `${20 + i * 15}%`,
            top: `${30 + (i % 2) * 40}%`,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 2 + i * 0.5,
            repeat: Infinity,
            delay: i * 0.2,
          }}
        />
      ))}
    </motion.div>
  );
}
