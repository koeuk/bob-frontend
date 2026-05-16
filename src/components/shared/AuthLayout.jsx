import { Outlet, Link } from 'react-router-dom'

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex">
      {/* Left panel — brand */}
      <div
        className="hidden lg:flex lg:w-[52%] flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #0f52cc 0%, #1877F2 40%, #4facfe 80%, #a5d8ff 100%)' }}
      >
        {/* Decorative blobs */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full opacity-20" style={{ background: 'rgba(255,255,255,0.35)' }} />
        <div className="absolute bottom-0 right-0 w-[420px] h-[420px] rounded-full opacity-15" style={{ background: 'rgba(255,255,255,0.3)', transform: 'translate(30%, 30%)' }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full opacity-10" style={{ background: 'rgba(255,255,255,0.5)', transform: 'translate(-60%, -60%)' }} />

        {/* Logo */}
        <div className="relative z-10">
          <Link to="/feed" className="inline-flex h-11 w-11 items-center justify-center rounded-2xl text-white font-black text-[22px] leading-none" style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.3)' }}>
            b
          </Link>
        </div>

        {/* Hero text */}
        <div className="relative z-10 space-y-6">
          <div className="space-y-3">
            <h1 className="text-white text-[42px] font-black leading-tight tracking-tight">
              Connect with<br />people you<br />care about.
            </h1>
            <p className="text-white/75 text-[17px] leading-relaxed max-w-sm">
              Share moments, stay in touch, and discover what's happening around you.
            </p>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2">
            {['Share posts', 'React & comment', 'Make friends', 'Stay notified'].map((f) => (
              <span key={f} className="px-3 py-1.5 rounded-full text-[13px] font-semibold text-white/90" style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.25)' }}>
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom caption */}
        <p className="relative z-10 text-white/50 text-[13px]">© 2026 Bob · All rights reserved</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-[#f5f6fb]">
        {/* Mobile logo */}
        <div className="lg:hidden mb-8">
          <Link to="/feed" className="inline-flex h-12 w-12 items-center justify-center rounded-2xl text-white font-black text-[22px] leading-none" style={{ background: 'linear-gradient(135deg,#1877F2,#4facfe)', boxShadow: '0 4px 16px rgba(24,119,242,0.4)' }}>
            b
          </Link>
        </div>

        <div className="w-full max-w-[400px]">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
