import React from 'react'
import { motion } from "framer-motion"

function StatsCard({ stat }) {
  return (
    <motion.div 
      className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:border-white/40 transition-all"
      whileHover={{ scale: 1.02 }}
    >
      <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-xl flex items-center justify-center mb-4`}>
        <stat.icon className="w-6 h-6 text-white" />
      </div>
      <div className="text-2xl font-bold text-white">{stat.value}</div>
      <div className="text-white/60 text-sm">{stat.label}</div>
    </motion.div>
  )
}

export default StatsCard