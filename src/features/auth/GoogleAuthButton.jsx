import { getGoogleAuthUrl } from '../../api/auth'

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 shrink-0">
      <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.91h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.4Z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.98-.9 6.64-2.42l-3.24-2.54c-.9.6-2.05.96-3.4.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.39 13.87A6 6 0 0 1 6.08 12c0-.65.11-1.28.31-1.87V7.51H3.04A10 10 0 0 0 2 12c0 1.61.39 3.14 1.04 4.49l3.35-2.62Z" />
      <path fill="#EA4335" d="M12 6c1.47 0 2.79.5 3.83 1.5l2.88-2.88A9.65 9.65 0 0 0 12 2a10 10 0 0 0-8.96 5.51l3.35 2.62C7.18 7.76 9.39 6 12 6Z" />
    </svg>
  )
}

export default function GoogleAuthButton({ mode = 'signin' }) {
  const label = mode === 'register' ? 'Sign up with Google' : 'Continue with Google'

  return (
    <button
      type="button"
      onClick={() => window.location.assign(getGoogleAuthUrl())}
      className="flex h-11 w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 text-[14px] font-semibold text-gray-700 shadow-sm transition-all duration-200 hover:border-gray-300 hover:bg-gray-50 hover:shadow-md active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
    >
      <GoogleMark />
      <span>{label}</span>
    </button>
  )
}

export function AuthDivider() {
  return (
    <div className="flex items-center gap-3" aria-hidden="true">
      <div className="h-px flex-1 bg-gray-200" />
      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-400">or</span>
      <div className="h-px flex-1 bg-gray-200" />
    </div>
  )
}
