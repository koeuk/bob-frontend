import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getMe } from '../../api/auth'
import useAuthStore from '../../store/authStore'

export default function GoogleCallbackPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)
  const [error, setError] = useState('')

  useEffect(() => {
    const finishGoogleAuth = async () => {
      const params = new URLSearchParams(window.location.search)
      const token = params.get('token')
      const authError = params.get('error')

      if (authError || !token) {
        setError(authError || 'Google sign-in did not return an access token.')
        return
      }

      try {
        localStorage.setItem('token', token)
        const response = await getMe()
        setAuth(response.data.user ?? response.data, token)
        navigate('/feed', { replace: true })
      } catch (requestError) {
        localStorage.removeItem('token')
        setError(requestError.response?.data?.message || 'Could not complete Google sign-in.')
      }
    }

    finishGoogleAuth()
  }, [navigate, setAuth])

  return (
    <div className="rounded-2xl bg-white p-8 text-center shadow-[0_4px_24px_rgba(0,0,0,0.07)]">
      {error ? (
        <div className="space-y-4">
          <h2 className="text-xl font-black text-gray-900">Sign-in unsuccessful</h2>
          <p className="text-sm text-red-600">{error}</p>
          <button onClick={() => navigate('/login', { replace: true })} className="cursor-pointer text-sm font-bold text-primary hover:underline">
            Back to sign in
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
          <div>
            <h2 className="text-xl font-black text-gray-900">Connecting your account</h2>
            <p className="mt-1 text-sm text-gray-500">Finishing your Google sign-in…</p>
          </div>
        </div>
      )}
    </div>
  )
}
