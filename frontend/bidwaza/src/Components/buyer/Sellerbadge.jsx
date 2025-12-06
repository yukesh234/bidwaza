import React from 'react';
import { Award, Crown, Star, TrendingUp } from 'lucide-react';

const SellerBadge = ({ totalItemsSold }) => {
  const getBadgeInfo = () => {
    if (totalItemsSold >= 20) {
      return {
        icon: Crown,
        label: 'Elite Seller',
        gradient: 'from-yellow-400 via-amber-500 to-orange-500',
        bgGradient: 'from-yellow-500/20 to-orange-500/20',
        borderColor: 'border-yellow-400/50',
        textColor: 'text-yellow-300',
        animation: 'animate-pulse'
      };
    } else if (totalItemsSold >= 10) {
      return {
        icon: Award,
        label: 'Top Seller',
        gradient: 'from-purple-400 via-pink-500 to-red-500',
        bgGradient: 'from-purple-500/20 to-red-500/20',
        borderColor: 'border-purple-400/50',
        textColor: 'text-purple-300',
        animation: ''
      };
    } else if (totalItemsSold >= 5) {
      return {
        icon: Star,
        label: 'Pro Seller',
        gradient: 'from-blue-400 via-cyan-500 to-teal-500',
        bgGradient: 'from-blue-500/20 to-teal-500/20',
        borderColor: 'border-blue-400/50',
        textColor: 'text-blue-300',
        animation: ''
      };
    } else if (totalItemsSold >= 2) {
      return {
        icon: TrendingUp,
        label: 'Rising Seller',
        gradient: 'from-green-400 via-emerald-500 to-teal-500',
        bgGradient: 'from-green-500/20 to-teal-500/20',
        borderColor: 'border-green-400/50',
        textColor: 'text-green-300',
        animation: ''
      };
    }
    return null;
  };

  const badgeInfo = getBadgeInfo();

  if (!badgeInfo) return null;

  const Icon = badgeInfo.icon;

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r ${badgeInfo.bgGradient} border ${badgeInfo.borderColor} backdrop-blur-sm ${badgeInfo.animation}`}>
      <Icon className={`w-4 h-4 ${badgeInfo.textColor}`} />
      <span className={`text-sm font-semibold ${badgeInfo.textColor}`}>
        {badgeInfo.label}
      </span>
      <span className="text-xs text-white/60">
        ({totalItemsSold} sold)
        {/* {console.log("Total Items Sold in Badge:", totalItemsSold)} */}
      </span>
    </div>
  );
};

export default SellerBadge;