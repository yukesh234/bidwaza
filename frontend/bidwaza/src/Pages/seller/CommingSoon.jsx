import React from 'react'
import { motion } from "framer-motion"

function CommingSoon({ icon: Icon, title }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -20 }}
      className="text-center py-20"
    >
      <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full mb-6">
        <Icon className="w-10 h-10 text-cyan-300" />
      </div>
      <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
      <p className="text-white/60">Coming soon...</p>
    </motion.div>
  )
}

export default CommingSoon