import React from 'react'
import { Bell, Gavel, Eye, CheckCircle, MessageCircle, Star } from "lucide-react"

function RecentActivity({ activities }) {
  const getActivityIcon = (type) => {
    const icons = { bid: Gavel, view: Eye, sold: CheckCircle, message: MessageCircle, featured: Star }
    return icons[type] || Bell
  }

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
      <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <Bell className="w-6 h-6" />
        Recent Activity
      </h3>
      <div className="space-y-4">
        {activities?.length > 0 ? activities.map((activity, i) => {
          const Icon = getActivityIcon(activity.type)
          return (
            <div key={i} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
              <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center">
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-white text-sm">{activity.message}</p>
                <p className="text-white/40 text-xs">{activity.time}</p>
              </div>
              {activity.amount && <div className="text-green-400 font-semibold">{activity.amount}</div>}
            </div>
          )
        }) : (
          <p className="text-white/60 text-center py-8">No recent activity</p>
        )}
      </div>
    </div>
  )
}

export default RecentActivity