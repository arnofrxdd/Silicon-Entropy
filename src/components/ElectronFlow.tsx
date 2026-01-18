import React, { useRef, useEffect } from 'react';

interface ElectronFlowProps {
    clock: number;
    temp: number;
    voltage: number;
}

export const ElectronFlow: React.FC<ElectronFlowProps> = ({ clock, temp, voltage }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Circuit-like particles
        interface Particle {
            x: number;
            y: number;
            vx: number;
            vy: number;
            life: number;
            turnTimer: number;
        }

        let particles: Particle[] = [];
        const maxParticles = 100; // Increased density

        let frameId = 0;

        const animate = () => {
            if (canvas.width !== canvas.clientWidth) {
                canvas.width = canvas.clientWidth;
                canvas.height = canvas.clientHeight;
            }

            const w = canvas.width;
            const h = canvas.height;

            // Fade out trail
            ctx.fillStyle = 'rgba(0,0,0,0.15)';
            ctx.fillRect(0, 0, w, h);

            // Spawn particles
            if (particles.length < maxParticles) {
                const isHoriz = Math.random() > 0.5;
                const speed = 1 + (clock * 0.5); // Speed scales with clock
                particles.push({
                    x: Math.random() * w,
                    y: Math.random() * h,
                    vx: isHoriz ? (Math.random() > 0.5 ? speed : -speed) : 0,
                    vy: !isHoriz ? (Math.random() > 0.5 ? speed : -speed) : 0,
                    life: 1.0,
                    turnTimer: Math.random() * 20
                });
            }

            ctx.lineWidth = 1.5;

            // Update and draw
            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.life -= 0.005 + (voltage * 0.002); // Life drain scales with voltage
                p.turnTimer--;

                // Orthogonal movement logic (Circuit turns)
                if (p.turnTimer <= 0) {
                    p.turnTimer = 10 + Math.random() * 40;
                    if (p.vx !== 0) {
                        // Moving Horizontal -> Switch to Vertical
                        p.vx = 0;
                        const speed = 1 + (clock * 0.5);
                        p.vy = Math.random() > 0.5 ? speed : -speed;
                    } else {
                        // Moving Vertical -> Switch to Horizontal
                        p.vy = 0;
                        const speed = 1 + (clock * 0.5);
                        p.vx = Math.random() > 0.5 ? speed : -speed;
                    }
                }

                // Wrap around screen 
                if (p.x < 0) p.x = w;
                if (p.x > w) p.x = 0;
                if (p.y < 0) p.y = h;
                if (p.y > h) p.y = 0;

                const baseColor = temp > 85 ? '244, 63, 94' : '34, 211, 238'; // Red or Cyan
                ctx.strokeStyle = `rgba(${baseColor}, ${p.life})`;
                ctx.fillStyle = `rgba(${baseColor}, ${p.life})`;

                // Draw Particle
                ctx.beginPath();
                ctx.arc(p.x, p.y, 1.2, 0, Math.PI * 2);
                ctx.fill();

                // Draw Trail Segment
                ctx.beginPath();
                ctx.moveTo(p.x - p.vx * 3, p.y - p.vy * 3);
                ctx.lineTo(p.x, p.y);
                ctx.stroke();

                if (p.life <= 0) particles.splice(i, 1);
            }

            // Grid Dots Overlay
            ctx.fillStyle = 'rgba(255,255,255,0.05)';
            for (let x = 0; x < w; x += 20) {
                for (let y = 0; y < h; y += 20) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }

            frameId = requestAnimationFrame(animate);
        };

        frameId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frameId);
    }, [clock, temp, voltage]);

    return (
        <div className="relative w-full h-32 bg-black/40 rounded-2xl border border-white/10 overflow-hidden group">
            <div className="absolute top-2 left-2 z-10 text-[9px] font-mono font-bold tracking-widest text-white/40 uppercase group-hover:text-cyan-400 transition-colors">
                Electron Mobility
            </div>
            <canvas ref={canvasRef} className="w-full h-full block" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(0,0,0,0.8)_100%)] pointer-events-none" />
        </div>
    );
};
