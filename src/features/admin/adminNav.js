import {
  LayoutDashboard, Users, FileText, MessageSquare, Flag,
  Ban, Heart, Files, Settings, ScrollText,
} from 'lucide-react'

// Single source of truth for admin sections — consumed by AdminLayout (sidebar)
// and the router (route registration). `end` marks an exact-match nav item.
export const ADMIN_NAV = [
  { to: '/admin',          label: 'Dashboard',     icon: LayoutDashboard, end: true },
  { to: '/admin/users',    label: 'Users',         icon: Users },
  { to: '/admin/posts',    label: 'Posts',         icon: FileText },
  { to: '/admin/comments', label: 'Comments',      icon: MessageSquare },
  { to: '/admin/reports',  label: 'Reports',       icon: Flag },
  { to: '/admin/bans',     label: 'Bans',          icon: Ban },
  { to: '/admin/likes',    label: 'Likes',         icon: Heart },
  { to: '/admin/pages',    label: 'Pages',         icon: Files },
  { to: '/admin/settings', label: 'Settings',      icon: Settings },
  { to: '/admin/activity', label: 'Activity Logs', icon: ScrollText },
]

export const ROLE_LABELS = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  moderator: 'Moderator',
}
