import React, { useState, useEffect, type FC, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
    content: string;
    children: ReactNode;
}

export const Tooltip: FC<TooltipProps> = ({ content, children }) => {
    const [visible, setVisible] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    const handleMouseMove = (e: React.MouseEvent) => {
        setPosition({ x: e.clientX, y: e.clientY });
    };

    const isSidebarArea = (typeof window !== 'undefined' && window.innerWidth >= 1024) && position.x < 450; // Threshold for control panel area

    // Check for touch device/mobile
    const isTouch = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;

    const tooltipContent = visible && mounted && !isTouch && (
        <div
            className="fixed z-[9999] p-4 glass-panel rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] border border-white/20 text-[11px] leading-relaxed text-white/90 pointer-events-none animate-in fade-in zoom-in-95 slide-in-from-left-4 duration-300 max-w-[240px] backdrop-blur-3xl"
            style={{
                // If in sidebar area, force to pop out to the right of the panel
                // Otherwise follow cursor normally
                left: isSidebarArea ? 380 : position.x + 20,
                top: isSidebarArea ? Math.max(100, Math.min(position.y - 40, window.innerHeight - 150)) : position.y - 10,
                // Ensure it doesn't go off screen
                transform: (!isSidebarArea && position.x > window.innerWidth - 300) ? 'translateX(-110%)' : 'none',
                opacity: visible ? 1 : 0,
            }}
        >
            <div className="relative z-10 font-bold tracking-[1px] uppercase text-[9px] text-cyan-400 mb-1">Information</div>
            <div className="relative z-10 font-medium leading-relaxed">
                {content}
            </div>
            {/* Subtle accent glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 rounded-2xl -z-10" />

            {/* Connection line/dot if in sidebar mode */}
            {isSidebarArea && (
                <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-4 h-[1px] bg-gradient-to-r from-transparent to-cyan-500/50" />
            )}
        </div>
    );


    return (
        <div
            className="relative block w-full"
            onMouseEnter={() => setVisible(true)}
            onMouseLeave={() => setVisible(false)}
            onMouseMove={handleMouseMove}
        >
            {children}
            {mounted && createPortal(tooltipContent, document.body)}
        </div>
    );
};

