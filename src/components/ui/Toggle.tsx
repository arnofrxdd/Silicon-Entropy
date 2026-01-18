import type { FC } from 'react';
import { Flame } from 'lucide-react';

interface ToggleProps {
    label: string;
    active: boolean;
    onClick: () => void;
    color?: 'cyan' | 'purple' | 'red';
    danger?: boolean;
}

export const Toggle: FC<ToggleProps> = ({
    label,
    active,
    onClick,
    color = 'cyan',
    danger = false
}) => {
    const activeBg = danger ? 'bg-rose-500/20 border-rose-500/50 text-rose-400'
        : color === 'purple' ? 'bg-purple-500/20 border-purple-500/50 text-purple-400'
            : 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400';

    const knobBg = danger ? 'bg-rose-500'
        : color === 'purple' ? 'bg-purple-500'
            : 'bg-cyan-500';

    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all text-[11px] font-black uppercase tracking-[2px] mb-2 group
        ${active ? activeBg : 'bg-white/5 border-white/10 text-white/30 hover:bg-white/10 hover:border-white/20'}
      `}
        >
            <span className="flex items-center gap-2">
                {danger && <Flame size={12} className={active ? 'text-rose-400' : 'text-white/20'} />}
                {label}
            </span>
            <div className={`w-8 h-4 rounded-full relative transition-all duration-300 ${active ? knobBg : 'bg-white/10'}`}>
                <div className={`absolute top-1 w-2 h-2 bg-white rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(255,255,255,0.8)] ${active ? 'left-[18px]' : 'left-1'}`} />
            </div>
        </button>
    );
};
