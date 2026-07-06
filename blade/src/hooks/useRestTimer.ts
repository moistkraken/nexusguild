import { useEffect, useRef, useState } from 'react'

export function useRestTimer() {
  const [remaining, setRemaining] = useState(0)
  const [running, setRunning] = useState(false)
  const intervalRef = useRef<number | null>(null)

  useEffect(() => {
    if (!running) return
    intervalRef.current = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          setRunning(false)
          return 0
        }
        return r - 1
      })
    }, 1000)
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current)
    }
  }, [running])

  function start(seconds: number) {
    setRemaining(seconds)
    setRunning(true)
  }

  function stop() {
    setRunning(false)
    setRemaining(0)
  }

  function addTime(seconds: number) {
    setRemaining((r) => Math.max(0, r + seconds))
  }

  return { remaining, running, start, stop, addTime }
}
