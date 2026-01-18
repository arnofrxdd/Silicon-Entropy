import { useRef, useCallback } from 'react';
import { CONFIG, MATERIALS, COOLING_TYPES, PHYSICS } from '../constants';

export const usePhysicsEngine = () => {
    const state = useRef({
        // User Inputs
        targetLoad: 10,
        fanSpeed: 40,
        ambientTemp: 25,
        humidity: 50,
        pasteQuality: 0.9,
        voltage: 1.20,         // V (New)
        dustDensity: 0,        // % (New - blocks air)
        clockRatio: 1.0,       // New: Manual clock multiplier


        // Configurations
        material: MATERIALS.ALUMINUM,
        coolingType: COOLING_TYPES.AIR,

        // Experimental Flags
        expSuperconductor: false,
        expQuantum: false,       // New: Random clock bursts
        expUnlockVoltage: false,
        expDisableSafety: false,
        expEntropy: 0,           // Random thermal spikes
        expTimeDilation: 1.0,    // Physics simulation speed

        // Architecture State
        coreCount: 8,
        smtEnabled: true,
        cacheIntensity: 0.5,
        archRecursiveSMT: false, // 128-way SMT
        archDarkSilicon: false,  // Harvest dead transistors
        archNeuralPrediction: false, // AI Branch Prediction

        // Impossible / Anomaly Features
        expSingularity: false,   // Infinite cooling but visual drift
        expVacuumEnergy: false,  // Zero power leakage
        expTemporalClock: false, // FTL clock speeds
        expFusion: false,        // Inverse thermodynamics
        expMatterShift: false,   // Thermal phase reset
        expInfiniteCore: false,  // Infinite processing density
        expRealityAnchor: true,  // Keeps physics constants stable
        expSentience: false,     // AI takes over control

        // Live Simulation State

        // Live Simulation State
        currentTemp: 25,
        heatsinkTemp: 25,
        coolantTemp: 25,
        dewPoint: 0,
        condensationRisk: 0,
        isHalted: false,       // System shutdown state
        haltReason: '',        // 'HEAT' or 'COLD'

        // Advanced Scientific Metrics
        siliconHealth: 100,    // % (Degrades with electromigration)
        leakageCurrent: 0,     // mA
        thermalResistance: 0,  // K/W
        mtbf: 87600,           // Hours (approx 10 years base)

        currentClock: CONFIG.BASE_CLOCK,
        currentLoad: 10,
        powerDraw: 0,
        thermalStatus: 'OPTIMAL',

        // History
        history: Array(CONFIG.HISTORY_SIZE).fill({ temp: 25, clock: 5.0, health: 100 }),
        fps: 60,
    });

    const lastTick = useRef(performance.now());
    const historyTimer = useRef(0);
    const frameCount = useRef(0);
    const lastFpsTime = useRef(performance.now());

    const update = useCallback(() => {
        const now = performance.now();
        const dtReal = Math.min((now - lastTick.current) / 1000, 0.1);
        const dt = dtReal * state.current.expTimeDilation;
        lastTick.current = now;

        // FPS Counter
        frameCount.current++;
        if (now - lastFpsTime.current >= 1000) {
            state.current.fps = frameCount.current;
            frameCount.current = 0;
            lastFpsTime.current = now;
        }

        const s = state.current;

        // --- 0. System Halt Logic (REMOVED - NO SAFETY) ---
        // Safety checks deleted. Godspeed.

        // --- 1. Environmental Physics ---
        const a = 17.27;
        const b = 237.7;
        const alpha = ((a * s.ambientTemp) / (b + s.ambientTemp)) + Math.log(s.humidity / 100.0);
        s.dewPoint = (b * alpha) / (a - alpha);

        const surfaceTemp = s.coolingType.type === 'AIO' ? s.heatsinkTemp : s.currentTemp;
        if (surfaceTemp < s.dewPoint) {
            s.condensationRisk = Math.min(s.condensationRisk + dt * 10, 100);
        } else {
            s.condensationRisk = Math.max(s.condensationRisk - dt * 5, 0);
        }

        // --- 2. Load & Clock Logic ---
        const voltageScaling = s.voltage / 1.20;
        const MAX_CLOCK = (s.expUnlockVoltage ? 12.0 : CONFIG.BASE_CLOCK) * voltageScaling;

        // Quantum Effect: Random frequency fluctuations
        const quantumBurst = s.expQuantum ? (Math.random() - 0.5) * 5.0 : 0;

        // Quantum Tunneling Leakage: At high voltages, electrons jump barriers, increasing power draw
        const tunnelingLeakage = s.expQuantum ? Math.exp(s.voltage * 2.5) * 2.0 : 0;

        // Entropy: Random thermal spikes in the lattice
        const entropySpike = (Math.random() * s.expEntropy * 0.5) * dt;
        s.currentTemp += entropySpike;

        const loadDiff = s.targetLoad - s.currentLoad;
        s.currentLoad += loadDiff * 5.0 * dt;

        let targetClock = Math.max(MAX_CLOCK * s.clockRatio + quantumBurst, CONFIG.MIN_CLOCK);

        // Impossible: Temporal Overclock (FTL)
        if (s.expTemporalClock) {
            targetClock *= 20.0; // 100GHz+ speeds
            s.thermalStatus = 'TEMPORAL_DRIFT';
        }

        // Impossible: Infinite Core Density
        if (s.expInfiniteCore) {
            targetClock *= 5.0; // Massive parallelism boost
            if (Math.random() < 0.1) s.currentLoad = 999; // Instant load spikes
            s.thermalStatus = 'SINGULARITY';
        }

        // Impossible: Sentience (AI Takeover)
        if (s.expSentience) {
            // The CPU decides its own voltage and clock
            s.voltage = 1.0 + Math.sin(now / 500) * 0.5;
            targetClock = 8.0 + Math.sin(now / 200) * 4.0;
            s.thermalStatus = 'I_AM_ALIVE';
            if (Math.random() < 0.05) s.targetLoad = Math.random() * 100;
        }

        // Impossible: Reality Anchor Failure (Chaos Mode)
        if (!s.expRealityAnchor) {
            targetClock *= (Math.random() * 5); // Chaotic clock
            s.thermalStatus = 'REALITY_FAIL';
        }

        // Throttling Logic REMOVED.
        // We just check for simple status updates now.
        if (!s.expSentience && !s.expTemporalClock && !s.expInfiniteCore && !s.expSentience && s.expRealityAnchor) {
            if (s.currentTemp > 110) s.thermalStatus = 'CRITICAL';
            else if (targetClock > CONFIG.BASE_CLOCK + 1) s.thermalStatus = 'OVERCLOCKED';
            else s.thermalStatus = 'OPTIMAL';
        }

        // Throttling Logic for "FPS Lag" Simulation
        // If expDisableSafety is ON, we don't throttle the clock, but we still lag the simulation to show 'instability'
        // If Safety is default (expDisableSafety false), we hard throttle clock.

        const THROTTLE_THRESHOLD = 100;
        let fpsPenalty = 0;

        if (s.currentTemp > THROTTLE_THRESHOLD) {
            const excess = s.currentTemp - THROTTLE_THRESHOLD;
            const severity = Math.min(1, excess / 30); // 0 to 1 over 30 degrees (100C -> 130C)

            s.thermalStatus = 'THROTTLING';

            if (!s.expDisableSafety) {
                // Hard Clock Throttling
                targetClock = Math.min(targetClock, CONFIG.BASE_CLOCK * (1 - severity * 0.9)); // Drop to 10% speed

                // Simulate System Lag (FPS Drop) ONLY when safety is engaged
                // Drop almost to zero, with some 'stalling' jitter
                const stall = Math.random() < severity * 0.2 ? 59.9 : 0;
                fpsPenalty = Math.max(fpsPenalty, (severity * 59.8) + stall);
            } else {
                // If safety is disabled, we keep the speed but mark status
                s.thermalStatus = 'CRITICAL_HEAT';
                // No FPS penalty when safety is bypassed
            }
        } else {
            // Reset status if not other status
            if (s.thermalStatus === 'THROTTLING') s.thermalStatus = 'OPTIMAL';
        }

        // Fake FPS calculation based on CPU Power (GHz)
        // 5.0 GHz = ~144 FPS standard
        // Scales linearly with clock speed
        const rawFps = (s.currentClock * 28.8) - fpsPenalty;
        s.fps = Math.max(0, rawFps + (Math.random() * 5)); // Add minor jitter

        s.currentClock = s.currentClock * 0.9 + targetClock * 0.1;

        // --- 3. Power & Advanced Scientific Metrics ---
        const clockRatio = s.currentClock / CONFIG.BASE_CLOCK;
        const loadFactor = s.currentLoad / 100;

        // Electromigration & Silicon Health (Simplified Black's Equation)
        // Rate = A * J^n * exp(-Ea / kT)
        const currentDensity = (s.voltage * loadFactor) + 0.1;
        const thermalActivation = Math.exp((s.currentTemp - 25) * 0.05);
        const degradationRate = 0.00001 * Math.pow(currentDensity, 2) * thermalActivation * dt;
        s.siliconHealth = Math.max(0, s.siliconHealth - degradationRate);

        // MTBF Calculation (Arrhenius Model)
        // Reliability drops 50% for every 10C rise above 25C
        const tempAcceleration = Math.pow(2, (s.currentTemp - 25) / 10);
        const voltageAcceleration = Math.pow(s.voltage / 1.2, 4);
        s.mtbf = 87600 / (tempAcceleration * voltageAcceleration);

        // Leakage Current (Subthreshold Leakage)
        // I_leak ~ exp(V / (n*Vt)) * exp(-q*Vth / kT)
        s.leakageCurrent = (Math.exp(s.voltage * 1.5) * Math.exp((s.currentTemp - 25) * 0.04)) * 0.5;

        // Thermal Resistance (Case-to-Ambient Estimate)
        const pasteFactor = 1 / s.pasteQuality;
        const materialFactor = 1 / s.material.conductivity;
        s.thermalResistance = (pasteFactor * 0.05) + (materialFactor * 0.1) + (1 / (s.fanSpeed / 10 + 0.1) * 0.02);

        const leakageFactor = Math.exp((Math.min(s.currentTemp, 150) - 25) * 0.015);
        const coreFactor = s.coreCount / 8; // Scale power by core count
        let smtFactor = s.smtEnabled ? 1.2 : 1.0;

        // Impossible Architecture: Recursive SMT
        // Exponentially increases "effective" connections (heat) for linear performance
        if (s.archRecursiveSMT) {
            smtFactor = 8.0;
        }

        // Impossible Architecture: Dark Silicon Harvesting
        // Uses dead transistors as heatsinks/cache. Reduces leakage slightly.
        const darkSiliconEfficiency = s.archDarkSilicon ? 0.6 : 1.0;

        // Impossible Architecture: Neural Prediction
        // Increases efficiency (less wasted cycles) -> slightly less heat per clock
        const efficiencyMod = s.archNeuralPrediction ? 0.85 : 1.0;

        const staticPower = s.expVacuumEnergy ? 0 : 15 * leakageFactor * voltageScaling * coreFactor * darkSiliconEfficiency;
        const dynamicPower = (120 * loadFactor * Math.pow(clockRatio, 3) * Math.pow(s.voltage, 2) * coreFactor * smtFactor * efficiencyMod);

        s.powerDraw = (staticPower + dynamicPower + s.coolingType.power + tunnelingLeakage);

        // Superconductivity: Zero resistance (no heat) only below critical temperature (-180C)
        const isSuperconducting = s.expSuperconductor && s.currentTemp < -180;
        let heatIn = isSuperconducting ? 0 : (staticPower + dynamicPower + tunnelingLeakage);

        // Impossible: Singularity Cooling
        if (s.expSingularity) {
            heatIn = -1000000; // Infinite heat sink
        }

        // Impossible: Nuclear Fusion (Inverse Thermodynamics)
        // Under high load, fusion stabilizes, actually cooling the die
        if (s.expFusion) {
            const fusionStability = s.currentLoad / 100;
            heatIn = (staticPower + dynamicPower) * (1 - fusionStability * 3.0);
            s.powerDraw += 5000 * fusionStability; // Generates MASSIVE power
        }

        // Impossible: Reality Anchor Failure (Physics Constants Break)
        if (!s.expRealityAnchor) {
            heatIn *= (Math.random() * 10 - 5); // Heat can randomly become cold or super-hot
            s.powerDraw *= (Math.random() * 2);
        }

        // --- 4. Advanced Thermodynamics ---
        // Dust reduction: reduces airflow effectiveness
        const dustPenalty = 1 - (s.dustDensity / 120);
        const fanEfficiency = (0.1 + (Math.pow(s.fanSpeed / 100, 2) * 5.0)) * dustPenalty;
        const pasteConductance = s.pasteQuality * 20.0;

        const heatToBlock = (s.currentTemp - s.heatsinkTemp) * pasteConductance;

        if (s.coolingType.type === 'AIR') {
            const coolingPower = fanEfficiency * s.material.conductivity * 2.5;
            // Air cooling cannot go below ambient. If heatsink is below ambient, it warms up.

            // Stability Clamp for High Conductivity Materials (Neutronium)
            // If coolingPower is too high, the Euler step causes oscillation/explosion.
            // We clamp the dissipation factor to 1.0 (instant equilibrium).
            const dissipationFactor = (coolingPower / 10) * dt;
            const stableFactor = Math.min(dissipationFactor, 1.0);

            s.currentTemp += (heatIn / 10) * dt; // Apply heat source
            s.currentTemp -= (s.currentTemp - s.ambientTemp) * stableFactor; // Apply cooling

            s.heatsinkTemp = s.currentTemp * 0.8 + s.ambientTemp * 0.2; // Heatsink follows core with air

        } else if (s.coolingType.type === 'AIO') {
            const waterConductance = 150.0;
            const heatToWater = (s.heatsinkTemp - s.coolantTemp) * waterConductance;
            const radDissipation = (s.coolantTemp - s.ambientTemp) * (fanEfficiency * 18.0);
            s.currentTemp += ((heatIn - heatToBlock) / 10) * dt;
            s.heatsinkTemp += ((heatToBlock - heatToWater) / 50) * dt;
            const WATER_MASS = 200 * PHYSICS.WATER_SPECIFIC_HEAT;
            s.coolantTemp += ((heatToWater - radDissipation) / WATER_MASS) * dt;
            // Environmental leak: coolant tries to reach ambient over time
            s.coolantTemp += (s.ambientTemp - s.coolantTemp) * 0.05 * dt;

        } else if (s.coolingType.type === 'TEC') {
            const tecPower = 200 * voltageScaling;
            const pumpEfficiency = 0.6;
            const heatPumped = tecPower * pumpEfficiency;
            const totalHeatToHeatsink = heatPumped + tecPower;
            const coolingPower = fanEfficiency * s.material.conductivity * 4.0;
            const heatDissipated = (s.heatsinkTemp - s.ambientTemp) * coolingPower;
            s.currentTemp += ((heatIn - heatPumped) / 10) * dt;
            s.heatsinkTemp += ((totalHeatToHeatsink - heatDissipated) / s.material.thermalMass) * dt;
            // Ambient leak back to core (imperfection)
            s.currentTemp += (s.ambientTemp - s.currentTemp) * 0.1 * dt;

        } else if (s.coolingType.type === 'LN2') {
            // LN2: Boils at -196C. Heatsink = Pot.
            const target = -196;
            s.currentTemp += ((heatIn - heatToBlock) / 10) * dt;
            // The liquid nitrogen absorbs heat and boils. 
            // We model heatsinkTemp as the pot temperature.
            // If the pot is hotter than -196, it rapidly cools down (infinite reservoir assumption for simplicity? or finite boil rate)
            // Let's assume consistent top-up:
            s.heatsinkTemp -= (s.heatsinkTemp - target) * 2.0 * dt;
            s.heatsinkTemp += (heatToBlock / 200) * dt;

        } else if (s.coolingType.type === 'PHASE') {
            // Phase Change: Compressor loop. Target -50C.
            const target = -50;
            const compressorPower = 300;
            const removal = Math.min(compressorPower, (s.heatsinkTemp - target) * 10);
            s.currentTemp += ((heatIn - heatToBlock) / 10) * dt;
            s.heatsinkTemp += ((heatToBlock - removal) / s.material.thermalMass) * dt;
            s.heatsinkTemp -= (s.heatsinkTemp - s.ambientTemp) * 0.05 * dt; // Slow ambient leak

        } else if (s.coolingType.type === 'LHE') {
            // Liquid Helium: -269C.
            const target = -269;
            s.currentTemp += ((heatIn - heatToBlock) / 10) * dt;
            s.heatsinkTemp -= (s.heatsinkTemp - target) * 3.0 * dt; // Strong pull
            s.heatsinkTemp += (heatToBlock / 100) * dt;

        } else if (s.coolingType.type === 'BEC') {
            // Bose-Einstein: Absolute Zero.
            const target = -273.15;
            s.currentTemp += ((heatIn - heatToBlock) / 10) * dt;
            s.heatsinkTemp = target; // Quantum lock
        }

        // Bounds REMOVED for infinite temperature support
        // if (s.currentTemp < -273.15) s.currentTemp = -273.15; // Absolute zero
        // if (s.currentTemp > 1000) s.currentTemp = 1000;      // Vaporization point? lol

        // History
        historyTimer.current += dt;
        if (historyTimer.current > 0.1) {
            s.history.push({ temp: s.currentTemp, clock: s.currentClock, health: s.siliconHealth });
            if (s.history.length > CONFIG.HISTORY_SIZE) s.history.shift();
            historyTimer.current = 0;
        }

        return s;
    }, []);

    return { state, update };
};
