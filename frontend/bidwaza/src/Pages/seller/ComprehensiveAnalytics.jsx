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
                <AreaChart data={productPerformanceData}>
                  <defs>
                    <linearGradient id="colorProduct1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorProduct2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorProduct3" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
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
                  />
                  <Legend content={<CustomLegend />} />
                  {/* Dynamically render areas for each product */}
                  {productPerformanceData[0] && Object.keys(productPerformanceData[0])
                    .filter(key => key !== 'month')
                    .map((key, index) => (
                      !hiddenProducts[key] && (
                        <Area 
                          key={key}
                          type="monotone" 
                          dataKey={key} 
                          stroke={['#3b82f6', '#a855f7', '#10b981'][index % 3]} 
                          fillOpacity={1} 
                          fill={`url(#colorProduct${(index % 3) + 1})`} 
                        />
                      )
                    ))
                  }
                </AreaChart>
              </ResponsiveContainer>
              <p className="text-white/60 text-xs text-center mt-2">Click legend items to show/hide products</p>
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
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
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
                    formatter={(value) => `रु${value.toLocaleString()}`}
                  />
                </PieChart>
              </ResponsiveContainer>
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

        {/* Auction Statistics */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-orange-400" />
            <h3 className="text-lg font-bold text-white">Auction Performance</h3>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-white/60 text-sm mb-1">Total Auctions</p>
                <p className="text-2xl font-bold text-white">{auctionStats.totalAuctions}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-white/60 text-sm mb-1">Win Rate</p>
                <p className="text-2xl font-bold text-green-400">{auctionStats.winRate}%</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-white/60 text-sm mb-1">Avg Bids</p>
                <p className="text-2xl font-bold text-cyan-400">{auctionStats.avgBidsPerAuction}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-white/60 text-sm mb-1">Total Bids</p>
                <p className="text-2xl font-bold text-purple-400">{auctionStats.totalBids}</p>
              </div>
            </div>
            
            {/* Bid Activity Bar */}
            {auctionStats.bidActivity && auctionStats.bidActivity.length > 0 && (
              <div className="mt-4">
                <p className="text-white/80 text-sm mb-2">Bid Activity by Day</p>
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={auctionStats.bidActivity}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="day" stroke="rgba(255,255,255,0.6)" />
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
                    />
                    <Bar dataKey="9PM" stackId="a" fill="#f59e0b" />
                    <Bar dataKey="6PM" stackId="a" fill="#3b82f6" />
                    <Bar dataKey="3PM" stackId="a" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ComprehensiveAnalytics;