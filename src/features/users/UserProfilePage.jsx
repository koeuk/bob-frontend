import { useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getUser } from '../../api/users'
import { sendFriendRequest, cancelFriendRequest, acceptFriendRequest } from '../../api/friends'
import { findOrCreateConversation } from '../../api/chat'
import { updateMe } from '../../api/auth'
import useAuthStore from '../../store/authStore'
import useThemeStore from '../../store/themeStore'
import useChatStore from '../../store/chatStore'
import PostCard from '../../components/shared/PostCard'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../components/ui/alert-dialog'
import { Loader2, UserPlus, UserCheck, Clock, Users, Images, FileText, Pencil, MessageCircle, Camera, UserMinus } from 'lucide-react'
import { formatDistanceToNow, assetUrl } from '../../lib/utils'
import { toast } from 'sonner'

function FriendButton({ friendship, profileUuid, profileName, queryKey }) {
  const { isAuthenticated } = useAuthStore()
  const queryClient = useQueryClient()
  const [unfriendOpen, setUnfriendOpen] = useState(false)

  const sendMut = useMutation({
    mutationFn: () => sendFriendRequest(profileUuid),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    onError: () => queryClient.invalidateQueries({ queryKey }),
  })
  const cancelMut = useMutation({
    mutationFn: () => cancelFriendRequest(friendship?.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  })
  const unfriendMut = useMutation({
    mutationFn: () => cancelFriendRequest(friendship?.id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey }); toast.success('Friend removed') },
    onError: () => toast.error('Failed to remove friend'),
  })
  const acceptMut = useMutation({
    mutationFn: () => acceptFriendRequest(friendship?.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  })

  if (!isAuthenticated) return null

  if (!friendship || friendship.status === 'declined') {
    return (
      <button
        onClick={() => sendMut.mutate()}
        disabled={sendMut.isPending}
        className="cursor-pointer flex items-center gap-2 px-5 py-2 rounded-full text-[14px] font-semibold text-white transition-all duration-200 hover:opacity-90 disabled:opacity-60"
        style={{ background: 'linear-gradient(135deg,#1877F2 0%,#4facfe 100%)', boxShadow: '0 2px 10px rgba(24,119,242,0.35)' }}
      >
        <UserPlus className="h-4 w-4" />
        Add Friend
      </button>
    )
  }

  if (friendship.status === 'accepted') {
    return (
      <>
        <button
          onClick={() => setUnfriendOpen(true)}
          disabled={unfriendMut.isPending}
          className="cursor-pointer flex items-center gap-2 px-5 py-2 rounded-full text-[14px] font-semibold text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-all duration-200 disabled:opacity-60"
        >
          <UserCheck className="h-4 w-4" />
          Friends
        </button>

        <AlertDialog open={unfriendOpen} onOpenChange={setUnfriendOpen}>
          <AlertDialogContent className="rounded-2xl max-w-sm">
            <AlertDialogHeader>
              <AlertDialogTitle>Remove friend?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove <span className="font-semibold text-gray-900 dark:text-gray-100">{profileName}</span> as a friend? You can always add them again later.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl cursor-pointer">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => unfriendMut.mutate()}
                className="rounded-xl cursor-pointer bg-red-500 hover:bg-red-600 text-white"
              >
                <UserMinus className="h-4 w-4 mr-1.5" />
                Unfriend
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    )
  }

  if (friendship.status === 'pending' && friendship.sent_by_me) {
    return (
      <button
        onClick={() => cancelMut.mutate()}
        disabled={cancelMut.isPending}
        className="cursor-pointer flex items-center gap-2 px-5 py-2 rounded-full text-[14px] font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 transition-all duration-200 disabled:opacity-60"
      >
        <Clock className="h-4 w-4" />
        Pending
      </button>
    )
  }

  if (friendship.status === 'pending' && !friendship.sent_by_me) {
    return (
      <button
        onClick={() => acceptMut.mutate()}
        disabled={acceptMut.isPending}
        className="cursor-pointer flex items-center gap-2 px-5 py-2 rounded-full text-[14px] font-semibold text-white transition-all duration-200 hover:opacity-90 disabled:opacity-60"
        style={{ background: 'linear-gradient(135deg,#1877F2 0%,#4facfe 100%)', boxShadow: '0 2px 10px rgba(24,119,242,0.35)' }}
      >
        <UserCheck className="h-4 w-4" />
        Accept
      </button>
    )
  }

  return null
}

function FriendCard({ friend }) {
  return (
    <Link
      to={`/users/${friend.uuid}`}
      className="flex flex-col items-center gap-2 p-3 rounded-2xl transition-all duration-200 hover:bg-gray-50 dark:hover:bg-white/5"
    >
      <div className="relative shrink-0">
        {friend.avatar ? (
          <img src={assetUrl(friend.avatar)} alt={friend.name} className="h-16 w-16 rounded-full object-cover" />
        ) : (
          <div
            className="h-16 w-16 rounded-full flex items-center justify-center text-white text-xl font-bold"
            style={{ background: 'linear-gradient(135deg,#1877F2 0%,#4facfe 100%)' }}
          >
            {friend.name?.[0]?.toUpperCase()}
          </div>
        )}
        {friend.is_online && (
          <span className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full bg-green-500 border-2 border-white dark:border-[#242526]" />
        )}
      </div>
      <p className="text-[13px] font-semibold text-center text-gray-900 dark:text-gray-100 leading-tight line-clamp-2">{friend.name}</p>
    </Link>
  )
}

const TABS = ['Posts', 'Photos', 'Friends']

export default function UserProfilePage() {
  const { uuid } = useParams()
  const { user: me, isAuthenticated, setUser } = useAuthStore()
  const { dark } = useThemeStore()
  const { openWith } = useChatStore()
  const queryKey = ['user-profile', uuid]
  const [tab, setTab] = useState('Posts')
  const coverInputRef = useRef(null)
  const queryClient = useQueryClient()

  const coverMutation = useMutation({
    mutationFn: (file) => updateMe({ cover: file }),
    onSuccess: (res) => {
      setUser(res.data)
      queryClient.invalidateQueries({ queryKey })
      toast.success('Cover photo updated!')
    },
    onError: () => toast.error('Failed to upload cover'),
  })

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => getUser(uuid).then((r) => r.data),
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-[#1877F2]" />
      </div>
    )
  }

  if (!data) return null

  const { user, posts, friends, friendship } = data
  const isMe = isAuthenticated && me?.uuid === uuid
  const imagePosts = posts.filter((p) => p.images?.length > 0 || p.image)

  const roleLabel = {
    super_admin: 'Super Admin',
    admin: 'Admin',
    moderator: 'Moderator',
    user: null,
  }[user.role]

  return (
    <div className="space-y-3">
      {/* Profile header card */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: dark ? '#242526' : 'white',
          boxShadow: dark ? '0 2px 12px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.08)',
        }}
      >
        {/* Cover banner */}
        <div className="relative h-36 w-full group">
          {user.cover ? (
            <img src={assetUrl(user.cover)} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full" style={{ background: 'linear-gradient(135deg,#1877F2 0%,#4facfe 60%,#a5d8ff 100%)' }} />
          )}
          {isMe && (
            <>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) coverMutation.mutate(file)
                  e.target.value = ''
                }}
              />
              <button
                onClick={() => coverInputRef.current?.click()}
                disabled={coverMutation.isPending}
                className="cursor-pointer absolute bottom-2 right-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white transition-all duration-200 hover:opacity-90 disabled:opacity-60"
                style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}
              >
                <Camera className="h-3.5 w-3.5" />
                {coverMutation.isPending ? 'Uploading…' : 'Edit cover'}
              </button>
            </>
          )}
        </div>

        {/* Avatar + info */}
        <div className="px-5 pb-5">
          <div className="flex items-end justify-between -mt-10 mb-3">
            <div className="relative shrink-0">
              {user.avatar ? (
                <img
                  src={assetUrl(user.avatar)}
                  alt={user.name}
                  className="h-24 w-24 rounded-full object-cover border-4"
                  style={{ borderColor: dark ? '#242526' : 'white' }}
                />
              ) : (
                <div
                  className="h-24 w-24 rounded-full flex items-center justify-center text-white text-3xl font-bold border-4"
                  style={{
                    background: 'linear-gradient(135deg,#1877F2 0%,#4facfe 100%)',
                    borderColor: dark ? '#242526' : 'white',
                  }}
                >
                  {user.name?.[0]?.toUpperCase()}
                </div>
              )}
              {user.is_online && (
                <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full bg-green-500 border-2 border-white dark:border-[#242526]" />
              )}
            </div>

            <div className="pb-1">
              {isMe ? (
                <Link
                  to="/account"
                  className="flex items-center gap-2 px-5 py-2 rounded-full text-[14px] font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 transition-all duration-200"
                >
                  <Pencil className="h-4 w-4" />
                  Edit Profile
                </Link>
              ) : (
                <div className="flex items-center gap-2">
                  <FriendButton friendship={friendship} profileUuid={uuid} profileName={user.name} queryKey={queryKey} />
                  {isAuthenticated && (
                    <button
                      onClick={async () => {
                        const res = await findOrCreateConversation(uuid)
                        openWith(res.data.uuid, user)
                      }}
                      className="flex items-center gap-2 px-4 py-2 rounded-full text-[14px] font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 transition-all duration-200 cursor-pointer"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Message
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <h1 className="text-[22px] font-bold text-gray-900 dark:text-gray-100 leading-tight">
            {user.name}
          </h1>

          <div className="flex items-center gap-3 mt-1 flex-wrap">
            {roleLabel && (
              <span
                className="text-[12px] font-semibold px-2.5 py-0.5 rounded-full"
                style={{ background: 'rgba(24,119,242,0.1)', color: '#1877F2' }}
              >
                {roleLabel}
              </span>
            )}
            <span className="text-[13px] text-gray-500 dark:text-gray-400">
              Joined {formatDistanceToNow(user.joined_at)}
            </span>
            <span className="text-[13px] text-gray-500 dark:text-gray-400">
              {friends.length} {friends.length === 1 ? 'friend' : 'friends'}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div
          className="flex border-t"
          style={{ borderColor: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}
        >
          {TABS.map((t) => {
            const active = tab === t
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 text-[14px] font-semibold transition-colors duration-200 border-b-2 cursor-pointer"
                style={{
                  borderColor: active ? '#1877F2' : 'transparent',
                  color: active ? '#1877F2' : dark ? '#9ca3af' : '#6b7280',
                }}
              >
                {t === 'Posts' && <FileText className="h-4 w-4" />}
                {t === 'Photos' && <Images className="h-4 w-4" />}
                {t === 'Friends' && <Users className="h-4 w-4" />}
                {t}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab content */}
      {tab === 'Posts' && (
        <div className="space-y-3">
          {posts.length === 0 ? (
            <div
              className="rounded-2xl p-10 text-center"
              style={{ background: dark ? '#242526' : 'white', boxShadow: dark ? '0 2px 12px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.08)' }}
            >
              <p className="text-gray-500 dark:text-gray-400 text-[15px]">No public posts yet.</p>
            </div>
          ) : (
            posts.map((post) => (
              <PostCard key={post.uuid} post={post} queryKey={['user-posts', uuid]} />
            ))
          )}
        </div>
      )}

      {tab === 'Photos' && (
        <div
          className="rounded-2xl p-4"
          style={{ background: dark ? '#242526' : 'white', boxShadow: dark ? '0 2px 12px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.08)' }}
        >
          {imagePosts.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-[15px] text-center py-6">No photos yet.</p>
          ) : (
            <div className="grid grid-cols-3 gap-1.5">
              {imagePosts.flatMap((post) => {
                const imgs = post.images?.length ? post.images : [post.image]
                return imgs.filter(Boolean).map((img, i) => (
                  <Link
                    key={`${post.uuid}-${i}`}
                    to={`/posts/${post.uuid}`}
                    className="aspect-square rounded-xl overflow-hidden block transition-all duration-200 hover:opacity-90 hover:scale-[0.98]"
                  >
                    <img
                      src={assetUrl(img)}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </Link>
                ))
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'Friends' && (
        <div
          className="rounded-2xl p-4"
          style={{ background: dark ? '#242526' : 'white', boxShadow: dark ? '0 2px 12px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.08)' }}
        >
          {friends.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-[15px] text-center py-6">No friends yet.</p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {friends.map((friend) => (
                <FriendCard key={friend.uuid} friend={friend} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
