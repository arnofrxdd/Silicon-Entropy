import type { LucideIcon } from 'lucide-react';

interface StatItemProps {
    label: string;
    value: string | number;
    unit: string;
    icon: LucideIcon;
    color?: string;
}

export function StatItem({ label, value, unit, icon: Icon, color = 'text-white' }: StatItemProps) {
    return (
        <div className="flex flex-col gap-0.5 group cursor-default">
            <div className="flex items-center gap-2 text-[9px] text-white/30 uppercase font-black tracking-[2px] transition-colors group-hover:text-white/50">
                <Icon size={10} className="transition-transform group-hover:scale-110" />
                {label}
            </div>
            <div className="flex items-baseline gap-1.5">
                <span className={`text-2xl font-black tracking-tight drop-shadow-sm ${color}`}>{value}</span>
                <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{unit}</span>
            </div>
        </div>
    );
}
