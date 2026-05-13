import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';

interface ScratchCardProps {
  onComplete: () => void;
  prizeLabel: string;
}

export const ScratchCard: React.FC<ScratchCardProps> = ({ onComplete, prizeLabel }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScratched, setIsScratched] = useState(false);
  const [scratchProgress, setScratchProgress] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set up initial overlay
    const width = canvas.width;
    const height = canvas.height;

    ctx.fillStyle = '#CCCCCC'; // Metallic look
    ctx.fillRect(0, 0, width, height);
    
    // Add some "scratchable" texture
    ctx.fillStyle = '#AAAAAA';
    for (let i = 0; i < 200; i++) {
      ctx.fillRect(Math.random() * width, Math.random() * height, 2, 2);
    }
  }, []);

  const handleScratch = (e: React.MouseEvent | React.TouchEvent) => {
    if (isScratched) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;

    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = (e as React.MouseEvent).clientX - rect.left;
      y = (e as React.MouseEvent).clientY - rect.top;
    }

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();

    // Check progress
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let transparentCount = 0;
    for (let i = 3; i < imageData.data.length; i += 4) {
      if (imageData.data[i] === 0) transparentCount++;
    }

    const progress = (transparentCount / (canvas.width * canvas.height)) * 100;
    setScratchProgress(progress);

    if (progress > 50 && !isScratched) {
      setIsScratched(true);
      onComplete();
    }
  };

  return (
    <div className="relative w-full max-w-[280px] h-32 mx-auto scratch-area-styled flex items-center justify-center">
      <div className="absolute inset-0 flex items-center justify-center font-bold text-3xl text-[var(--skz-red)] uppercase tracking-tighter italic">
        {prizeLabel}
      </div>
      <canvas
        ref={canvasRef}
        width={280}
        height={128}
        className="absolute inset-0 cursor-crosshair touch-none"
        onMouseMove={(e) => e.buttons === 1 && handleScratch(e)}
        onTouchMove={handleScratch}
      />
      {scratchProgress < 10 && !isScratched && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="text-[14px] font-black tracking-[3px] text-[var(--skz-red)] uppercase drop-shadow-[0_0_8px_rgba(230,0,0,0.5)]">
            RASPE AQUI
          </div>
          <div className="text-white/20 text-xs mt-1">✧</div>
        </div>
      )}
    </div>
  );
};
