import React from 'react'
import { Star } from "lucide-react"

function PerformanceMetrics({ stats }) {
  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
      <h3 className="text-xl font-bold text-white mb-6">Performance</h3>
      <div className="space-y-6">
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-white/80">Success Rate</span>
            <span className="text-green-400 font-semibold">{stats?.successRate}%</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all" style={{ width: `${stats?.successRate}%` }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-white/80">Average Sale Price</span>
            <span className="text-cyan-400 font-semibold">${stats?.avgSalePrice}</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2">
            <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full w-3/4" />
          </div>
        </div>
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-white/80">Customer Satisfaction</span>
            <span className="text-yellow-400 font-semibold">{stats?.rating}/5</span>
          </div>
          <div className="flex gap-1 items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-5 h-5 ${
                  i < Math.floor(stats?.rating)
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-white/20'
                }`}
              />
            ))}
            <span className="text-white/60 text-sm ml-2">({stats?.reviews} reviews)</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PerformanceMetrics