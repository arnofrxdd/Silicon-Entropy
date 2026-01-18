import type { FC } from 'react';

interface RangeSliderProps {
    label: string;
    value: number;
    min: number;
    max: number;
    step?: number;
    unit?: string;
    onChange: (val: number) => void;
    color?: 'cyan' | 'purple' | 'red';
    disabled?: boolean;
}

export const RangeSlider: FC<RangeSliderProps> = ({
    label,
    value,
    min,
    max,
    step = 1,
    unit = '',
    onChange,
    color = 'cyan',
    disabled = false
}) => {
    const accentColor = color === 'purple' ? 'accent-purple-500' : color === 'red' ? 'accent-rose-500' : 'accent-cyan-400';
    const textColor = color === 'purple' ? 'text-purple-400' : color === 'red' ? 'text-rose-400' : 'text-cyan-400';

    return (
        <div className={`space-y-3 group ${disabled ? 'opacity-30 pointer-events-none' : ''}`}>
            <div className="flex justify-between items-center px-0.5">
                <label className="text-[10px] font-black text-white/30 uppercase tracking-[2px] group-hover:text-white/50 transition-colors">
                    {label}
                </label>
                <div className="flex items-baseline gap-1">
                    <span className={`text-[11px] font-mono font-bold ${textColor}`}>{value}</span>
                    <span className="text-[8px] font-bold text-white/20 uppercase">{unit}</span>
                </div>
            </div>
            <div className="relative h-2 flex items-center">
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={(e) => onChange(parseFloat(e.target.value))}
                    className={`w-full h-1 bg-white/5 rounded-full appearance-none cursor-pointer transition-all hover:bg-white/10 ${accentColor}`}
                />
            </div>
        </div>
    );
};
