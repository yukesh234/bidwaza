import React, { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Calendar } from "lucide-react";
import { get7dayssales } from "../../services/sellerservices";

const Analytics = () => {
  const [data, setData] = useState([]);
  const [totalSales, setTotalSales] = useState(0);
  const [growth, setGrowth] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const response = await get7dayssales();
      
      if (response.success) {
        // Now response.data contains dailySales, totalSales, and growth
        const apiData = response.data;
        
        // Map the daily sales data
        const formatted = apiData.dailySales.map((item) => ({
          name: item.day,
          sales: item.sales,
          fullDate: item.date,
        }));
        
        setData(formatted);
        setTotalSales(apiData.totalSales || 0);
        setGrowth(apiData.growth || 0);
      } else {
        console.log("Failed to fetch sales", response.message);
      }
    } catch (error) {
      console.log("Error fetching sales", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-white/20 rounded-lg p-3 shadow-xl">
          <p className="text-white/60 text-xs mb-1">{payload[0].payload.name}</p>
          <p className="text-cyan-400 font-bold text-lg">
            रु{payload[0].value.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20">
      {/* Header with Stats */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-white text-xl font-bold mb-1">
            Weekly Sales Overview
          </h2>
          <p className="text-white/60 text-sm flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Last 7 Days
          </p>
        </div>

        <div className="flex gap-4">
          {/* Total Sales Card */}
         <div className="flex gap-4">
  {/* Total Sales Card */}
  <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-xl px-4 py-3">
    <div className="flex items-center gap-2 mb-1">
      <span className="text-cyan-400 text-sm font-semibold">रु</span>
      <p className="text-white/60 text-xs">Total Sales</p>
    </div>
    <p className="text-white font-bold text-2xl">
      रु{totalSales.toLocaleString()}
    </p>
  </div>
</div>

          {/* Growth Card */}
          <div className={`bg-gradient-to-br ${
            growth >= 0 
              ? 'from-green-500/20 to-emerald-500/20 border-green-500/30' 
              : 'from-red-500/20 to-orange-500/20 border-red-500/30'
            } border rounded-xl px-4 py-3`}>
            <div className="flex items-center gap-2 mb-1">
              {growth >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-400" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-400" />
              )}
              <p className="text-white/60 text-xs">Growth</p>
            </div>
            <p className={`font-bold text-2xl ${
              growth >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {growth >= 0 ? '+' : ''}{growth}%
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="text-white/60">Loading sales data...</div>
        </div>
      ) : data.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
            <XAxis 
              dataKey="name" 
              stroke="#94a3b8" 
              tick={{ fill: '#94a3b8' }}
              axisLine={{ stroke: '#334155' }}
            />
            <YAxis 
              stroke="#94a3b8"
              tick={{ fill: '#94a3b8' }}
              axisLine={{ stroke: '#334155' }}
              tickFormatter={(value) => `रु${value}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="sales"
              stroke="#38bdf8"
              strokeWidth={3}
              fill="url(#salesGradient)"
              dot={{ 
                r: 5, 
                fill: '#38bdf8',
                strokeWidth: 2,
                stroke: '#1e293b'
              }}
              activeDot={{ 
                r: 7,
                fill: '#38bdf8',
                strokeWidth: 3,
                stroke: '#1e293b'
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-64 flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
            <TrendingUp className="w-8 h-8 text-white/40" />
          </div>
          <p className="text-white/60 text-lg">No sales data available</p>
          <p className="text-white/40 text-sm mt-2">Sales will appear here once you start selling</p>
        </div>
      )}
    </div>
  );
};

export default Analytics;