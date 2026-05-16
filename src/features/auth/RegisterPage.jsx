import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { register as registerApi } from '../../api/auth'
import useAuthStore from '../../store/authStore'
import { Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react'

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'At least 8 characters'),
  password_confirmation: z.string(),
}).refine((d) => d.password === d.password_confirmation, {
  message: 'Passwords do not match',
  path: ['password_confirmation'],
})

function Field({ label, error, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[13px] font-semibold text-gray-700">{label}</label>
      {children}
      {error && <p className="text-[12px] text-red-500 font-medium">{error}</p>}
    </div>
  )
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  })

  const password = watch('password', '')
  const strength = !password ? 0 : password.length < 8 ? 1 : password.length < 12 ? 2 : 3
  const strengthLabel = ['', 'Weak', 'Good', 'Strong'][strength]
  const strengthColor = ['', '#ef4444', '#f59e0b', '#22c55e'][strength]

  const mutation = useMutation({
    mutationFn: async (data) => {
      const res = await registerApi(data)
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
        <h2 className="text-[28px] font-black text-gray-900 tracking-tight">Create account</h2>
        <p className="text-[15px] text-gray-500">Join the community — it's free</p>
      </div>

      {/* Form card */}
      <div className="bg-white rounded-2xl p-7 space-y-5" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04)' }}>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">

          {/* Name */}
          <Field label="Display name" error={errors.name?.message}>
            <input
              placeholder="Your name"
              autoComplete="name"
              {...register('name')}
              className="w-full h-11 rounded-xl px-4 text-[15px] outline-none transition-all duration-200 bg-gray-50 border border-gray-200 placeholder:text-gray-400 text-gray-900 focus:bg-white focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/15"
            />
          </Field>

          {/* Email */}
          <Field label="Email address" error={errors.email?.message}>
            <input
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              {...register('email')}
              className="w-full h-11 rounded-xl px-4 text-[15px] outline-none transition-all duration-200 bg-gray-50 border border-gray-200 placeholder:text-gray-400 text-gray-900 focus:bg-white focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/15"
            />
          </Field>

          {/* Password */}
          <Field label="Password" error={errors.password?.message}>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="Min. 8 characters"
                autoComplete="new-password"
                {...register('password')}
                className="w-full h-11 rounded-xl px-4 pr-11 text-[15px] outline-none transition-all duration-200 bg-gray-50 border border-gray-200 placeholder:text-gray-400 text-gray-900 focus:bg-white focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/15"
              />
              <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
                {showPass ? <EyeOff style={{ height: 18, width: 18 }} /> : <Eye style={{ height: 18, width: 18 }} />}
              </button>
            </div>
            {/* Strength bar */}
            {password.length > 0 && (
              <div className="mt-2 space-y-1">
                <div className="flex gap-1">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="flex-1 h-1 rounded-full transition-all duration-300"
                      style={{ background: i <= strength ? strengthColor : '#e5e7eb' }}
                    />
                  ))}
                </div>
                <p className="text-[11px] font-semibold" style={{ color: strengthColor }}>{strengthLabel}</p>
              </div>
            )}
          </Field>

          {/* Confirm password */}
          <Field label="Confirm password" error={errors.password_confirmation?.message}>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="new-password"
                {...register('password_confirmation')}
                className="w-full h-11 rounded-xl px-4 pr-11 text-[15px] outline-none transition-all duration-200 bg-gray-50 border border-gray-200 placeholder:text-gray-400 text-gray-900 focus:bg-white focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/15"
              />
              <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
                {showConfirm ? <EyeOff style={{ height: 18, width: 18 }} /> : <Eye style={{ height: 18, width: 18 }} />}
              </button>
            </div>
          </Field>

          {/* Server error */}
          {mutation.isError && (
            <div className="rounded-xl px-4 py-3 bg-red-50 border border-red-100">
              <p className="text-[13px] text-red-600 font-medium">
                {mutation.error?.response?.data?.message || 'Registration failed. Please try again.'}
              </p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={mutation.isPending}
            className="cursor-pointer w-full h-11 rounded-xl text-[15px] font-bold text-white transition-all duration-200 hover:opacity-90 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg,#1877F2 0%,#4facfe 100%)', boxShadow: '0 4px 14px rgba(24,119,242,0.35)' }}
          >
            {mutation.isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Creating account…</>
            ) : (
              <><CheckCircle2 className="h-4 w-4" /> Create account</>
            )}
          </button>
        </form>
      </div>

      {/* Footer */}
      <p className="text-center text-[14px] text-gray-500">
        Already have an account?{' '}
        <Link to="/login" className="font-bold text-[#1877F2] hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
