import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { login } from '../../api/auth'
import useAuthStore from '../../store/authStore'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export default function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [showPass, setShowPass] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  })

  const mutation = useMutation({
    mutationFn: async (data) => {
      const res = await login(data)
      return { user: res.data.user, token: res.data.token }
    },
    onSuccess: ({ user, token }) => {
      setAuth(user, token)
      navigate('/feed', { replace: true })
    },
  })

  return (
    <div className="space-y-8">
      {/* Heading */}
      <div className="space-y-1.5">
        <h2 className="text-[28px] font-black text-gray-900 tracking-tight">Welcome back</h2>
        <p className="text-[15px] text-gray-500">Sign in to your account to continue</p>
      </div>

      {/* Form card */}
      <div className="bg-white rounded-2xl p-7 space-y-5" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04)' }}>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">

          {/* Email */}
          <div className="space-y-1.5">
            <label className="block text-[13px] font-semibold text-gray-700">Email address</label>
            <input
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              {...register('email')}
              className="w-full h-11 rounded-xl px-4 text-[15px] outline-none transition-all duration-200 bg-gray-50 border border-gray-200 placeholder:text-gray-400 text-gray-900 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
            {errors.email && <p className="text-[12px] text-red-500 font-medium">{errors.email.message}</p>}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="block text-[13px] font-semibold text-gray-700">Password</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="current-password"
                {...register('password')}
                className="w-full h-11 rounded-xl px-4 pr-11 text-[15px] outline-none transition-all duration-200 bg-gray-50 border border-gray-200 placeholder:text-gray-400 text-gray-900 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/15"
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                {showPass ? <EyeOff className="h-4.5 w-4.5" style={{ height: 18, width: 18 }} /> : <Eye className="h-4.5 w-4.5" style={{ height: 18, width: 18 }} />}
              </button>
            </div>
            {errors.password && <p className="text-[12px] text-red-500 font-medium">{errors.password.message}</p>}
          </div>

          {/* Server error */}
          {mutation.isError && (
            <div className="rounded-xl px-4 py-3 bg-red-50 border border-red-100">
              <p className="text-[13px] text-red-600 font-medium">
                {mutation.error?.response?.data?.message || 'Invalid email or password'}
              </p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={mutation.isPending}
            className="cursor-pointer w-full h-11 rounded-xl text-[15px] font-bold text-white transition-all duration-200 hover:opacity-90 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: 'oklch(0.46 0.15 143)', boxShadow: '0 4px 14px oklch(0.46 0.15 143 / 0.35)' }}
          >
            {mutation.isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Signing in…</>
            ) : 'Sign in'}
          </button>
        </form>
      </div>

      {/* Footer */}
      <p className="text-center text-[14px] text-gray-500">
        Don't have an account?{' '}
        <Link to="/register" className="font-bold text-primary hover:underline">
          Create one
        </Link>
      </p>
    </div>
  )
}
