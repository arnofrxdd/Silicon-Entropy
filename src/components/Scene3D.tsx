import React, { useRef, useEffect } from 'react';

type Scene3DProps = {
    clockRatio: number;
    currentLoad: number;
    fps: number;
    expSingularity?: boolean;
    expSentience?: boolean;
    expRealityAnchor?: boolean;
    expInfiniteCore?: boolean;
    lowRes?: boolean;
};

export const Scene3D: React.FC<Scene3DProps> = ({
    clockRatio,
    currentLoad,
    fps,
    expSingularity = false,
    expSentience = false,
    expRealityAnchor = true,
    expInfiniteCore = false,
    lowRes = false
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const frameId = useRef(0);
    const lastRenderTime = useRef(0);
    const rotationVal = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const render = (time: number) => {
            frameId.current = requestAnimationFrame(render);

            // ACTUAL FPS THROTTLING FOR VISUAL STUTTER
            const frameInterval = 1000 / Math.max(0.01, fps);
            if (time - lastRenderTime.current < frameInterval) return;
            lastRenderTime.current = time;

            if (canvas.width !== canvas.clientWidth) {
                canvas.width = canvas.clientWidth;
                canvas.height = canvas.clientHeight;
            }

            const w = canvas.width;
            const h = canvas.height;
            const cx = w / 2;
            const cy = h / 2;

            ctx.fillStyle = '#020202';
            ctx.fillRect(0, 0, w, h);

            // Reality Anchor Failure: Visual Glitches
            if (!expRealityAnchor) {
                if (Math.random() < 0.1) {
                    ctx.fillStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.05)`;
                    ctx.fillRect(0, 0, w, h);
                }
                const offsetX = (Math.random() - 0.5) * 50;
                const offsetY = (Math.random() - 0.5) * 50;
                ctx.translate(offsetX, offsetY);
            }

            // High Tech Grid
            ctx.strokeStyle = expSingularity ? `rgba(139, 92, 246, 0.2)` : `rgba(34, 211, 238, 0.1)`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            const gridCount = lowRes ? 10 : 20;
            const gridSpacing = w / gridCount;
            for (let i = 0; i <= gridCount; i++) {
                // Perspective grid
                const x = i * gridSpacing;
                ctx.moveTo(x, cy);
                ctx.lineTo(cx + (x - cx) * 4, h);

                const y = cy + (i / gridCount) * cy;
                const spread = (i / gridCount) * w * 2;
                ctx.moveTo(cx - spread, y);
                ctx.lineTo(cx + spread, y);
            }
            ctx.stroke();

            // Cube Rotation Logic - integrated velocity based on FPS
            // Minimum speed is decently fast (base 1.0), scales infinitely with FPS
            const speedMultiplier = 1.0 + (fps / 20);

            // Increment rotation - aggressively fast
            rotationVal.current.x += 0.01 * speedMultiplier;
            rotationVal.current.y += 0.015 * speedMultiplier;

            const rotX = rotationVal.current.x;
            const rotY = rotationVal.current.y;

            ctx.save();
            ctx.translate(cx, cy - 40);

            if (expSingularity) {
                const pulse = 1 + Math.sin(time * 0.01) * 0.3;
                ctx.scale(pulse, pulse);
            }

            // Stutter jitter if logic FPS is low
            if (fps < 30) {
                const jitter = (1 - fps / 30) * 15;
                ctx.translate((Math.random() - 0.5) * jitter, (Math.random() - 0.5) * jitter);
            }

            let strokeColor = '#22d3ee';
            if (fps < 20) strokeColor = '#f43f5e';
            if (clockRatio > 1.5) strokeColor = '#a855f7';
            if (expSingularity) strokeColor = '#ffffff';

            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = lowRes ? 1 : 2;
            ctx.shadowBlur = (currentLoad > 80 && !lowRes) ? 20 : 0;
            ctx.shadowColor = strokeColor;

            const size = expSingularity ? 200 : 140;
            const vertices = [
                [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
                [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]
            ];

            const points = vertices.map(v => {
                let [x, y, z] = v;
                let tx = x * Math.cos(rotY) - z * Math.sin(rotY);
                let tz = x * Math.sin(rotY) + z * Math.cos(rotY);
                x = tx; z = tz;
                let ty = y * Math.cos(rotX) - z * Math.sin(rotX);
                tz = y * Math.sin(rotX) + z * Math.cos(rotX);
                y = ty; z = tz;
                const scale = 600 / (600 + z * size);
                return { x: x * size * scale, y: y * size * scale };
            });

            ctx.beginPath();
            const edges = [
                [0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]
            ];
            edges.forEach(([s, e]) => {
                ctx.moveTo(points[s].x, points[s].y);
                ctx.lineTo(points[e].x, points[e].y);
            });
            ctx.stroke();

            // Inner Core Glow
            ctx.beginPath();
            ctx.arc(0, 0, 30 + Math.sin(time * 0.01) * 5, 0, Math.PI * 2);
            ctx.fillStyle = strokeColor + '22';
            ctx.fill();

            if (expInfiniteCore) {
                ctx.scale(0.5, 0.5);
                ctx.rotate(time * 0.002);
                ctx.strokeRect(-size, -size, size * 2, size * 2);
            }

            if (expSentience) {
                ctx.beginPath();
                ctx.arc(0, 0, 15, 0, Math.PI * 2);
                ctx.fillStyle = '#f43f5e';
                ctx.fill();
                ctx.shadowBlur = 40;
                ctx.shadowColor = '#f43f5e';
            }

            ctx.restore();

            // Ambient Glow
            const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, w);
            gradient.addColorStop(0, strokeColor + '08');
            gradient.addColorStop(1, 'transparent');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, w, h);
        };

        frameId.current = requestAnimationFrame(render);
        return () => cancelAnimationFrame(frameId.current);
    }, [clockRatio, currentLoad, fps, expSingularity, expSentience, expRealityAnchor, expInfiniteCore]);

    return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />;
};
