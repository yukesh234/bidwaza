import React from 'react'
import { motion } from "framer-motion"
import { DollarSign, Package, TrendingUp, Star } from "lucide-react"
import {StatsCard} from '../../Components/seller/StatsCard'
import RecentActivity from '../../Components/seller/RecentActivity'
import PerformanceMetrics from '../../Components/seller/PerformanceMetrics'
import Analytics from '../../Components/seller/Analytics'


function Overview({ sellerStats }) {
  const statsCards = [
    { 
      label: 'Total Earnings', 
      value: `रु${sellerStats?.totalEarnings?.toLocaleString() || 0}`, 
      icon: DollarSign, 
      color: 'from-green-500 to-emerald-500' 
    },
    { 
      label: 'Active Listings', 
      value: sellerStats?.activeAuctions || 0, 
      icon: Package, 
      color: 'from-blue-500 to-cyan-500' 
    },
    { 
      label: 'Items Sold', 
      value: sellerStats?.soldItems || 0, 
      icon: TrendingUp, 
      color: 'from-purple-500 to-pink-500' 
    },
    { 
      label: 'Seller Rating', 
      value: `${sellerStats?.rating?.average || 0}/5`, 
      icon: Star, 
      color: 'from-yellow-500 to-orange-500' 
    }
  ];

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
         {/* <RecentActivity activities={recentActivity} /> */}
        <Analytics/>
        <PerformanceMetrics stats={sellerStats} />
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
          <h3 className="text-xl font-bold text-white mb-4">Quick Stats</h3>
          <div className="space-y-4 text-white/80">
            <p>Total Listings: <span className="text-white font-semibold">{sellerStats?.totalListings || 0}</span></p>
            <p>Average Rating: <span className="text-yellow-400 font-semibold">{sellerStats?.rating?.average || 0}/5</span></p>
            <p>Total Reviews: <span className="text-white font-semibold">{sellerStats?.rating?.count || 0}</span></p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default Overview;
