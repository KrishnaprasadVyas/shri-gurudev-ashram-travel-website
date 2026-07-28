import { useEffect } from 'react'

export function usePageTitle(title: string) {
  useEffect(() => {
    if (title === 'माँ वैष्णवी टूरिज़्म' || !title) {
      document.title = 'माँ वैष्णवी टूरिज़्म'
    } else {
      document.title = `${title} — माँ वैष्णवी टूरिज़्म`
    }
    return () => {
      document.title = 'माँ वैष्णवी टूरिज़्म'
    }
  }, [title])
}
