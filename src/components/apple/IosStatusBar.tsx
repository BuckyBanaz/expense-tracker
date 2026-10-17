'use client';

import React, { useState, useEffect } from 'react';
import { Wifi } from 'lucide-react';

interface IosStatusBarProps {
  theme?: 'dark' | 'light';
}

export const IosStatusBar: React.FC<IosStatusBarProps> = ({ theme = 'dark' }) => {
  const [time, setTime] = useState('11:22');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      setTime(`${hours % 12 || 12}:${minutes < 10 ? '0' : ''}${minutes}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const isDark = theme === 'dark';

  return (
    <div className={`w-full px-7 pt-3.5 pb-2 flex items-center justify-between select-none z-30 transition-colors ${
      isDark ? 'text-white' : 'text-slate-900'
    }`}>
      {/* Left: Clock */}
      <div className="w-16">
        <span className="font-semibold text-[15px] tracking-tight ml-1 font-sans">
          {time}
        </span>
      </div>

      {/* Center: Dynamic Island */}
      <div className="flex-1 flex justify-center">
        <div className="w-[118px] h-[30px] bg-black rounded-full flex items-center justify-between px-3 shadow-md border border-white/5">
          <div className="w-3 h-3 rounded-full bg-slate-900/90 border border-slate-800 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-950/80" />
          </div>
          <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800" />
        </div>
      </div>

      {/* Right: Signal, Wifi, Battery */}
      <div className="w-16 flex items-center justify-end gap-1.5 text-xs mr-1">
        {/* Cellular bars */}
        <div className="flex items-end gap-[1.5px] h-3">
          <span className="w-[3px] h-[4px] bg-current rounded-sm" />
          <span className="w-[3px] h-[6px] bg-current rounded-sm" />
          <span className="w-[3px] h-[9px] bg-current rounded-sm" />
          <span className="w-[3px] h-[12px] bg-current rounded-sm" />
        </div>

        {/* Wifi */}
        <Wifi className="w-3.5 h-3.5" />

        {/* Battery */}
        <div className="flex items-center">
          <div className="w-5 h-2.5 rounded-[4px] border border-current p-[1px] flex items-center">
            <div className="w-[85%] h-full bg-current rounded-[2px]" />
          </div>
          <div className="w-[1.5px] h-1 bg-current rounded-r-sm ml-[0.5px]" />
        </div>
      </div>
    </div>
  );
};
