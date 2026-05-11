import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { updateMe, updatePassword, deleteAccount, logout as logoutApi } from '../../api/auth'
import useAuthStore from '../../store/authStore'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Card, CardContent } from '../../components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../components/ui/alert-dialog'
import { Badge } from '../../components/ui/badge'
import { Separator } from '../../components/ui/separator'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { User, Lock, ShieldAlert } from 'lucide-react'

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

export default function AccountPage() {
  const { user, setUser, logout } = useAuthStore()
  const navigate = useNavigate()

  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name ?? '', email: user?.email ?? '' },
  })

  const passwordForm = useForm({ resolver: zodResolver(passwordSchema) })

  const profileMutation = useMutation({
    mutationFn: (data) => updateMe(data),
    onSuccess: (res) => { setUser(res.data); toast.success('Profile updated') },
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-lg font-bold shrink-0">
          {user?.name?.[0]?.toUpperCase()}
        </div>
        <div>
          <p className="font-semibold">{user?.name}</p>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>
        <Badge variant="secondary" className="ml-auto capitalize">{user?.role}</Badge>
      </div>

      <Separator />

      <Tabs defaultValue="profile">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile" className="gap-1.5">
            <User className="h-4 w-4" /><span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-1.5">
            <Lock className="h-4 w-4" /><span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="danger" className="gap-1.5">
            <ShieldAlert className="h-4 w-4" /><span className="hidden sm:inline">Danger</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={profileForm.handleSubmit((d) => profileMutation.mutate(d))} className="space-y-4">
                <div className="space-y-1">
                  <Label>Display name</Label>
                  <Input {...profileForm.register('name')} />
                  {profileForm.formState.errors.name && <p className="text-sm text-destructive">{profileForm.formState.errors.name.message}</p>}
                </div>
                <div className="space-y-1">
                  <Label>Email address</Label>
                  <Input type="email" {...profileForm.register('email')} />
                  {profileForm.formState.errors.email && <p className="text-sm text-destructive">{profileForm.formState.errors.email.message}</p>}
                </div>
                <Button type="submit" disabled={profileMutation.isPending}>
                  {profileMutation.isPending ? 'Saving…' : 'Save changes'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={passwordForm.handleSubmit((d) => passwordMutation.mutate(d))} className="space-y-4">
                <div className="space-y-1">
                  <Label>Current password</Label>
                  <Input type="password" {...passwordForm.register('current_password')} />
                  {passwordForm.formState.errors.current_password && <p className="text-sm text-destructive">{passwordForm.formState.errors.current_password.message}</p>}
                </div>
                <div className="space-y-1">
                  <Label>New password</Label>
                  <Input type="password" {...passwordForm.register('password')} />
                  {passwordForm.formState.errors.password && <p className="text-sm text-destructive">{passwordForm.formState.errors.password.message}</p>}
                </div>
                <div className="space-y-1">
                  <Label>Confirm new password</Label>
                  <Input type="password" {...passwordForm.register('password_confirmation')} />
                  {passwordForm.formState.errors.password_confirmation && <p className="text-sm text-destructive">{passwordForm.formState.errors.password_confirmation.message}</p>}
                </div>
                <Button type="submit" disabled={passwordMutation.isPending}>
                  {passwordMutation.isPending ? 'Changing…' : 'Change password'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="danger">
          <Card className="border-destructive/50">
            <CardContent className="pt-6 space-y-4">
              <div>
                <p className="font-medium">Delete account</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Permanently delete your account and all your posts, comments, and data. This cannot be undone.
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">Delete my account</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete your account and all your data. This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deleteMutation.mutate()} className="bg-destructive hover:bg-destructive/90">
                      Delete account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
