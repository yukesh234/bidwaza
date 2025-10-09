import React from 'react'
import { motion } from "framer-motion"
import { DollarSign, Package, TrendingUp, Star } from "lucide-react"
import StatsCard from '../../Components/seller/StatsCard'
import RecentActivity from '../../Components/seller/RecentActivity'
import PerformanceMetrics from '../../Components/seller/PerformanceMetrics'

function Overview({ sellerStats, recentActivity }) {
  const statsCards = [
    { 
      label: 'Total Earnings', 
      value: `$${sellerStats?.totalEarnings.toLocaleString()}`, 
      icon: DollarSign, 
      color: 'from-green-500 to-emerald-500' 
    },
    { 
      label: 'Active Listings', 
      value: sellerStats?.activeAuctions, 
      icon: Package, 
      color: 'from-blue-500 to-cyan-500' 
    },
    { 
      label: 'Items Sold', 
      value: sellerStats?.soldItems, 
      icon: TrendingUp, 
      color: 'from-purple-500 to-pink-500' 
    },
    { 
      label: 'Seller Rating', 
      value: `${sellerStats?.rating}/5`, 
      icon: Star, 
      color: 'from-yellow-500 to-orange-500' 
    }
  ]

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      <div className="grid grid-cols-4 gap-6">
        {statsCards.map((stat) => (
          <StatsCard key={stat.label} stat={stat} />
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <RecentActivity activities={recentActivity} />
        <PerformanceMetrics stats={sellerStats} />
      </div>
    </motion.div>
  )
}

export default Overview