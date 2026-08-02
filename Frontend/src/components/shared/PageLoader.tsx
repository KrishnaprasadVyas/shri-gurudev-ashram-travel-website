import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { useTranslation } from "react-i18next";

export function PageLoader() {
    const { t } = useTranslation();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20"
        >
          <Sparkles className="h-5 w-5 text-primary" />
        </motion.div>
        <p className="text-sm text-muted-foreground">{t('public.loading.sanctuary')}</p>
      </motion.div>
    </div>
  )
}
