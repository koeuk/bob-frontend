import { useRef, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
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
import { assetUrl } from '../../lib/utils'
import { useNavigate, Link } from 'react-router-dom'
import { Camera, User, Lock, ShieldAlert, CheckCircle2, Eye, Upload, X, ArrowLeft } from 'lucide-react'

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
        src={assetUrl(user.avatar)}
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
  const avatarBtnRef = useRef(null)
  const avatarMenuRef = useRef(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarMenu, setAvatarMenu] = useState(false)
  const [avatarMenuPos, setAvatarMenuPos] = useState({ top: 0, left: 0 })
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
    const handler = (e) => {
      if (
        avatarMenuRef.current && !avatarMenuRef.current.contains(e.target) &&
        avatarBtnRef.current && !avatarBtnRef.current.contains(e.target)
      ) setAvatarMenu(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [avatarMenu])

  const handleAvatarBtnClick = () => {
    if (!avatarMenu && avatarBtnRef.current) {
      const rect = avatarBtnRef.current.getBoundingClientRect()
      setAvatarMenuPos({ top: rect.bottom + 8, left: rect.left })
    }
    setAvatarMenu(v => !v)
  }

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
  const roleLabel = { super_admin: 'Super Admin', admin: 'Admin', moderator: 'Moderator', user: null }[user?.role]
  const cardStyle = {
    background: dark ? '#242526' : 'white',
    boxShadow: dark ? '0 2px 12px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.08)',
  }
  const contentStyle = {
    background: dark ? '#242526' : 'white',
    boxShadow: dark ? '0 2px 12px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.08)',
  }

  return (
    <div className="space-y-3">
      {/* Profile header card — same layout as UserProfilePage */}
      <div className="rounded-2xl overflow-hidden" style={cardStyle}>

        {/* Cover */}
        <div className="h-36 w-full" style={{ background: 'linear-gradient(135deg,#1877F2 0%,#4facfe 60%,#a5d8ff 100%)' }} />

        {/* Avatar + actions row */}
        <div className="px-5 pb-5">
          <div className="flex items-end justify-between -mt-10 mb-3">

            {/* Avatar with camera overlay */}
            <div className="relative shrink-0">
              <button ref={avatarBtnRef} onClick={handleAvatarBtnClick} className="cursor-pointer relative group block rounded-full">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="" className="h-24 w-24 rounded-full object-cover border-4" style={{ borderColor: dark ? '#242526' : 'white' }} />
                ) : user?.avatar ? (
                  <img src={assetUrl(user.avatar)} alt={user.name} className="h-24 w-24 rounded-full object-cover border-4" style={{ borderColor: dark ? '#242526' : 'white' }} />
                ) : (
                  <div className="h-24 w-24 rounded-full flex items-center justify-center text-white text-3xl font-bold border-4" style={{ background: 'linear-gradient(135deg,#1877F2 0%,#4facfe 100%)', borderColor: dark ? '#242526' : 'white' }}>
                    {user?.name?.[0]?.toUpperCase()}
                  </div>
                )}
                <span className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <Camera className="h-6 w-6 text-white" />
                </span>
                <span className="absolute bottom-1 right-1 h-5 w-5 rounded-full border-[3px] pointer-events-none" style={{ background: '#22c55e', borderColor: dark ? '#242526' : 'white' }} />
              </button>

              {/* Avatar menu */}
              {avatarMenu && createPortal(
                <div ref={avatarMenuRef} className="scale-in fixed z-[9999] rounded-2xl overflow-hidden w-48"
                  style={{ top: avatarMenuPos.top, left: avatarMenuPos.left, background: dark ? '#3a3b3c' : 'white', boxShadow: dark ? '0 8px 30px rgba(0,0,0,0.4)' : '0 8px 30px rgba(0,0,0,0.12)', border: `1px solid ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'}` }}
                >
                  <button onClick={() => { setViewPhoto(true); setAvatarMenu(false) }}
                    onMouseEnter={e => e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    className="cursor-pointer w-full flex items-center gap-3 px-4 py-3 text-[13px] font-medium transition-colors"
                    style={{ color: dark ? '#e4e6eb' : '#374151' }}
                  >
                    <Eye className="h-4 w-4 text-gray-400" /> View photo
                  </button>
                  <div style={{ height: 1, background: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }} />
                  <button onClick={() => { avatarRef.current.click(); setAvatarMenu(false) }}
                    onMouseEnter={e => e.currentTarget.style.background = dark ? 'rgba(24,119,242,0.15)' : 'rgba(24,119,242,0.06)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    className="cursor-pointer w-full flex items-center gap-3 px-4 py-3 text-[13px] font-medium text-[#1877F2] transition-colors"
                  >
                    <Upload className="h-4 w-4" /> Upload photo
                  </button>
                </div>,
                document.body
              )}
              <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>

            {/* Right side: role badge + View Profile button */}
            <div className="pb-1 flex flex-col items-end gap-2">
              {roleLabel && (
                <div className="px-3 py-1 rounded-full text-[12px] font-semibold" style={{ background: `${roleColor}15`, color: roleColor, border: `1px solid ${roleColor}30` }}>
                  {roleLabel}
                </div>
              )}
              <Link
                to={`/users/${user?.uuid}`}
                className="flex items-center gap-2 px-4 py-1.5 rounded-full text-[13px] font-semibold transition-all duration-200 hover:opacity-90"
                style={{ background: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)', color: dark ? '#e4e6eb' : '#374151' }}
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                View Profile
              </Link>
            </div>
          </div>

          {/* View photo lightbox */}
          {viewPhoto && (avatarPreview || user?.avatar) && createPortal(
            <div className="fixed inset-0 z-[9999] bg-black/85 flex items-center justify-center" onClick={() => setViewPhoto(false)}>
              <button onClick={() => setViewPhoto(false)} className="cursor-pointer absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors duration-200">
                <X className="h-5 w-5 text-white" />
              </button>
              <img src={avatarPreview || assetUrl(user.avatar)} alt="" className="rounded-2xl shadow-2xl object-contain" style={{ width: 'min(500px, 90vw)', height: 'min(500px, 90vh)' }} onClick={e => e.stopPropagation()} />
            </div>,
            document.body
          )}

          <h1 className="text-[22px] font-bold text-gray-900 dark:text-gray-100 leading-tight">{user?.name}</h1>
          <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5">{user?.email}</p>

          {avatarFile && (
            <div className="mt-3 flex items-center gap-2 text-[13px] text-[#1877F2] bg-blue-50 dark:bg-blue-900/20 rounded-xl px-3 py-2">
              <Camera className="h-4 w-4 shrink-0" />
              <span>New photo selected — save profile to apply</span>
            </div>
          )}
        </div>

        {/* Tabs inside the header card */}
        <div className="flex border-t" style={{ borderColor: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}>
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = tab === id
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 text-[14px] font-semibold transition-colors duration-200 border-b-2 cursor-pointer"
                style={{
                  borderColor: active ? (id === 'danger' ? '#ef4444' : '#1877F2') : 'transparent',
                  color: active ? (id === 'danger' ? '#ef4444' : '#1877F2') : dark ? '#9ca3af' : '#6b7280',
                }}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab content */}
      {tab === 'profile' && (
        <div className="rounded-2xl p-5" style={contentStyle}>
          <p className="font-semibold text-[15px] text-gray-900 dark:text-gray-100 mb-4">Profile information</p>
          <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[13px] font-semibold text-gray-600 dark:text-gray-400">Display name</Label>
              <Input {...profileForm.register('name')} className="rounded-xl h-10 bg-gray-50 dark:bg-white/10 border-gray-200 dark:border-white/10 focus:border-[#1877F2] focus:ring-[#1877F2]/20 dark:text-gray-200" />
              {profileForm.formState.errors.name && <p className="text-[12px] text-red-500">{profileForm.formState.errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px] font-semibold text-gray-600 dark:text-gray-400">Email address</Label>
              <Input type="email" {...profileForm.register('email')} className="rounded-xl h-10 bg-gray-50 dark:bg-white/10 border-gray-200 dark:border-white/10 focus:border-[#1877F2] focus:ring-[#1877F2]/20 dark:text-gray-200" />
              {profileForm.formState.errors.email && <p className="text-[12px] text-red-500">{profileForm.formState.errors.email.message}</p>}
            </div>
            <Button type="submit" disabled={profileMutation.isPending} className="cursor-pointer w-full rounded-xl h-10 font-semibold" style={{ background: 'linear-gradient(135deg,#1877F2 0%,#4facfe 100%)', boxShadow: '0 4px 14px rgba(24,119,242,0.3)' }}>
              {profileMutation.isPending ? 'Saving…' : <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" />Save changes</span>}
            </Button>
          </form>
        </div>
      )}

      {tab === 'security' && (
        <div className="rounded-2xl p-5" style={contentStyle}>
          <p className="font-semibold text-[15px] text-gray-900 dark:text-gray-100 mb-4">Change password</p>
          <form onSubmit={passwordForm.handleSubmit((d) => passwordMutation.mutate(d))} className="space-y-4">
            {[
              { name: 'current_password', label: 'Current password' },
              { name: 'password', label: 'New password' },
              { name: 'password_confirmation', label: 'Confirm new password' },
            ].map(({ name, label }) => (
              <div key={name} className="space-y-1.5">
                <Label className="text-[13px] font-semibold text-gray-600 dark:text-gray-400">{label}</Label>
                <Input type="password" {...passwordForm.register(name)} className="rounded-xl h-10 bg-gray-50 dark:bg-white/10 border-gray-200 dark:border-white/10 focus:border-[#1877F2] focus:ring-[#1877F2]/20 dark:text-gray-200" />
                {passwordForm.formState.errors[name] && <p className="text-[12px] text-red-500">{passwordForm.formState.errors[name].message}</p>}
              </div>
            ))}
            <Button type="submit" disabled={passwordMutation.isPending} className="cursor-pointer w-full rounded-xl h-10 font-semibold" style={{ background: 'linear-gradient(135deg,#1877F2 0%,#4facfe 100%)', boxShadow: '0 4px 14px rgba(24,119,242,0.3)' }}>
              {passwordMutation.isPending ? 'Changing…' : 'Change password'}
            </Button>
          </form>
        </div>
      )}

      {tab === 'danger' && (
        <div className="rounded-2xl p-5" style={{ ...contentStyle, border: '1px solid rgba(239,68,68,0.2)' }}>
          <p className="font-semibold text-[15px] text-red-600 mb-1">Delete account</p>
          <p className="text-[13px] text-gray-500 dark:text-gray-400 mb-5">Permanently deletes your account, posts, and all data. This cannot be undone.</p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="cursor-pointer w-full rounded-xl h-10 font-semibold">Delete my account</Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                <AlertDialogDescription>This will permanently delete your account and all your data. This cannot be undone.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => deleteMutation.mutate()} className="rounded-xl bg-destructive hover:bg-destructive/90">Delete account</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  )
}
