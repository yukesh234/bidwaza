import React from 'react'
import { motion } from "framer-motion"

export function StatsCard({ stat }) {
  const Icon = stat.icon;
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      <p className="text-white/60 text-sm mb-1">{stat.label}</p>
      <p className="text-3xl font-bold text-white">{stat.value}</p>
    </motion.div>
  );
}