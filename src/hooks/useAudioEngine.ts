import { useEffect, useRef, useCallback } from 'react';

export const useAudioEngine = (enabled: boolean, frequency: number, load: number) => {
    const audioContext = useRef<AudioContext | null>(null);
    const oscillator = useRef<OscillatorNode | null>(null);
    const gainNode = useRef<GainNode | null>(null);
    const lfo = useRef<OscillatorNode | null>(null);
    const lfoGain = useRef<GainNode | null>(null);

    // Initialize Audio Context (lazy load on user interaction ideally, but we'll try here)
    useEffect(() => {
        if (enabled && !audioContext.current) {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioCtx) {
                audioContext.current = new AudioCtx();

                // Main Drone
                oscillator.current = audioContext.current.createOscillator();
                gainNode.current = audioContext.current.createGain();

                // LFO for "throbbing" Sci-Fi effect
                lfo.current = audioContext.current.createOscillator();
                lfoGain.current = audioContext.current.createGain();

                // Connect LFO -> Gain -> Output
                lfo.current.frequency.value = 0.5; // Slow pulse
                lfoGain.current.gain.value = 0.3; // Modulation depth

                lfo.current.connect(lfoGain.current);
                lfoGain.current.connect(gainNode.current.gain);

                // Connect Main Osc -> Gain -> Output
                oscillator.current.type = 'sine'; // Deep sine wave
                oscillator.current.connect(gainNode.current);
                gainNode.current.connect(audioContext.current.destination);

                // Start Silence
                gainNode.current.gain.setValueAtTime(0, audioContext.current.currentTime);
                oscillator.current.start();
                lfo.current.start();
            }
        } else if (!enabled && audioContext.current) {
            audioContext.current.close();
            audioContext.current = null;
        }
    }, [enabled]);

    // Update Sound based on Physics
    useEffect(() => {
        if (audioContext.current && oscillator.current && gainNode.current && lfo.current) {
            const now = audioContext.current.currentTime;

            // Pitch maps to Frequency (Base 50Hz + freq * 20)
            const targetPitch = 50 + (frequency * 40);
            oscillator.current.frequency.setTargetAtTime(targetPitch, now, 0.1);

            // Volume maps to Load (0.05 to 0.3)
            const targetVol = Math.max(0.02, Math.min(0.2, load / 400));
            // Base gain is modulated by LFO, so we set the "center" gain roughly 
            // Actually we need to set the gainNode.gain.value... but LFO is connected to it.
            // Simpler: Just modulate frequency slightly for sci-fi feel, keep volume constant-ish

            gainNode.current.gain.setTargetAtTime(targetVol, now, 0.2);

            // LFO Speed maps to Load (faster pulse at high load)
            lfo.current.frequency.setTargetAtTime(0.5 + (load / 20), now, 0.5);
        }
    }, [frequency, load]); // Update when these change

    const playClick = useCallback(() => {
        if (!enabled || !audioContext.current) return;
        const osc = audioContext.current.createOscillator();
        const gain = audioContext.current.createGain();
        osc.connect(gain);
        gain.connect(audioContext.current.destination);

        osc.type = 'square';
        osc.frequency.setValueAtTime(800, audioContext.current.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, audioContext.current.currentTime + 0.1);

        gain.gain.setValueAtTime(0.1, audioContext.current.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.current.currentTime + 0.1);

        osc.start();
        osc.stop(audioContext.current.currentTime + 0.1);
    }, [enabled]);

    const playWarning = useCallback(() => {
        if (!enabled || !audioContext.current) return;
        const osc = audioContext.current.createOscillator();
        const gain = audioContext.current.createGain();
        osc.connect(gain);
        gain.connect(audioContext.current.destination);

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, audioContext.current.currentTime);
        osc.frequency.linearRampToValueAtTime(150, audioContext.current.currentTime + 0.3);

        gain.gain.setValueAtTime(0.2, audioContext.current.currentTime);
        gain.gain.linearRampToValueAtTime(0, audioContext.current.currentTime + 0.3);

        osc.start();
        osc.stop(audioContext.current.currentTime + 0.3);
    }, [enabled]);

    return { playClick, playWarning };
};
