import React, { useState, useEffect } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, Package, Activity, Award, Loader, Download } from 'lucide-react';
import { 
  getMonthlySales, 
  getProductPerformance, 
  getCatagoryRevenue as getCategoryRevenue, 
  getTopProducts, 
  getAuctionStats 
} from '../../services/sellerservices';
import toast from 'react-hot-toast';

// AuctionStatistics Component
function AuctionStatistics({ auctionStats }) {
  // Helper to get color based on bid count
  const getHeatmapColor = (count, maxCount) => {
    if (count === 0) return 'bg-white/5';
    const intensity = count / maxCount;
    if (intensity > 0.7) return 'bg-orange-500';
    if (intensity > 0.5) return 'bg-orange-400';
    if (intensity > 0.3) return 'bg-orange-300';
    if (intensity > 0.1) return 'bg-orange-200';
    return 'bg-orange-100';
  };
 

  // Find max count for color scaling
  const allCounts = auctionStats.bidActivity?.flatMap(day => 
    Object.entries(day)
      .filter(([key]) => key !== 'day')
      .map(([_, value]) => value)
  ) || [];
  const maxCount = Math.max(...allCounts, 1);

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-orange-400" />
        <h3 className="text-lg font-bold text-white">Auction Performance</h3>
      </div>
      
      <div className="space-y-6">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-all">
            <p className="text-white/60 text-sm mb-1">Total Auctions</p>
            <p className="text-2xl font-bold text-white">{auctionStats.totalAuctions}</p>
          </div>
          <div className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-all">
            <p className="text-white/60 text-sm mb-1">Completed</p>
            <p className="text-2xl font-bold text-green-400">{auctionStats.completedAuctions}</p>
          </div>
          <div className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-all">
            <p className="text-white/60 text-sm mb-1">Avg Bids/Auction</p>
            <p className="text-2xl font-bold text-cyan-400">{auctionStats.avgBidsPerAuction}</p>
          </div>
          <div className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-all">
            <p className="text-white/60 text-sm mb-1">Total Bids</p>
            <p className="text-2xl font-bold text-purple-400">{auctionStats.totalBids}</p>
          </div>
        </div>

        {/* Bid Activity Heatmap */}
        {auctionStats.bidActivity && auctionStats.bidActivity.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-white/80 font-semibold text-sm">Bid Activity Heatmap</p>
              <div className="flex items-center gap-2 text-xs text-white/60">
                <span>Low</span>
                <div className="flex gap-1">
                  <div className="w-4 h-4 rounded bg-orange-100"></div>
                  <div className="w-4 h-4 rounded bg-orange-200"></div>
                  <div className="w-4 h-4 rounded bg-orange-300"></div>
                  <div className="w-4 h-4 rounded bg-orange-400"></div>
                  <div className="w-4 h-4 rounded bg-orange-500"></div>
                </div>
                <span>High</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <div className="inline-block min-w-full">
                {/* Header Row with Time Slots */}
                <div className="flex gap-2 mb-2">
                  <div className="w-12"></div>
                  {['9AM', '12PM', '3PM', '6PM', '9PM'].map(time => (
                    <div key={time} className="flex-1 min-w-[60px] text-center">
                      <span className="text-white/60 text-xs font-medium">{time}</span>
                    </div>
                  ))}
                </div>

                {/* Heatmap Grid */}
                <div className="space-y-2">
                  {auctionStats.bidActivity.map((dayData, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      {/* Day Label */}
                      <div className="w-12">
                        <span className="text-white/70 text-xs font-medium">{dayData.day}</span>
                      </div>
                      
                      {/* Time Slot Cells */}
                      {['9AM', '12PM', '3PM', '6PM', '9PM'].map(time => {
                        const count = dayData[time] || 0;
                        const colorClass = getHeatmapColor(count, maxCount);
                        
                        return (
                          <div
                            key={time}
                            className={`flex-1 min-w-[60px] h-12 rounded-lg ${colorClass} flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-orange-400 transition-all group relative`}
                            title={`${dayData.day} ${time}: ${count} bids`}
                          >
                            <span className={`text-sm font-semibold ${count > 0 ? 'text-white' : 'text-white/30'}`}>
                              {count}
                            </span>
                            
                            {/* Tooltip on hover */}
                            <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                              <div className="bg-slate-900 text-white text-xs px-3 py-2 rounded-lg shadow-xl border border-white/20 whitespace-nowrap">
                                <div className="font-semibold">{dayData.day} at {time}</div>
                                <div className="text-white/70">{count} {count === 1 ? 'bid' : 'bids'}</div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <p className="text-white/50 text-xs text-center mt-3">
              Hover over cells to see detailed bid counts
            </p>
          </div>
        ) : (
          <div className="bg-white/5 rounded-lg p-8 text-center">
            <p className="text-white/40 text-sm">No bid activity data available</p>
          </div>
        )}

        {/* Win Rate Progress Bar */}
        {auctionStats.totalAuctions > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-white/80 text-sm font-semibold">Success Rate</span>
              <span className="text-green-400 font-bold">{auctionStats.winRate}%</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${auctionStats.winRate}%` }}
              ></div>
            </div>
            <p className="text-white/50 text-xs">
              {auctionStats.completedAuctions} of {auctionStats.totalAuctions} auctions completed successfully
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Main ComprehensiveAnalytics Component
function ComprehensiveAnalytics({ stats }) {
  const [timeRange, setTimeRange] = useState('6months');
  const [loading, setLoading] = useState(true);
  const [hiddenProducts, setHiddenProducts] = useState({});
  
  // State for all analytics data
  const [monthlySalesData, setMonthlySalesData] = useState([]);
  const [productPerformanceData, setProductPerformanceData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [auctionStats, setAuctionStats] = useState({
    totalAuctions: 0,
    completedAuctions: 0,
    winRate: 0,
    avgBidsPerAuction: 0,
    totalBids: 0,
    bidActivity: []
  });
   const [selectedMonth, setSelectedMonth] = useState(null);

  // Fetch all analytics data
  const fetchAnalytics = async (range) => {
    setLoading(true);
    try {
      const [
        salesResponse,
        performanceResponse,
        categoryResponse,
        productsResponse,
        auctionResponse
      ] = await Promise.all([
        getMonthlySales(range),
        getProductPerformance(range),
        getCategoryRevenue(range),
        getTopProducts(range),
        getAuctionStats(range)
      ]);

      if (salesResponse.success) {
        setMonthlySalesData(salesResponse.data);
      }
      if (performanceResponse.success) {
        setProductPerformanceData(performanceResponse.data);
        console.log(productPerformanceData);
      }
      if (categoryResponse.success) {
        setCategoryData(categoryResponse.data);
      }
      if (productsResponse.success) {
        setTopProducts(productsResponse.data);
      }
      if (auctionResponse.success) {
        setAuctionStats(auctionResponse.data);
      }

    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on mount and when timeRange changes
  useEffect(() => {
    fetchAnalytics(timeRange);
  }, [timeRange]);

  const handleTimeRangeChange = (e) => {
    setTimeRange(e.target.value);
  };

  // Toggle product visibility
  const handleLegendClick = (dataKey) => {
    setHiddenProducts(prev => ({
      ...prev,
      [dataKey]: !prev[dataKey]
    }));
  };

  // Download Monthly Revenue as Excel (CSV format)
  const downloadMonthlyRevenueAsExcel = () => {
    if (monthlySalesData.length === 0) {
      toast.error('No data to download');
      return;
    }

    // Create CSV content
    const headers = ['Month', 'Revenue (रु)', 'Orders'];
    const csvContent = [
      headers.join(','),
      ...monthlySalesData.map(item => 
        `${item.month},${item.revenue},${item.orders}`
      )
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Monthly_Revenue_${timeRange}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Revenue data downloaded successfully!');
  };

  // Download chart as PNG image
  const downloadChartAsImage = async (chartSelector, fileName) => {
    try {
      const chartElement = document.querySelector(chartSelector);
      if (!chartElement) {
        toast.error('Chart not found');
        return;
      }

      const svgElement = chartElement.querySelector('.recharts-wrapper svg');
      if (!svgElement) {
        toast.error('SVG not found');
        return;
      }

      // Get SVG data
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      // Set canvas size
      const svgSize = svgElement.getBoundingClientRect();
      canvas.width = svgSize.width * 2;
      canvas.height = svgSize.height * 2;
      
      // Create blob URL
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      img.onload = function() {
        // Fill white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw image
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Convert to PNG and download
        canvas.toBlob(function(blob) {
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = fileName;
          link.click();
          URL.revokeObjectURL(url);
          toast.success('Chart downloaded successfully!');
        });
      };

      img.onerror = function() {
        toast.error('Failed to load image');
        URL.revokeObjectURL(url);
      };

      img.src = url;
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download chart');
    }
  };

  const downloadCategoryRevenueAsImage = () => {
    downloadChartAsImage(
      '[data-chart="category-revenue"]',
      `Category_Revenue_${timeRange}_${new Date().toISOString().split('T')[0]}.png`
    );
  };

  const downloadProductTrendAsImage = () => {
    downloadChartAsImage(
      '[data-chart="product-performance"]',
      `Product_Sales_Trend_${timeRange}_${new Date().toISOString().split('T')[0]}.png`
    );
  };

  // Custom Legend with click handler
  const CustomLegend = ({ payload }) => {
    return (
      <div className="flex justify-center gap-4 mt-4 flex-wrap">
        {payload.map((entry, index) => (
          <div
            key={`legend-${index}`}
            onClick={() => handleLegendClick(entry.dataKey)}
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
            style={{ opacity: hiddenProducts[entry.dataKey] ? 0.4 : 1 }}
          >
            <div
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-white text-sm">
              {hiddenProducts[entry.dataKey] ? <s>{entry.value}</s> : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-white/60">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Time Range Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Analytics Dashboard</h2>
          <p className="text-white/60 text-sm">Comprehensive insights into your business</p>
        </div>
        <select 
          value={timeRange}
          onChange={handleTimeRangeChange}
          className="bg-white/10 text-white border border-white/20 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
        >
          <option value="1month" className="bg-slate-800">Last Month</option>
          <option value="3months" className="bg-slate-800">Last 3 Months</option>
          <option value="6months" className="bg-slate-800">Last 6 Months</option>
          <option value="1year" className="bg-slate-800">Last Year</option>
        </select>
      </div>

      {/* Monthly Sales Bar Graph */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-bold text-white">Monthly Revenue & Orders</h3>
          </div>
          <button
            onClick={downloadMonthlyRevenueAsExcel}
            disabled={monthlySalesData.length === 0}
            className="flex items-center gap-2 px-3 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm font-semibold">Excel</span>
          </button>
        </div>
        {monthlySalesData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlySalesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="month" stroke="rgba(255,255,255,0.6)" />
              <YAxis stroke="rgba(255,255,255,0.6)" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  color: '#fff'
                }}
                itemStyle={{ color: '#fff' }}
                labelStyle={{ color: '#fff' }}
                cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                formatter={(value, name) => {
                  if (name === 'revenue') return [`रु${value.toLocaleString()}`, 'Revenue'];
                  return [value, 'Orders'];
                }}
              />
              <Legend 
                wrapperStyle={{ 
                  paddingTop: '20px',
                  outline: 'none'
                }}
                iconType="square"
              />
              <Bar dataKey="revenue" fill="#06b6d4" radius={[8, 8, 0, 0]} />
              <Bar dataKey="orders" fill="#a855f7" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-64 flex items-center justify-center text-white/40">
            No sales data available for this period
          </div>
        )}
      </div>

{/* Product Performance & Category Distribution */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Product Performance Area Chart */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-bold text-white">Product Sales Trend</h3>
            </div>
            <button
              onClick={downloadProductTrendAsImage}
              disabled={productPerformanceData.length === 0}
              className="flex items-center gap-2 px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              <span className="text-sm font-semibold">PNG</span>
            </button>
          </div>
          {productPerformanceData.length > 0 ? (
            <div data-chart="product-performance">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart 
                  data={productPerformanceData}
                  onMouseMove={(e) => {
                    if (e && e.activeLabel) {
                      setSelectedMonth(e.activeLabel);
                    }
                  }}
                  onMouseLeave={() => {
                    setSelectedMonth(null);
                  }}
                >
                  <defs>
                    <linearGradient id="colorProduct1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.6}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.05}/>
                    </linearGradient>
                    <linearGradient id="colorProduct2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#d946ef" stopOpacity={0.6}/>
                      <stop offset="95%" stopColor="#d946ef" stopOpacity={0.05}/>
                    </linearGradient>
                    <linearGradient id="colorProduct3" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.6}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0.05}/>
                    </linearGradient>
                    <linearGradient id="colorProduct4" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.6}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.05}/>
                    </linearGradient>
                    <linearGradient id="colorProduct5" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.6}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="month" stroke="rgba(255,255,255,0.6)" tick={{ fill: 'rgba(255,255,255,0.7)' }} />
                  <YAxis stroke="rgba(255,255,255,0.6)" tick={{ fill: 'rgba(255,255,255,0.7)' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                    itemStyle={{ color: '#fff' }}
                    labelStyle={{ color: '#fff' }}
                    cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                    formatter={(value, name) => {
                      return [`${value} units sold`, name];
                    }}
                  />
                  <Legend 
                    content={({ payload }) => {
                      const colors = ['#06b6d4', '#d946ef', '#22c55e', '#f59e0b', '#ef4444'];
                      return (
                        <div className="flex flex-wrap justify-center gap-3 mt-3">
                          {payload && payload.map((entry, index) => {
                            const isHidden = hiddenProducts[entry.value];
                            return (
                              <button
                                key={`legend-${index}`}
                                onClick={() => {
                                  setHiddenProducts(prev => ({
                                    ...prev,
                                    [entry.value]: !prev[entry.value]
                                  }));
                                }}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
                                  isHidden 
                                    ? 'bg-white/5 opacity-40 hover:opacity-60' 
                                    : 'bg-white/10 hover:bg-white/15'
                                }`}
                              >
                                <div
                                  className="w-3 h-3 rounded-sm flex-shrink-0"
                                  style={{ backgroundColor: colors[index % colors.length] }}
                                />
                                <span className="text-white text-sm font-medium">
                                  {entry.value}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      );
                    }}
                  />
                  {/* Dynamically render areas for each product with natural curves */}
                  {productPerformanceData[0] && Object.keys(productPerformanceData[0])
                    .filter(key => key !== 'month')
                    .map((key, index) => {
                      const colors = ['#06b6d4', '#d946ef', '#22c55e', '#f59e0b', '#ef4444'];
                      const colorIndex = index % colors.length;
                      return (
                        <Area 
                          key={key}
                          type="monotone"
                          dataKey={key} 
                          stroke={colors[colorIndex]} 
                          strokeWidth={2}
                          fillOpacity={0.3}
                          fill={`url(#colorProduct${colorIndex + 1})`}
                          hide={hiddenProducts[key]}
                        />
                      );
                    })
                  }
                </AreaChart>
              </ResponsiveContainer>
              <p className="text-white/60 text-xs text-center mt-2">
                {selectedMonth 
                  ? `Showing sales for ${selectedMonth}` 
                  : 'Click legend items to show/hide products • Hover to see monthly sales'}
              </p>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-white/40">
              No product performance data available
            </div>
          )}
        </div>

        {/* Category Revenue Pie Chart */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-400" />
              <h3 className="text-lg font-bold text-white">Revenue by Category</h3>
            </div>
            <button
              onClick={downloadCategoryRevenueAsImage}
              disabled={categoryData.length === 0}
              className="flex items-center gap-2 px-3 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              <span className="text-sm font-semibold">PNG</span>
            </button>
          </div>
          {categoryData.length > 0 ? (
            <div data-chart="category-revenue">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="45%"
                    labelLine={false}
                    label={false}
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                    itemStyle={{ color: '#fff' }}
                    labelStyle={{ color: '#fff' }}
                    formatter={(value, name) => [`रु${value.toLocaleString()}`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Custom Legend for Pie Chart */}
              <div className="flex flex-wrap justify-center gap-4 mt-2">
                {categoryData.map((entry, index) => (
                  <div key={`legend-${index}`} className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-sm flex-shrink-0"
                      style={{ backgroundColor: entry.color }}
                    />
                    <div className="text-left">
                      <span className="text-white text-sm font-medium block">{entry.name}</span>
                      <span className="text-white/60 text-xs">
                        {((entry.value / categoryData.reduce((sum, item) => sum + item.value, 0)) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-white/40">
              No category data available
            </div>
          )}
        </div>
      </div>
     

      {/* Top Products & Auction Stats */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Selling Products */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-yellow-400" />
            <h3 className="text-lg font-bold text-white">Top 5 Products</h3>
          </div>
          {topProducts.length > 0 ? (
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-white font-medium">{product.name}</p>
                      <p className="text-white/60 text-sm">{product.quantity} units sold</p>
                    </div>
                  </div>
                  <p className="text-green-400 font-bold">रु{product.revenue.toLocaleString()}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-white/40">
              No product sales in this period
            </div>
          )}
        </div>

        {/* Auction Statistics - New Enhanced Component */}
        <AuctionStatistics auctionStats={auctionStats} />
      </div>
    </div>
  );
}

export default ComprehensiveAnalytics;