import type { LucideIcon } from 'lucide-react'
import { useTranslation } from "react-i18next";

interface StatsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  color?: string
  footer?: string
  onClick?: () => void
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  color = 'bg-[#F5EFE4] text-[#B8860B] border-[#E9DCC5]',
  footer,
  onClick,
}: StatsCardProps) {
    const { t } = useTranslation();
  return (
    <div
      onClick={onClick}
      className={`group relative p-6 sm:p-7 rounded-3xl bg-[#FFFFFF] border border-[#E9DCC5] shadow-[0_8px_30px_rgba(62,43,31,0.04)] transition-all duration-300 cubic-bezier(0.16,1,0.3,1) hover:-translate-y-1 hover:border-[#B8860B]/50 hover:shadow-[0_16px_40px_rgba(62,43,31,0.08)] ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1.5 flex-1 min-w-0">
          <p className="font-label-caps text-[11px] uppercase tracking-[0.16em] font-bold text-[#6F5B47] group-hover:text-[#3E2B1F] transition-colors truncate">
            {title}
          </p>
          <p className="font-display text-3xl sm:text-4xl font-bold text-[#3E2B1F] tracking-tight">
            {value}
          </p>
          {footer && (
            <p className="text-xs text-[#6F5B47]/80 font-normal pt-1 block truncate">
              {footer}
            </p>
          )}
        </div>
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border border-[#E9DCC5] shadow-2xs transition-transform duration-300 group-hover:scale-110 group-hover:bg-[#FFF7E8] ${color}`}
        >
          <Icon className="h-6 w-6 text-[#B8860B]" />
        </div>
      </div>
    </div>
  )
}
