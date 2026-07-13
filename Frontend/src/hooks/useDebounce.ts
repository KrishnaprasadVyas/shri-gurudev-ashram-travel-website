import { useState, useEffect } from 'react'

/**
 * E.3: Returns a debounced version of `value` that only updates
 * after `delay` milliseconds of no changes.
 */
export function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}
