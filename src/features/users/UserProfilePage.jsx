import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getUser } from '../../api/users'
import { sendFriendRequest, cancelFriendRequest, acceptFriendRequest } from '../../api/friends'
import useAuthStore from '../../store/authStore'
import useThemeStore from '../../store/themeStore'
import PostCard from '../../components/shared/PostCard'
import { Loader2, UserPlus, UserCheck, Clock, Users, Images, FileText } from 'lucide-react'
import { formatDistanceToNow, assetUrl } from '../../lib/utils'

function FriendButton({ friendship, profileUuid, queryKey }) {
  const { isAuthenticated } = useAuthStore()
  const queryClient = useQueryClient()

  const sendMut = useMutation({
    mutationFn: () => sendFriendRequest(profileUuid),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    onError: () => queryClient.invalidateQueries({ queryKey }),
  })
  const cancelMut = useMutation({
    mutationFn: () => cancelFriendRequest(friendship?.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
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
      <div className="flex items-center gap-2 px-5 py-2 rounded-full text-[14px] font-semibold text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400">
        <UserCheck className="h-4 w-4" />
        Friends
      </div>
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
      {friend.avatar ? (
        <img src={friend.avatar} alt={friend.name} className="h-16 w-16 rounded-full object-cover" />
      ) : (
        <div
          className="h-16 w-16 rounded-full flex items-center justify-center text-white text-xl font-bold"
          style={{ background: 'linear-gradient(135deg,#1877F2 0%,#4facfe 100%)' }}
        >
          {friend.name?.[0]?.toUpperCase()}
        </div>
      )}
      <p className="text-[13px] font-semibold text-center text-gray-900 dark:text-gray-100 leading-tight line-clamp-2">{friend.name}</p>
    </Link>
  )
}

const TABS = ['Posts', 'Photos', 'Friends']

export default function UserProfilePage() {
  const { uuid } = useParams()
  const { user: me, isAuthenticated } = useAuthStore()
  const { dark } = useThemeStore()
  const queryKey = ['user-profile', uuid]
  const [tab, setTab] = useState('Posts')

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
        <div
          className="h-36 w-full"
          style={{ background: 'linear-gradient(135deg,#1877F2 0%,#4facfe 60%,#a5d8ff 100%)' }}
        />

        {/* Avatar + info */}
        <div className="px-5 pb-5">
          <div className="flex items-end justify-between -mt-10 mb-3">
            <div className="relative shrink-0">
              {user.avatar ? (
                <img
                  src={user.avatar}
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
            </div>

            <div className="pb-1">
              {!isMe && (
                <FriendButton friendship={friendship} profileUuid={uuid} queryKey={queryKey} />
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
