import { useRef, useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { updateMe, updatePassword, deleteAccount, logout as logoutApi } from '../../api/auth'
import useAuthStore from '../../store/authStore'
import useThemeStore from '../../store/themeStore'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../components/ui/alert-dialog'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { Camera, User, Lock, ShieldAlert, CheckCircle2, Eye, Upload } from 'lucide-react'

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
})

const passwordSchema = z.object({
  current_password: z.string().min(1, 'Current password required'),
  password: z.string().min(8, 'At least 8 characters'),
  password_confirmation: z.string(),
}).refine((d) => d.password === d.password_confirmation, {
  message: 'Passwords do not match', path: ['password_confirmation'],
})

function Avatar({ user, size = 'lg' }) {
  const { dark } = useThemeStore()
  const sz = size === 'lg' ? 'h-24 w-24 text-3xl' : 'h-10 w-10 text-base'
  const ring = dark ? '#242526' : 'white'
  if (user?.avatar) {
    return (
      <img
        src={user.avatar}
        alt={user.name}
        className={`${sz} rounded-full object-cover`}
        style={{ boxShadow: `0 0 0 4px ${ring}, 0 2px 12px rgba(0,0,0,0.15)` }}
      />
    )
  }
  return (
    <div
      className={`${sz} rounded-full flex items-center justify-center text-white font-bold shrink-0`}
      style={{ background: 'linear-gradient(135deg, #1877F2 0%, #4facfe 100%)', boxShadow: `0 0 0 4px ${ring}, 0 2px 12px rgba(24,119,242,0.3)` }}
    >
      {user?.name?.[0]?.toUpperCase()}
    </div>
  )
}

const ROLE_COLORS = {
  admin: '#1877F2', super_admin: '#8B5CF6', moderator: '#10B981', user: '#6B7280',
}

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'security', label: 'Security', icon: Lock },
  { id: 'danger', label: 'Danger', icon: ShieldAlert },
]

export default function AccountPage() {
  const { user, setUser, logout } = useAuthStore()
  const { dark } = useThemeStore()
  const navigate = useNavigate()
  const [tab, setTab] = useState('profile')
  const avatarRef = useRef(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarMenu, setAvatarMenu] = useState(false)
  const [viewPhoto, setViewPhoto] = useState(false)

  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name ?? '', email: user?.email ?? '' },
  })

  const passwordForm = useForm({ resolver: zodResolver(passwordSchema) })

  const profileMutation = useMutation({
    mutationFn: (data) => updateMe(data),
    onSuccess: (res) => {
      setUser(res.data)
      setAvatarFile(null)
      setAvatarPreview(null)
      toast.success('Profile updated')
    },
    onError: () => toast.error('Failed to update profile'),
  })

  const passwordMutation = useMutation({
    mutationFn: (data) => updatePassword(data),
    onSuccess: () => { passwordForm.reset(); toast.success('Password changed') },
    onError: () => toast.error('Failed to change password'),
  })

  const deleteMutation = useMutation({
    mutationFn: async () => { await deleteAccount(); await logoutApi().catch(() => {}) },
    onSuccess: () => { logout(); navigate('/login', { replace: true }) },
  })

  useEffect(() => {
    if (!avatarMenu) return
    const handler = (e) => setAvatarMenu(false)
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [avatarMenu])

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const handleProfileSubmit = (data) => {
    profileMutation.mutate(avatarFile ? { ...data, avatar: avatarFile } : data)
  }

  const roleColor = ROLE_COLORS[user?.role] ?? '#6B7280'

  return (
    <div className="space-y-3">
      {/* Profile header card */}
      <div
        className="scale-in bg-white dark:bg-[#242526] rounded-2xl overflow-hidden"
        style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.07), 0 0 1px rgba(0,0,0,0.04)' }}
      >
        {/* Cover banner */}
        <div className="h-24 w-full" style={{ background: 'linear-gradient(135deg, #1877F2 0%, #4facfe 100%)' }} />

        <div className="px-5 pb-5">
          {/* Avatar row */}
          <div className="flex items-end justify-between -mt-12 mb-3">
            <div className="relative">
              {/* Avatar — click to open menu */}
              <button
                onClick={() => setAvatarMenu(v => !v)}
                className="cursor-pointer relative group block rounded-full"
              >
                {avatarPreview ? (
                  <img src={avatarPreview} alt="" className="h-24 w-24 rounded-full object-cover" style={{ boxShadow: `0 0 0 4px ${dark ? '#242526' : 'white'}, 0 2px 12px rgba(0,0,0,0.15)` }} />
                ) : (
                  <Avatar user={user} size="lg" />
                )}
                <span className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200" style={{ boxShadow: `0 0 0 4px ${dark ? '#242526' : 'white'}` }}>
                  <Camera className="h-6 w-6 text-white" />
                </span>
              </button>

              {/* Avatar menu */}
              {avatarMenu && (
                <div
                  className="absolute left-0 top-[calc(100%+8px)] z-50 bg-white dark:bg-[#3a3b3c] rounded-2xl shadow-xl border border-gray-100 dark:border-white/10 overflow-hidden w-48"
                  style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}
                >
                  <button
                    onClick={() => { setViewPhoto(true); setAvatarMenu(false) }}
                    className="cursor-pointer w-full flex items-center gap-3 px-4 py-3 text-[13px] font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
                  >
                    <Eye className="h-4 w-4 text-gray-400" />
                    View photo
                  </button>
                  <div className="h-px bg-gray-100 dark:bg-white/10" />
                  <button
                    onClick={() => { avatarRef.current.click(); setAvatarMenu(false) }}
                    className="cursor-pointer w-full flex items-center gap-3 px-4 py-3 text-[13px] font-medium text-[#1877F2] hover:bg-blue-50 transition-colors"
                  >
                    <Upload className="h-4 w-4" />
                    Upload photo
                  </button>
                </div>
              )}

              <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>

            {/* View photo lightbox */}
            {viewPhoto && (avatarPreview || user?.avatar) && (
              <div
                className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center"
                onClick={() => setViewPhoto(false)}
              >
                <img
                  src={avatarPreview || user.avatar}
                  alt=""
                  className="max-h-[80vh] max-w-[80vw] rounded-2xl object-contain shadow-2xl"
                  onClick={e => e.stopPropagation()}
                />
              </div>
            )}

            {/* Role badge */}
            <div
              className="px-3 py-1 rounded-full text-[12px] font-semibold capitalize"
              style={{ background: `${roleColor}15`, color: roleColor, border: `1px solid ${roleColor}30` }}
            >
              {user?.role}
            </div>
          </div>

          <div>
            <h2 className="text-[20px] font-bold text-gray-900 dark:text-gray-100 leading-tight">{user?.name}</h2>
            <p className="text-[14px] text-gray-400">{user?.email}</p>
          </div>

          {avatarFile && (
            <div className="mt-3 flex items-center gap-2 text-[13px] text-[#1877F2] bg-blue-50 rounded-xl px-3 py-2">
              <Camera className="h-4 w-4 shrink-0" />
              <span>New photo selected — save profile to apply</span>
            </div>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div
        className="scale-in bg-white dark:bg-[#242526] rounded-2xl flex overflow-hidden"
        style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.07), 0 0 1px rgba(0,0,0,0.04)' }}
      >
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`cursor-pointer flex-1 flex items-center justify-center gap-2 py-3 text-[14px] font-semibold transition-all duration-200 border-b-2 ${
              tab === id
                ? id === 'danger'
                  ? 'border-red-500 text-red-500 bg-red-50/50'
                  : 'border-[#1877F2] text-[#1877F2] bg-blue-50/50'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/10'
            }`}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Profile tab */}
      {tab === 'profile' && (
        <div
          className="scale-in bg-white dark:bg-[#242526] rounded-2xl p-5"
          style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.07), 0 0 1px rgba(0,0,0,0.04)' }}
        >
          <p className="font-semibold text-[15px] text-gray-900 dark:text-gray-100 mb-4">Profile information</p>
          <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[13px] font-semibold text-gray-600 dark:text-gray-400">Display name</Label>
              <Input
                {...profileForm.register('name')}
                className="rounded-xl h-10 bg-gray-50 dark:bg-white/10 border-gray-200 dark:border-white/10 focus:border-[#1877F2] focus:ring-[#1877F2]/20 dark:text-gray-200"
              />
              {profileForm.formState.errors.name && (
                <p className="text-[12px] text-red-500">{profileForm.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px] font-semibold text-gray-600 dark:text-gray-400">Email address</Label>
              <Input
                type="email"
                {...profileForm.register('email')}
                className="rounded-xl h-10 bg-gray-50 dark:bg-white/10 border-gray-200 dark:border-white/10 focus:border-[#1877F2] focus:ring-[#1877F2]/20 dark:text-gray-200"
              />
              {profileForm.formState.errors.email && (
                <p className="text-[12px] text-red-500">{profileForm.formState.errors.email.message}</p>
              )}
            </div>
            <Button
              type="submit"
              disabled={profileMutation.isPending}
              className="cursor-pointer w-full rounded-xl h-10 font-semibold transition-all duration-200"
              style={{ background: 'linear-gradient(135deg, #1877F2 0%, #4facfe 100%)', boxShadow: '0 4px 14px rgba(24,119,242,0.3)' }}
            >
              {profileMutation.isPending ? 'Saving…' : (
                <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" />Save changes</span>
              )}
            </Button>
          </form>
        </div>
      )}

      {/* Security tab */}
      {tab === 'security' && (
        <div
          className="scale-in bg-white dark:bg-[#242526] rounded-2xl p-5"
          style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.07), 0 0 1px rgba(0,0,0,0.04)' }}
        >
          <p className="font-semibold text-[15px] text-gray-900 dark:text-gray-100 mb-4">Change password</p>
          <form onSubmit={passwordForm.handleSubmit((d) => passwordMutation.mutate(d))} className="space-y-4">
            {[
              { name: 'current_password', label: 'Current password' },
              { name: 'password', label: 'New password' },
              { name: 'password_confirmation', label: 'Confirm new password' },
            ].map(({ name, label }) => (
              <div key={name} className="space-y-1.5">
                <Label className="text-[13px] font-semibold text-gray-600 dark:text-gray-400">{label}</Label>
                <Input
                  type="password"
                  {...passwordForm.register(name)}
                  className="rounded-xl h-10 bg-gray-50 dark:bg-white/10 border-gray-200 dark:border-white/10 focus:border-[#1877F2] focus:ring-[#1877F2]/20 dark:text-gray-200"
                />
                {passwordForm.formState.errors[name] && (
                  <p className="text-[12px] text-red-500">{passwordForm.formState.errors[name].message}</p>
                )}
              </div>
            ))}
            <Button
              type="submit"
              disabled={passwordMutation.isPending}
              className="cursor-pointer w-full rounded-xl h-10 font-semibold"
              style={{ background: 'linear-gradient(135deg, #1877F2 0%, #4facfe 100%)', boxShadow: '0 4px 14px rgba(24,119,242,0.3)' }}
            >
              {passwordMutation.isPending ? 'Changing…' : 'Change password'}
            </Button>
          </form>
        </div>
      )}

      {/* Danger tab */}
      {tab === 'danger' && (
        <div
          className="scale-in bg-white dark:bg-[#242526] rounded-2xl p-5"
          style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.07), 0 0 1px rgba(0,0,0,0.04)', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          <p className="font-semibold text-[15px] text-red-600 mb-1">Delete account</p>
          <p className="text-[13px] text-gray-500 mb-5">
            Permanently deletes your account, posts, and all data. This cannot be undone.
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="cursor-pointer w-full rounded-xl h-10 font-semibold">
                Delete my account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete your account and all your data. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteMutation.mutate()}
                  className="rounded-xl bg-destructive hover:bg-destructive/90"
                >
                  Delete account
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  )
}
