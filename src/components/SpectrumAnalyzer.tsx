import { useRef, useEffect, type FC } from 'react';

interface SpectrumProps {
    clock: number;
    load: number;
    color?: string;
}

export const SpectrumAnalyzer: FC<SpectrumProps> = ({ clock, load, color = '#a855f7' }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const w = canvas.width;
        const h = canvas.height;
        const bars = 48;
        const barW = w / bars;

        ctx.clearRect(0, 0, w, h);

        for (let i = 0; i < bars; i++) {
            const freq = i / bars * 20;
            const dist = Math.abs(freq - clock);
            const spread = 0.5 + (load / 100) * 2.0;

            let amp = Math.exp(-Math.pow(dist, 2) / (spread * spread));
            const dist2 = Math.abs(freq - clock * 2);
            amp += 0.3 * Math.exp(-Math.pow(dist2, 2) / spread);
            amp += Math.random() * 0.05;
            amp *= (0.8 + Math.random() * 0.4);

            const barH = Math.min(1, amp) * (h * 0.8);

            const gradient = ctx.createLinearGradient(0, h - barH, 0, h);
            gradient.addColorStop(0, color);
            gradient.addColorStop(1, 'rgba(168, 85, 247, 0.2)');

            ctx.fillStyle = gradient;
            ctx.shadowBlur = 4;
            ctx.shadowColor = color;
            ctx.fillRect(i * barW + 1, h - barH, barW - 2, barH);

            ctx.shadowBlur = 0;
            ctx.globalAlpha = 0.1;
            ctx.fillRect(i * barW + 1, h + 2, barW - 2, barH * 0.3);
            ctx.globalAlpha = 1.0;
        }
    }, [clock, load, color]);

    return (
        <div className="relative w-full h-32 bg-black/50 rounded-2xl border border-white/5 overflow-hidden group">
            <canvas ref={canvasRef} width={280} height={128} className="w-full h-full opacity-80 group-hover:opacity-100 transition-opacity" />
            <div className="absolute top-3 left-3 text-[8px] font-black uppercase tracking-[2px] text-white/30">Clock Harmonics [FFT]</div>
            <div className="absolute top-3 right-3 text-[8px] font-mono text-white/20">20.0 GHz</div>
            <div className="absolute bottom-3 left-3 flex gap-0.5">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="w-1.5 h-0.5 bg-purple-500/40 rounded-full" />
                ))}
            </div>
        </div>
    );
};
