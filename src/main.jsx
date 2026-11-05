import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

const root = createRoot(document.getElementById('root'))

// Show a clear setup message instead of a blank page when .env is missing.
if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  root.render(
    <div className="mx-auto max-w-xl p-10 text-sm leading-7">
      <h1 className="mb-3 font-serif text-3xl">Тохиргоо дутуу байна</h1>
      <p>
        <code>.env.example</code> файлыг <code>.env</code> нэрээр хуулж, Supabase-ийн URL болон anon
        түлхүүрээ оруулаад серверээ дахин асаана уу.
      </p>
    </div>,
  )
} else {
  const App = lazy(() => import('./App.jsx'))
  root.render(
    <StrictMode>
      <Suspense fallback={null}>
        <App />
      </Suspense>
    </StrictMode>,
  )
}
