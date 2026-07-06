import { Navigate, Route, Routes } from 'react-router-dom'
import { useProfile } from './hooks/useProfile'
import { BottomNav } from './components/ui/BottomNav'
import { Onboarding } from './pages/Onboarding'
import { Dashboard } from './pages/Dashboard'
import { WorkoutSession } from './pages/WorkoutSession'
import { History } from './pages/History'
import { Progress } from './pages/Progress'
import { Settings } from './pages/Settings'

function App() {
  const profile = useProfile()

  if (profile === undefined) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-void">
        <span className="font-display text-cyan text-glow-cyan text-sm tracking-[0.3em] animate-pulse-glow">
          BOOTING BLADE...
        </span>
      </div>
    )
  }

  const onboarded = !!profile?.onboarded

  return (
    <div className="min-h-dvh bg-void bg-grid bg-scanlines relative overflow-x-hidden">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-32 bg-gradient-to-b from-cyan/[0.04] to-transparent animate-scan-sweep z-[1]" />
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
        {!onboarded ? (
          <Route path="*" element={<Navigate to="/onboarding" replace />} />
        ) : (
          <>
            <Route path="/" element={<Dashboard />} />
            <Route path="/workout" element={<WorkoutSession />} />
            <Route path="/history" element={<History />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )}
      </Routes>
      {onboarded && <BottomNav />}
    </div>
  )
}

export default App
