import { Loader2, AlertCircle, Sparkles, RefreshCw } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useTranslation } from "react-i18next";

// ─── LoadingState ─────────────────────────────────────────────────────────────

interface LoadingStateProps {
  variant?: 'cards' | 'table' | 'detail' | 'full-page'
  count?: number
}

export function LoadingState({ variant = 'full-page', count = 3 }: LoadingStateProps) {
    const { t } = useTranslation();
  if (variant === 'full-page') {
    return (
      <div className="min-h-[380px] flex flex-col items-center justify-center gap-4 p-8 sm:p-12 rounded-3xl bg-[#FFFFFF] border border-[#E9DCC5] max-w-xl mx-auto my-12 shadow-[0_8px_30px_rgba(62,43,31,0.04)] animate-in fade-in duration-300">
        <div className="w-14 h-14 rounded-2xl bg-[#F5EFE4] border border-[#E9DCC5] flex items-center justify-center shadow-2xs">
          <Loader2 className="h-6 w-6 animate-spin text-[#B8860B]" />
        </div>
        <div className="text-center space-y-1">
          <p className="font-display text-xl font-bold text-[#3E2B1F]">{t('public.loading.records')}</p>
          <p className="text-xs text-[#6F5B47]">{t('public.loading.waitData')}</p>
        </div>
      </div>
    )
  }

  if (variant === 'cards') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="rounded-3xl bg-[#FFFFFF] border border-[#E9DCC5] overflow-hidden animate-pulse flex flex-col justify-between shadow-2xs"
          >
            <div className="h-48 bg-[#F5EFE4]/80" />
            <div className="p-6 space-y-4">
              <div className="h-5 bg-[#F5EFE4] rounded-md w-3/4" />
              <div className="h-3 bg-[#F5EFE4]/60 rounded-md w-full" />
              <div className="h-3 bg-[#F5EFE4]/60 rounded-md w-2/3" />
              <div className="pt-4 border-t border-[#E9DCC5]/60 flex items-center justify-between gap-3">
                <div className="h-9 bg-[#F5EFE4] rounded-full flex-1" />
                <div className="h-9 w-9 bg-[#F5EFE4] rounded-xl" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (variant === 'table') {
    return (
      <div className="p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] border border-[#E9DCC5] space-y-4 shadow-[0_8px_30px_rgba(62,43,31,0.04)]">
        <div className="flex items-center justify-between pb-3 border-b border-[#E9DCC5] animate-pulse">
          <div className="h-5 bg-[#F5EFE4] rounded-md w-48" />
          <div className="h-8 bg-[#F5EFE4] rounded-full w-32" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 bg-[#F5EFE4]/40 border border-[#E9DCC5]/60 rounded-2xl animate-pulse flex items-center px-6 gap-6">
              <div className="w-16 h-3 bg-[#F5EFE4] rounded" />
              <div className="w-40 h-3 bg-[#F5EFE4] rounded" />
              <div className="w-28 h-3 bg-[#F5EFE4] rounded" />
              <div className="w-20 h-5 bg-[#F5EFE4] rounded-full ml-auto" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (variant === 'detail') {
    return (
      <div className="space-y-6 animate-pulse max-w-3xl mx-auto">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#FFFFFF] border border-[#E9DCC5]" />
          <div className="space-y-2">
            <div className="h-7 bg-[#F5EFE4] rounded-md w-48" />
            <div className="h-3 bg-[#F5EFE4]/60 rounded w-64" />
          </div>
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-8 rounded-3xl bg-[#FFFFFF] border border-[#E9DCC5] space-y-4 shadow-sm">
            <div className="h-5 bg-[#F5EFE4] rounded w-40" />
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="h-8 bg-[#F5EFE4]/50 rounded-xl" />
            ))}
          </div>
        ))}
      </div>
    )
  }

  return null
}

// ─── ErrorState ───────────────────────────────────────────────────────────────

interface ErrorStateProps {
  message?: string
  onRetry?: () => void
}

export function ErrorState({ message = 'We encountered an issue while retrieving data.', onRetry }: ErrorStateProps) {
    const { t } = useTranslation();
  return (
    <div className="min-h-[360px] flex flex-col items-center justify-center gap-5 text-center p-8 sm:p-12 rounded-3xl bg-[#FFFFFF] border border-[#E9DCC5] max-w-lg mx-auto my-8 shadow-[0_8px_30px_rgba(62,43,31,0.04)] animate-in fade-in duration-300">
      <div className="w-14 h-14 rounded-2xl bg-[#C0392B]/15 border border-[#C0392B]/30 flex items-center justify-center text-[#C0392B] shadow-2xs">
        <AlertCircle className="h-7 w-7" />
      </div>
      <div className="space-y-1.5 max-w-md">
        <h3 className="font-display text-xl font-bold text-[#3E2B1F]">{t('public.error.somethingWentWrong')}</h3>
        <p className="text-sm text-[#6F5B47] leading-relaxed font-normal">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-3 rounded-full bg-[#B8860B] text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 hover:bg-[#D4AF37] transition-all duration-250 cursor-pointer shadow-sm"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>{t('public.common.retry')}</span>
        </button>
      )}
    </div>
  )
}

// ─── EmptyState ───────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon?: LucideIcon
  title?: string
  description?: string
  action?: { label: string; href: string }
}

export function EmptyState({
  icon: Icon,
  title = 'Nothing here yet',
  description = 'Content will appear here once records are available.',
  action,
}: EmptyStateProps) {
    const { t } = useTranslation();
  return (
    <div className="min-h-[360px] flex flex-col items-center justify-center gap-4 text-center p-8 sm:p-12 rounded-3xl bg-[#FFFFFF] border border-[#E9DCC5] max-w-xl mx-auto my-8 shadow-[0_8px_30px_rgba(62,43,31,0.04)] animate-in fade-in duration-300">
      <div className="w-16 h-16 rounded-2xl bg-[#F5EFE4] border border-[#E9DCC5] flex items-center justify-center text-3xl shadow-2xs">
        {Icon ? <Icon className="h-8 w-8 text-[#B8860B]" /> : <span>🪷</span>}
      </div>
      <div className="space-y-1.5 max-w-md">
        <h3 className="font-display text-xl font-bold text-[#3E2B1F]">{title}</h3>
        {description && (
          <p className="text-sm text-[#6F5B47] leading-relaxed font-normal">{description}</p>
        )}
      </div>
      {action && (
        <a
          href={action.href}
          className="mt-2 px-7 py-3 rounded-full bg-[#B8860B] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#D4AF37] transition-all duration-250 inline-flex items-center gap-2 cursor-pointer shadow-sm hover:-translate-y-0.5"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>{action.label}</span>
        </a>
      )}
    </div>
  )
}
