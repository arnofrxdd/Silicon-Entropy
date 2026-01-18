import { useRef, useEffect, type FC } from 'react';

interface PhaseSpaceProps {
    x: number;
    y: number;
    xLabel: string;
    yLabel: string;
    xMax: number;
    yMax: number;
    color?: string;
}

export const PhaseSpace: FC<PhaseSpaceProps> = ({ x, y, xLabel, yLabel, xMax, yMax, color = '#22d3ee' }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const historyRef = useRef<{ x: number, y: number }[]>([]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        historyRef.current.push({ x, y });
        if (historyRef.current.length > 200) historyRef.current.shift();

        const w = canvas.width;
        const h = canvas.height;

        ctx.fillStyle = '#050505';
        ctx.fillRect(0, 0, w, h);

        ctx.strokeStyle = 'rgba(255,255,255,0.03)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 1; i < 8; i++) {
            ctx.moveTo(w * i / 8, 0); ctx.lineTo(w * i / 8, h);
            ctx.moveTo(0, h * i / 8); ctx.lineTo(w, h * i / 8);
        }
        ctx.stroke();

        const path = historyRef.current;
        if (path.length > 2) {
            const mapX = (v: number) => (v / xMax) * w;
            const mapY = (v: number) => h - (v / yMax) * h;

            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.5;
            ctx.shadowBlur = 8;
            ctx.shadowColor = color;

            ctx.moveTo(mapX(path[0].x), mapY(path[0].y));
            for (let i = 1; i < path.length; i++) {
                ctx.lineTo(mapX(path[i].x), mapY(path[i].y));
            }
            ctx.stroke();

            const head = path[path.length - 1];
            ctx.shadowBlur = 12;
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(mapX(head.x), mapY(head.y), 2.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }, [x, y, xMax, yMax, color]);

    return (
        <div className="relative w-full h-32 bg-black/50 rounded-2xl border border-white/5 overflow-hidden group">
            <canvas ref={canvasRef} width={280} height={128} className="w-full h-full opacity-80 group-hover:opacity-100 transition-opacity" />
            <div className="absolute top-3 left-3 text-[8px] font-black uppercase tracking-[2px] text-white/30">{yLabel} / {xLabel}</div>
            <div className="absolute bottom-3 right-3 text-[8px] font-mono text-white/20">PHASE_MAP v1.0</div>

            <div className="absolute top-3 right-3 flex items-center gap-1.5">
                <div className="w-1 h-1 rounded-full bg-cyan-500 animate-pulse" />
                <span className="text-[9px] font-mono text-cyan-400">LIVE</span>
            </div>
        </div>
    );
};
