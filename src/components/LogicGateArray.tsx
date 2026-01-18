import React, { useEffect, useRef } from 'react';

interface LogicGateArrayProps {
    load: number;
    tasks: number;
}

export const LogicGateArray: React.FC<LogicGateArrayProps> = ({ load, tasks: _tasks }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const cols = 32;
        const rows = 8;
        const grid: number[] = new Array(cols * rows).fill(0);

        let frameId = 0;

        const animate = () => {
            if (canvas.width !== canvas.clientWidth) {
                canvas.width = canvas.clientWidth;
                canvas.height = canvas.clientHeight;
            }

            const w = canvas.width;
            const h = canvas.height;
            const cellW = w / cols;
            const cellH = h / rows;

            ctx.clearRect(0, 0, w, h);

            // Update grid based on load
            const activeCells = Math.floor((load / 100) * (cols * rows));

            for (let i = 0; i < grid.length; i++) {
                // Decay
                if (grid[i] > 0) grid[i] -= 0.05;

                // Random activation if within load threshold
                if (Math.random() < 0.05 && i < activeCells * 1.5) {
                    grid[i] = 1.0;
                }
            }

            // Draw
            for (let y = 0; y < rows; y++) {
                for (let x = 0; x < cols; x++) {
                    const i = y * cols + x;
                    const val = grid[i];
                    if (val > 0.1) {
                        ctx.fillStyle = `rgba(168, 85, 247, ${val})`; // Purple
                        ctx.fillRect(x * cellW + 1, y * cellH + 1, cellW - 2, cellH - 2);
                    }
                }
            }

            frameId = requestAnimationFrame(animate);
        };

        frameId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frameId);
    }, [load]);

    return (
        <div className="relative w-full h-24 bg-black/40 rounded-2xl border border-white/10 overflow-hidden group">
            <div className="absolute top-2 left-2 z-10 text-[9px] font-mono font-bold tracking-widest text-white/40 uppercase group-hover:text-purple-400 transition-colors">
                L1 Cache State
            </div>
            <canvas ref={canvasRef} className="w-full h-full block opacity-80" />

            {/* Overlay Grid lines for hex look */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:10px_10px] pointer-events-none" />
        </div>
    );
};
