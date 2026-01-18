import { useRef, useEffect, useState, type FC } from 'react';

interface DieVisualizerProps {
    temp: number;
    load: number;
    coreCount: number;
    clock: number;
    fps: number;
    stateRef?: any;
    className?: string;
    fullscreen?: boolean;
}

// Color palettes (LUT generation)
const createPalette = (name: string): Uint8Array => {
    const lut = new Uint8Array(256 * 4);
    for (let i = 0; i < 256; i++) {
        const t = i / 255;
        let r = 0, g = 0, b = 0;

        if (name === 'ironbow') {
            // Ironbow: Dark Purple -> Blue -> Purple -> Red -> Yellow -> White
            if (t < 0.15) { r = 15 + (t / 0.15 * 25); g = 0; b = 30 + (t / 0.15 * 100); }
            else if (t < 0.3) { r = 40 + (t - 0.15) / 0.15 * 88; g = 0; b = 130 + (t - 0.15) / 0.15 * 125; }
            else if (t < 0.45) { r = 128 + (t - 0.3) / 0.15 * 127; g = 0; b = 255 - (t - 0.3) / 0.15 * 255; }
            else if (t < 0.65) { r = 255; g = (t - 0.45) / 0.2 * 128; b = 0; }
            else if (t < 0.85) { r = 255; g = 128 + (t - 0.65) / 0.2 * 127; b = 0; }
            else { r = 255; g = 255; b = (t - 0.85) / 0.15 * 255; }
        } else if (name === 'magma') {
            // Magma: Dark Purple -> Dark Red -> Orange -> Yellow
            r = Math.min(255, 15 + t * 300);
            g = Math.min(255, Math.pow(t, 2) * 255);
            b = Math.min(255, 30 + Math.pow(t, 3) * 100 + (1 - t) * 30 * (t < 0.2 ? 1 : 0));
        } else if (name === 'whitehot') {
            const v = Math.min(255, t * 1.2 * 255);
            r = v; g = v; b = v;
        } else if (name === 'spectrogram') {
            const hue = (1 - t) * 280; // Start at purple (280) instead of blue (240)
            const s = 100, l = 50 * (0.2 + 0.8 * t); // Simulating black/dark at lower hues
            // HSL to RGB conversion simplified
            const c = (1 - Math.abs(2 * l / 100 - 1)) * s / 100;
            const x = c * (1 - Math.abs((hue / 60) % 2 - 1));
            const m = l / 100 - c / 2;
            let r1 = 0, g1 = 0, b1 = 0;
            if (hue < 60) { r1 = c; g1 = x; b1 = 0; }
            else if (hue < 120) { r1 = x; g1 = c; b1 = 0; }
            else if (hue < 180) { r1 = 0; g1 = c; b1 = x; }
            else if (hue < 240) { r1 = 0; g1 = x; b1 = c; }
            else if (hue < 300) { r1 = x; g1 = 0; b1 = c; }
            else { r1 = c; g1 = 0; b1 = x; }
            r = (r1 + m) * 255; g = (g1 + m) * 255; b = (b1 + m) * 255;
        }

        lut[i * 4 + 0] = Math.min(255, Math.max(0, r));
        lut[i * 4 + 1] = Math.min(255, Math.max(0, g));
        lut[i * 4 + 2] = Math.min(255, Math.max(0, b));
        lut[i * 4 + 3] = 255; // Alpha
    }
    return lut;
};

// Precompute palettes
const PALETTES = {
    ironbow: createPalette('ironbow'),
    magma: createPalette('magma'),
    whitehot: createPalette('whitehot'),
    spectrogram: createPalette('spectrogram'),
};

export const DieVisualizer: FC<DieVisualizerProps> = ({ temp: _temp, load: _load, coreCount, clock: _clock, fps: _fps, stateRef, className, fullscreen = false }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Physics constants
    const GRID_W = fullscreen ? 128 : 64;
    const GRID_H = fullscreen ? 128 : 64;
    const NUM_CELLS = GRID_W * GRID_H;
    const DIFFUSION_RATE = 0.20; // 0.25 is max stable for explicit 2D FDM
    const DISSIPATION_RATE = 0.015; // Slightly slower cooling for inertia
    const AMBIENT_TEMP = 25;

    // Simulation State
    const gridRef = useRef<Float32Array>(new Float32Array(NUM_CELLS).fill(AMBIENT_TEMP));
    const nextGridRef = useRef<Float32Array>(new Float32Array(NUM_CELLS).fill(AMBIENT_TEMP));

    // Core Layout Map (pre-calculated per coreCount)
    const coreMapRef = useRef<Uint8Array>(new Uint8Array(NUM_CELLS).fill(0));

    const [colorMode, setColorMode] = useState<'ironbow' | 'magma' | 'whitehot' | 'spectrogram'>('ironbow');

    // Auto-ranging for visualization
    const rangeMin = useRef(25);
    const rangeMax = useRef(85);
    const hotspotRef = useRef({ x: 0, y: 0 });

    // Initialize/Update Core Layout
    useEffect(() => {
        const map = coreMapRef.current;
        map.fill(0);

        // Precise centering logic
        const cols = Math.ceil(Math.sqrt(coreCount));
        const rows = Math.ceil(coreCount / cols);

        const coreSize = Math.floor(GRID_W * 0.65 / Math.max(cols, rows));
        const gap = 2;

        const totalWidth = cols * coreSize + (cols - 1) * gap;
        const totalHeight = rows * coreSize + (rows - 1) * gap;

        const startX = Math.floor((GRID_W - totalWidth) / 2);
        const startY = Math.floor((GRID_H - totalHeight) / 2);

        for (let i = 0; i < coreCount; i++) {
            const r = Math.floor(i / cols);
            const c = i % cols;

            const x0 = startX + c * (coreSize + gap);
            const y0 = startY + r * (coreSize + gap);

            for (let y = y0; y < y0 + coreSize; y++) {
                for (let x = x0; x < x0 + coreSize; x++) {
                    if (x >= 0 && x < GRID_W && y >= 0 && y < GRID_H) {
                        map[y * GRID_W + x] = 1;
                    }
                }
            }
        }
    }, [coreCount]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
        if (!ctx) return;

        // Render buffer (upscaled via CSS, but internal logic is pixel-based)
        canvas.width = GRID_W;
        canvas.height = GRID_H;

        // Image buffer for direct pixel manipulation
        const imgData = ctx.createImageData(GRID_W, GRID_H);
        const buf32 = new Uint32Array(imgData.data.buffer); // View allowing reading/writing single pixels as 32-bit ints

        let frameId = 0;
        let lastTime = 0;

        const animate = (time: number) => {
            if (time - lastTime < 16) { // Cap at ~60 FPS
                frameId = requestAnimationFrame(animate);
                return;
            }
            lastTime = time;

            const grid = gridRef.current;
            const next = nextGridRef.current;
            const map = coreMapRef.current;

            // Get live simulation state
            let currentLoad = 0;
            let currentTemp = 25;
            let liveAmbient = 25;

            if (stateRef?.current) {
                currentLoad = stateRef.current.currentLoad;
                currentTemp = stateRef.current.currentTemp;
                liveAmbient = stateRef.current.ambientTemp || 25;
            }

            // --- 1. PHYSICS STEP (Heat Equation) ---
            // Input Heat source (Cores gen heat based on load & global temp)
            // We use currentTemp as a "target" or "driver" but localized by load
            const loadFactor = Math.max(0, currentLoad / 100);

            // Calculate global heat input needed to reach target temp (simple proportional control for sim)
            // But we want "flair": localized heating.
            // Let's say effective core heat = currentTemp + extra_spikes

            for (let i = 0; i < NUM_CELLS; i++) {
                const x = i % GRID_W;
                const y = Math.floor(i / GRID_W);

                // Diffusion (Laplacian)
                // Neighbors: Top, Bottom, Left, Right
                // Boundary check: clamp to edge values
                const nT = (y > 0) ? grid[i - GRID_W] : grid[i];
                const nB = (y < GRID_H - 1) ? grid[i + GRID_W] : grid[i];
                const nL = (x > 0) ? grid[i - 1] : grid[i];
                const nR = (x < GRID_W - 1) ? grid[i + 1] : grid[i];

                const laplacian = nT + nB + nL + nR - 4 * grid[i];

                // Heat generation / Cooling (Bidirectional drive towards target)
                let heatUpdate = 0;
                if (map[i] === 1) { // It's a core
                    // Add noise/activity
                    const noise = Math.sin(time * 0.01 + i * 0.1) * 2;
                    // Cores are driven towards the global 'currentTemp'
                    const targetT = currentTemp + noise * loadFactor;
                    heatUpdate = (targetT - grid[i]) * 0.15;
                } else {
                    // Non-core areas dissipate towards the current ambient environment
                    // This allows the whole die to freeze if the system is freezing
                    heatUpdate = (liveAmbient - grid[i]) * DISSIPATION_RATE;
                }

                // Update Rule
                // T_new = T + (alpha * laplacian) + heatUpdate
                let val = grid[i] + (DIFFUSION_RATE * laplacian) + heatUpdate;

                // Add some random thermal noise for realism
                val += (Math.random() - 0.5) * 0.05;

                next[i] = val;
            }

            // Swap buffers
            gridRef.current = next;
            nextGridRef.current = grid; // Reuse array

            // --- 2. AUTO-RANGING ---
            // Find min/max for color scaling
            let minT = 1000, maxT = -1000;
            let hotIdx = 0;
            for (let i = 0; i < NUM_CELLS; i++) {
                if (grid[i] < minT) minT = grid[i];
                if (grid[i] > maxT) {
                    maxT = grid[i];
                    hotIdx = i;
                }
            }
            // Update hotspot coords
            hotspotRef.current = {
                x: (hotIdx % GRID_W) / GRID_W,
                y: Math.floor(hotIdx / GRID_W) / GRID_H
            };
            // Smoothly adjust range (no hard floors to support sub-zero/LN2)
            const targetMin = minT - 5;
            const targetMax = Math.max(targetMin + 20, maxT + 5); // Maintain at least 20C span
            rangeMin.current += (targetMin - rangeMin.current) * 0.1;
            rangeMax.current += (targetMax - rangeMax.current) * 0.1;

            const rMin = rangeMin.current;
            const rSpan = rangeMax.current - rMin || 1; // avoid div by 0

            // --- 3. RENDERING ---
            const palette = PALETTES[colorMode];
            // Iterate and write pixels
            // We use Little Endian ABGR for Uint32 setting (fastest in JS)

            for (let i = 0; i < NUM_CELLS; i++) {
                const t = grid[i];
                // Normalize 0..1
                let norm = (t - rMin) / rSpan;
                if (norm < 0) norm = 0;
                if (norm > 1) norm = 1;

                const lutIdx = Math.floor(norm * 255);
                let r = palette[lutIdx * 4 + 0];
                let g = palette[lutIdx * 4 + 1];
                let b = palette[lutIdx * 4 + 2];
                // Alpha is always 255 

                // Add sensor noise (Gaussian-ish or Uniform)
                // Real thermal sensors have grain.
                const noise = (Math.random() - 0.5) * 30;
                r = Math.min(255, Math.max(0, r + noise));
                g = Math.min(255, Math.max(0, g + noise));
                b = Math.min(255, Math.max(0, b + noise));

                // buf32[i] = 0xFF000000 | (b << 16) | (g << 8) | r; // ABGR
                // Actually the endianness depends on system, but typically:
                buf32[i] = (255 << 24) | (b << 16) | (g << 8) | r;
            }

            ctx.putImageData(imgData, 0, 0);

            // --- 4. HUD / OVERLAY (Native Canvas Text) ---
            // Draw hotspot marker
            // Find hottest index again (or reuse maxT loop logic if tracking index)
            // We'll just skip for perf or do a quick pass if needed, but maxT is good enough for text.

            frameId = requestAnimationFrame(animate);
        };

        frameId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frameId);
    }, [colorMode, coreCount, stateRef, GRID_W, GRID_H]); // Re-init on core count or resolution change

    // Toggle Mode Handler
    const toggleMode = () => {
        setColorMode(prev => {
            const modes: any[] = ['ironbow', 'magma', 'whitehot', 'spectrogram'];
            const idx = modes.indexOf(prev);
            return modes[(idx + 1) % modes.length];
        });
    };

    return (
        <div className={`flex flex-col items-center justify-center ${fullscreen ? 'h-full' : 'gap-2'} w-full ${className}`}>
            <div
                className={`relative overflow-hidden ${fullscreen ? 'rounded-none shadow-2xl' : 'rounded-2xl border border-white/10'} bg-black ${fullscreen ? 'aspect-square' : 'w-full h-full'} group cursor-crosshair transition-transform active:scale-95`}
                style={fullscreen ? { width: 'min(100vw, 100vh)' } : {}}
                onClick={toggleMode}
            >
                {/* HUD Overlay HTML - Cleaned Up */}
                <div className={`absolute ${fullscreen ? 'top-20' : 'top-4'} left-6 z-20 pointer-events-none`}>
                    <div className="flex items-center gap-2 px-2 py-0.5 bg-black/40 backdrop-blur-md rounded-full border border-white/5">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-[8px] font-bold uppercase tracking-[1px] text-white/60">
                            LIVE_IR
                        </span>
                    </div>
                </div>

                <div className={`absolute ${fullscreen ? 'top-20' : 'top-4'} right-6 z-20 pointer-events-none text-right`}>
                    <div className={`${fullscreen ? 'text-[20px] lg:text-[24px]' : 'text-[14px]'} font-black text-white/80 leading-none tabular-nums`}>
                        {Math.round(rangeMax.current - 5)}<span className={`${fullscreen ? 'text-[12px] lg:text-[14px]' : 'text-[10px]'} text-white/40 ml-0.5`}>°C</span>
                    </div>
                    {fullscreen && <div className="text-[10px] text-white/30 font-mono mt-1 tracking-widest leading-none">PEAK_DIE_SENSOR</div>}
                </div>

                {fullscreen && (
                    <div className="absolute bottom-[22%] lg:bottom-[18%] left-1/2 -translate-x-1/2 z-20 pointer-events-none font-mono w-full px-6 lg:px-12">
                        <div className="flex flex-row flex-wrap justify-center gap-x-3 lg:gap-x-10 gap-y-1.5 lg:gap-y-4 text-[7px] lg:text-[12px] text-white/30 lg:text-white/40 tracking-[1px] lg:tracking-[2px] uppercase">
                            <span className="flex items-center gap-1 lg:gap-2">
                                <span className="w-1 lg:w-1.5 h-1 lg:h-1.5 bg-cyan-500/50 lg:bg-cyan-400 rounded-full" />
                                SOLVER: FDM
                            </span>
                            <span className="flex items-center gap-1 lg:gap-2">
                                <span className="w-1 lg:w-1.5 h-1 lg:h-1.5 bg-cyan-500/50 lg:bg-cyan-400 rounded-full" />
                                RES: {GRID_W}
                            </span>
                            <span className="flex items-center gap-1 lg:gap-2">
                                <span className="w-1 lg:w-1.5 h-1 lg:h-1.5 bg-cyan-500/50 lg:bg-cyan-400 rounded-full" />
                                DT: {((rangeMax.current - rangeMin.current) / 255).toFixed(3)}
                            </span>
                            <span className="flex items-center gap-1 lg:gap-2">
                                <span className="w-1 lg:w-1.5 h-1 lg:h-1.5 bg-cyan-500/50 lg:bg-cyan-400 rounded-full" />
                                CORES: {coreCount}
                            </span>
                        </div>
                    </div>
                )}

                {/* Canvas - Rendered Pixelated for "Sensor" look */}
                <canvas
                    ref={canvasRef}
                    className="w-full h-full object-cover image-pixelated"
                    style={{ imageRendering: 'pixelated' }}
                />

                {/* Scanline Effect - Reduced opacity to prevent dimming */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%] pointer-events-none opacity-20" />

                {/* Hotspot Crosshair (Fullscreen) */}
                {fullscreen && (
                    <div
                        className="absolute z-30 pointer-events-none transition-all duration-300 ease-out"
                        style={{
                            left: `${hotspotRef.current.x * 100}%`,
                            top: `${hotspotRef.current.y * 100}%`,
                            transform: 'translate(-50%, -50%)'
                        }}
                    >
                        <div className="relative w-8 h-8 flex items-center justify-center">
                            <div className="absolute w-full h-[1px] bg-white/20" />
                            <div className="absolute h-full w-[1px] bg-white/20" />
                            <div className="w-3 h-3 rounded-full border-2 border-white/80 shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                            <span className="absolute top-6 left-6 text-[12px] font-mono font-bold text-white/90 whitespace-nowrap bg-black/40 backdrop-blur-sm px-2 py-1 rounded border border-white/10">
                                HOTSPOT: {Math.round(rangeMax.current - 5)}°C
                            </span>
                        </div>
                    </div>
                )}

                {/* Integrated Legend (Fullscreen) */}
                {fullscreen && (
                    <div className="absolute bottom-4 lg:bottom-8 left-1/2 -translate-x-1/2 z-40 w-[90%] lg:w-96 px-4 lg:px-6 py-2 lg:py-3 bg-black/60 backdrop-blur-md rounded-full border border-white/10 shadow-lg">
                        <div className="flex items-center justify-between text-[10px] lg:text-[12px] text-white/50 font-mono mb-2 px-1 tracking-[1px] lg:tracking-[2px] uppercase">
                            <span>{Math.round(rangeMin.current)}°C</span>
                            <span>{Math.round(rangeMax.current)}°C</span>
                        </div>
                        <div className="w-full h-3 rounded-full bg-black/60 border border-white/10 overflow-hidden relative shadow-inner">
                            {colorMode === 'ironbow' && (
                                <div className="w-full h-full bg-[linear-gradient(to_right,#1a0033_0%,#2a0080_15%,#8000ff_30%,#ff0000_45%,#ff8000_65%,#ffff00_85%,#fff_100%)]" />
                            )}
                            {colorMode === 'magma' && (
                                <div className="w-full h-full bg-[linear-gradient(to_right,#15001a_0%,#4b1001_25%,#96400c_50%,#e18f2a_75%,#ffff64_100%)]" />
                            )}
                            {colorMode === 'whitehot' && (
                                <div className="w-full h-full bg-gradient-to-r from-black via-gray-600 to-white" />
                            )}
                            {colorMode === 'spectrogram' && (
                                <div className="w-full h-full bg-[linear-gradient(to_right,#8000ff_0%,#0000ff_20%,#00ffff_40%,#00ff00_60%,#ffff00_80%,#ff0000_100%)]" />
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Legend (Mini-view only) */}
            {!fullscreen && (
                <div className="w-full px-6 mt-1">
                    <div className="flex items-center justify-between text-[11px] text-white/30 font-mono mb-1.5 px-1">
                        <span>{Math.round(rangeMin.current)}°C</span>
                        <span>{Math.round(rangeMax.current)}°C</span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-black/60 border border-white/10 overflow-hidden relative shadow-inner">
                        {colorMode === 'ironbow' && (
                            <div className="w-full h-full bg-[linear-gradient(to_right,#1a0033_0%,#2a0080_15%,#8000ff_30%,#ff0000_45%,#ff8000_65%,#ffff00_85%,#fff_100%)]" />
                        )}
                        {colorMode === 'magma' && (
                            <div className="w-full h-full bg-[linear-gradient(to_right,#15001a_0%,#4b1001_25%,#96400c_50%,#e18f2a_75%,#ffff64_100%)]" />
                        )}
                        {colorMode === 'whitehot' && (
                            <div className="w-full h-full bg-gradient-to-r from-black via-gray-600 to-white" />
                        )}
                        {colorMode === 'spectrogram' && (
                            <div className="w-full h-full bg-[linear-gradient(to_right,#8000ff_0%,#0000ff_20%,#00ffff_40%,#00ff00_60%,#ffff00_80%,#ff0000_100%)]" />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
