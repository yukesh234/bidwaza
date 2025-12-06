import React from 'react'
import { BarChart3, Package, TrendingUp, MessageCircle, Settings } from "lucide-react"
import { Link, useLocation } from 'react-router-dom'

function SellerSidebar() {
  const location = useLocation()
  
  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3, path: '/seller/overview' },
    { id: 'listings', label: 'My Listings', icon: Package, path: '/seller/listings' },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp, path: '/seller/analytics' },
    // { id: 'messages', label: 'Messages', icon: MessageCircle, path: '/seller/messages' },
    { id: 'orders', label: 'Orders', icon: Package, path: '/seller/orders' },
    // { id: 'settings', label: 'Settings', icon: Settings, path: '/seller/settings' }
  ]

  return (
    <aside className='w-64 flex-shrink-0 space-y-2 sticky top-24 -ml-20 '>
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          to={tab.path}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
            location.pathname === tab.path
              ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/30 shadow-lg shadow-cyan-500/20'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <tab.icon className='w-5 h-5' />
          {tab.label}
        </Link>
      ))}
    </aside>
  )
}

export default SellerSidebar