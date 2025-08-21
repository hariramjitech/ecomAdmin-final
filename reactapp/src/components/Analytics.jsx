import { useState, useMemo, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Line
} from 'recharts';
import { 
  DollarSign, Package, ShoppingCart, Users, RefreshCw, AlertCircle,
  Calendar, TrendingUp, Activity, GitBranch
} from 'lucide-react';
import { fetchProducts, fetchOrders } from '../utils/api';

const CHART_COLORS = ['#2563eb', '#16a34a', '#dc2626', '#ca8a04', '#9333ea', '#0891b2', '#ec4899', '#f59e0b'];

// Helper function to calculate days between dates
const getDaysBetweenDates = (dateFilter) => {
  const now = new Date();
  switch (dateFilter) {
    case 'today': return 1;
    case 'week': return 7;
    case 'month': return 30;
    case '3months': return 90;
    case 'year': return 365;
    default: return 0;
  }
};

// Helper function to get activity color for heatmap
const getActivityColor = (level) => {
  const colors = ['#f3f4f6', '#c6f6d5', '#68d391', '#38a169', '#2f855a'];
  return colors[Math.min(level, 4)] || colors[0];
};

// Helper function to filter orders by date range with UTC normalization
const filterOrdersByDate = (orders, dateFilter, customDateRange) => {
  if (dateFilter === 'all') return orders;
  
  const now = new Date();
  let startDate, endDate;
  
  switch (dateFilter) {
    case 'today':
      startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      endDate = new Date();
      break;
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      endDate = new Date();
      break;
    case 'month':
      startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      endDate = new Date();
      break;
    case '3months':
      startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 3, 1));
      endDate = new Date();
      break;
    case 'year':
      startDate = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
      endDate = new Date();
      break;
    case 'custom':
      if (customDateRange.start && customDateRange.end) {
        startDate = new Date(customDateRange.start);
        endDate = new Date(customDateRange.end);
      } else {
        return orders;
      }
      break;
    default:
      return orders;
  }
  
  return orders.filter(order => {
    const orderDate = new Date(order.orderDate || order.created_at || order.date || order.createdAt);
    const utcOrderDate = new Date(Date.UTC(
      orderDate.getUTCFullYear(),
      orderDate.getUTCMonth(),
      orderDate.getUTCDate(),
      orderDate.getUTCHours(),
      orderDate.getUTCMinutes()
    ));
    return utcOrderDate >= startDate && utcOrderDate <= endDate;
  });
};

export default function EnhancedAnalyticsDashboard() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateFilter, setDateFilter] = useState('all');
  const [customDateRange, setCustomDateRange] = useState({
    start: '',
    end: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  // Real-time polling for 'today' filter
  useEffect(() => {
    if (dateFilter === 'today') {
      const interval = setInterval(loadData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [dateFilter]);

  useEffect(() => {
    const filtered = filterOrdersByDate(orders, dateFilter, customDateRange);
    setFilteredOrders(filtered);
  }, [orders, dateFilter, customDateRange]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [productsResponse, ordersResponse] = await Promise.all([
        fetchProducts(),
        fetchOrders()
      ]);

      const productsData = productsResponse.data || productsResponse || [];
      const ordersData = ordersResponse.data || ordersResponse || [];

      setProducts(productsData);
      setOrders(ordersData);
    } catch (err) {
      setError('Failed to load data from database');
      console.error('Database error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Activity heatmap data
  const activityData = useMemo(() => {
    const today = new Date();
    const oneYearAgo = new Date(Date.UTC(today.getUTCFullYear() - 1, today.getUTCMonth(), today.getUTCDate()));
    const activityMap = new Map();
    
    for (let d = new Date(oneYearAgo); d <= today; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().split('T')[0];
      activityMap.set(dateKey, { 
        date: dateKey, 
        orders: 0, 
        revenue: 0,
        customers: new Set(),
        level: 0,
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        formattedDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      });
    }
    
    filteredOrders.forEach(order => {
      const orderDate = new Date(order.orderDate || order.created_at || order.date || order.createdAt);
      const dateKey = orderDate.toISOString().split('T')[0];
      
      if (activityMap.has(dateKey)) {
        const dayData = activityMap.get(dateKey);
        dayData.orders += 1;
        dayData.revenue += order.totalAmount || order.total || order.amount || 0;
        dayData.customers.add(order.customerEmail || order.customer_email || order.email);
      }
    });
    
    const orderCounts = Array.from(activityMap.values()).map(d => d.orders);
    const maxOrders = Math.max(...orderCounts);
    
    activityMap.forEach(dayData => {
      dayData.customers = dayData.customers.size;
      if (maxOrders > 0) {
        const ratio = dayData.orders / maxOrders;
        if (ratio === 0) {
          dayData.level = 0;
        } else if (ratio < 0.25) {
          dayData.level = 1;
        } else if (ratio < 0.5) {
          dayData.level = 2;
        } else if (ratio < 0.75) {
          dayData.level = 3;
        } else {
          dayData.level = 4;
        }
      } else {
        dayData.level = 0;
      }
    });
    
    return Array.from(activityMap.values()).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [filteredOrders]);

  // Revenue trend data based on date filter
  const revenueData = useMemo(() => {
    if (!filteredOrders || filteredOrders.length === 0) return [];
    
    const now = new Date();
    let startDate, endDate, isHourly = false;
    
    switch (dateFilter) {
      case 'today':
        startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
        endDate = new Date();
        isHourly = true;
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        endDate = new Date();
        break;
      case 'month':
        startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
        endDate = new Date();
        break;
      case '3months':
        startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 3, 1));
        endDate = new Date();
        break;
      case 'year':
        startDate = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
        endDate = new Date();
        break;
      case 'custom':
        if (customDateRange.start && customDateRange.end) {
          startDate = new Date(customDateRange.start);
          endDate = new Date(customDateRange.end);
        } else {
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          endDate = new Date();
        }
        break;
      case 'all':
        startDate = new Date(Math.min(...filteredOrders.map(o => 
          new Date(o.orderDate || o.created_at || o.date || o.createdAt).getTime())));
        endDate = new Date();
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        endDate = new Date();
    }

    const dataMap = new Map();
    
    if (isHourly) {
      // Hourly data for 'today'
      for (let h = 0; h < 24; h++) {
        const hourStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), h));
        const hourKey = `${h}:00`;
        dataMap.set(hourKey, {
          time: hourKey,
          revenue: 0,
          orders: 0
        });
      }
      
      filteredOrders.forEach(order => {
        const orderDate = new Date(order.orderDate || order.created_at || order.date || order.createdAt);
        const hour = orderDate.getUTCHours();
        const hourKey = `${hour}:00`;
        
        if (dataMap.has(hourKey)) {
          const hourData = dataMap.get(hourKey);
          hourData.revenue += order.totalAmount || order.total || order.amount || 0;
          hourData.orders += 1;
        }
      });
      
      return Array.from(dataMap.values());
    } else {
      // Daily data for other filters
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateKey = d.toISOString().split('T')[0];
        dataMap.set(dateKey, {
          date: dateKey,
          revenue: 0,
          orders: 0,
          formattedDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        });
      }
      
      filteredOrders.forEach(order => {
        const orderDate = new Date(order.orderDate || order.created_at || order.date || order.createdAt);
        const dateKey = orderDate.toISOString().split('T')[0];
        
        if (dataMap.has(dateKey)) {
          const dayData = dataMap.get(dateKey);
          dayData.revenue += order.totalAmount || order.total || order.amount || 0;
          dayData.orders += 1;
        }
      });
      
      return Array.from(dataMap.values())
        .sort((a, b) => new Date(a.date) - new Date(b.date));
    }
  }, [filteredOrders, dateFilter, customDateRange]);

  // Calculate comprehensive analytics
  const stats = useMemo(() => {
    if (!filteredOrders || filteredOrders.length === 0) {
      return {
        totalRevenue: 0,
        totalOrders: 0,
        totalProducts: products.length,
        totalCustomers: 0,
        avgOrderValue: 0,
        growthRate: 0,
        topProducts: [],
        topCustomers: [],
        categoryData: [],
        statusData: [],
        recentOrders: [],
        lowStockProducts: products.filter(p => (p.stockQuantity || p.stock || p.quantity) < 10).slice(0, 5),
        peakDay: null,
        totalActivity: 0,
        conversionMetrics: {
          repeatCustomers: 0,
          avgOrdersPerCustomer: 0,
          customerLifetimeValue: 0
        }
      };
    }

    const totalRevenue = filteredOrders.reduce((sum, order) => {
      return sum + (order.totalAmount || order.total || order.amount || 0);
    }, 0);
    
    const totalOrders = filteredOrders.length;
    const totalProducts = products.length;
    
    const uniqueCustomers = new Set(filteredOrders.map(o => 
      o.customerEmail || o.customer_email || o.email || o.customer_id
    ).filter(Boolean));
    const totalCustomers = uniqueCustomers.size;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const currentPeriodDays = getDaysBetweenDates(dateFilter);
    let growthRate = 0;
    
    if (dateFilter !== 'all' && currentPeriodDays > 0) {
      const previousPeriodStart = new Date();
      previousPeriodStart.setDate(previousPeriodStart.getDate() - (currentPeriodDays * 2));
      const previousPeriodEnd = new Date();
      previousPeriodEnd.setDate(previousPeriodEnd.getDate() - currentPeriodDays);
      
      const previousOrders = orders.filter(order => {
        const orderDate = new Date(order.orderDate || order.created_at || order.date || order.createdAt);
        return orderDate >= previousPeriodStart && orderDate <= previousPeriodEnd;
      });
      
      const previousRevenue = previousOrders.reduce((sum, order) => 
        sum + (order.totalAmount || order.total || order.amount || 0), 0);
      growthRate = previousRevenue > 0 
        ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 
        : (totalRevenue > 0 ? 100 : 0);
    }

    const customerMap = new Map();
    filteredOrders.forEach(order => {
      const customerKey = order.customerEmail || order.customer_email || order.email || order.customer_id;
      if (!customerKey) return;
      
      if (!customerMap.has(customerKey)) {
        customerMap.set(customerKey, {
          name: order.customerName || order.customer_name || order.name || 'Unknown',
          email: customerKey,
          totalSpent: 0,
          totalOrders: 0,
          firstOrder: order.orderDate || order.created_at || order.date || order.createdAt,
          lastOrder: order.orderDate || order.created_at || order.date || order.createdAt
        });
      }
      const customer = customerMap.get(customerKey);
      customer.totalSpent += order.totalAmount || order.total || order.amount || 0;
      customer.totalOrders += 1;
      customer.lastOrder = order.orderDate || order.created_at || order.date || order.createdAt;
    });

    const topCustomers = Array.from(customerMap.values())
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 8);

    const productSales = new Map();
    filteredOrders.forEach(order => {
      const items = order.orderItems || order.items || order.products || [];
      items.forEach(item => {
        const product = item.product || item;
        if (product) {
          const productId = product.id || product.product_id;
          if (!productSales.has(productId)) {
            productSales.set(productId, {
              id: productId,
              name: product.name || product.title || 'Unknown Product',
              category: product.category || 'Uncategorized',
              price: product.price || 0,
              quantity: 0,
              revenue: 0,
              orders: 0
            });
          }
          const productData = productSales.get(productId);
          const quantity = item.quantity || 1;
          const price = item.priceAtPurchase || item.price || product.price || 0;
          
          productData.quantity += quantity;
          productData.revenue += price * quantity;
          productData.orders += 1;
        }
      });
    });

    const topProducts = Array.from(productSales.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);

    const categoryMap = new Map();
    productSales.forEach(product => {
      const cat = product.category || 'Uncategorized';
      if (!categoryMap.has(cat)) {
        categoryMap.set(cat, 0);
      }
      categoryMap.set(cat, categoryMap.get(cat) + product.revenue);
    });

    const categoryData = Array.from(categoryMap.entries())
      .map(([name, value], index) => ({
        name,
        value,
        fill: CHART_COLORS[index % CHART_COLORS.length]
      }))
      .sort((a, b) => b.value - a.value);

    const statusMap = new Map();
    filteredOrders.forEach(order => {
      const status = order.status || order.order_status || 'Unknown';
      statusMap.set(status, (statusMap.get(status) || 0) + 1);
    });

    const statusData = Array.from(statusMap.entries())
      .map(([name, value], index) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1).toLowerCase(),
        value,
        fill: CHART_COLORS[index % CHART_COLORS.length]
      }));

    const recentOrders = filteredOrders
      .sort((a, b) => new Date(b.orderDate || b.created_at || b.date || b.createdAt) - new Date(a.orderDate || a.created_at || a.date || a.createdAt))
      .slice(0, 5)
      .map(order => ({
        ...order,
        formattedDate: new Date(order.orderDate || order.created_at || order.date || order.createdAt).toLocaleDateString(),
        itemCount: (order.orderItems || order.items || order.products || []).length
      }));

    const lowStockProducts = products
      .filter(p => (p.stockQuantity || p.stock || p.quantity || 0) < 20)
      .sort((a, b) => (a.stockQuantity || a.stock || a.quantity || 0) - (b.stockQuantity || b.stock || b.quantity || 0))
      .slice(0, 5);

    const peakDay = activityData.reduce((peak, day) => 
      day.orders > (peak?.orders || 0) ? day : peak, null);

    const repeatCustomers = Array.from(customerMap.values()).filter(c => c.totalOrders > 1).length;
    const avgOrdersPerCustomer = totalCustomers > 0 ? totalOrders / totalCustomers : 0;
    const customerLifetimeValue = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;

    return {
      totalRevenue,
      totalOrders,
      totalProducts,
      totalCustomers,
      avgOrderValue,
      growthRate,
      topProducts,
      topCustomers,
      categoryData,
      statusData,
      recentOrders,
      lowStockProducts,
      peakDay,
      totalActivity: activityData.reduce((sum, day) => sum + day.orders, 0),
      conversionMetrics: {
        repeatCustomers,
        avgOrdersPerCustomer,
        customerLifetimeValue
      }
    };
  }, [products, filteredOrders, activityData, dateFilter, orders]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-xl">
          <RefreshCw className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Loading Analytics</h2>
          <p className="text-gray-600">Fetching data from your database...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-xl">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Data</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={loadData}
            className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 flex items-center gap-2 mx-auto transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header with filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                Analytics Dashboard
              </h1>
              <p className="text-gray-600 text-lg">Real-time insights to boost your e-commerce business</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-500 p-3 rounded-xl shadow-lg text-white">
                <Calendar className="h-5 w-5" />
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="bg-transparent border-none outline-none text-white"
                >
                  <option value="all" className="text-gray-800">All Time</option>
                  <option value="today" className="text-gray-800">Today</option>
                  <option value="week" className="text-gray-800">This Week</option>
                  <option value="month" className="text-gray-800">This Month</option>
                  <option value="3months" className="text-gray-800">Last 3 Months</option>
                  <option value="year" className="text-gray-800">This Year</option>
                  <option value="custom" className="text-gray-800">Custom Range</option>
                </select>
              </div>

              {dateFilter === 'custom' && (
                <div className="flex items-center gap-2 bg-white p-3 rounded-xl shadow-lg border">
                  <input
                    type="date"
                    value={customDateRange.start}
                    onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="border-none outline-none text-gray-700"
                  />
                  <span className="text-gray-400">to</span>
                  <input
                    type="date"
                    value={customDateRange.end}
                    onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="border-none outline-none text-gray-700"
                  />
                </div>
              )}

              <button
                onClick={loadData}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-3 rounded-xl hover:from-emerald-600 hover:to-teal-600 flex items-center gap-2 shadow-lg transition-all transform hover:scale-105"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh Data
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          {[
            { title: 'Total Revenue', value: `₹${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'from-emerald-400 to-emerald-600', growth: stats.growthRate },
            { title: 'Total Orders', value: stats.totalOrders.toLocaleString(), icon: ShoppingCart, color: 'from-blue-400 to-blue-600' },
            { title: 'Products', value: stats.totalProducts.toString(), icon: Package, color: 'from-purple-400 to-purple-600' },
            { title: 'Customers', value: stats.totalCustomers.toString(), icon: Users, color: 'from-orange-400 to-orange-600' },
            { title: 'Avg Order', value: `₹${stats.avgOrderValue.toFixed(0)}`, icon: DollarSign, color: 'from-indigo-400 to-indigo-600' },
            { title: 'Activity', value: stats.totalActivity.toString(), icon: Activity, color: 'from-teal-400 to-teal-600' }
          ].map((stat, index) => (
            <div key={index} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.color} shadow-lg`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                {stat.growth && stat.growth !== 0 && (
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                    stat.growth > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                  }`}>
                    <TrendingUp className="h-3 w-3" />
                    {stat.growth > 0 ? '+' : ''}{stat.growth.toFixed(1)}%
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                {dateFilter === 'today' && stat.title === 'Total Orders' && (
                  <p className="text-xs text-blue-500 mt-1">Real-time updates</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Business Insights */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-indigo-400 to-indigo-600 rounded-xl">
              <Activity className="h-6 w-6 text-white" />
            </div>
            Business Insights & Recommendations
          </h3>
          <ul className="space-y-4 text-gray-700">
            {stats.topProducts[0] && (
              <li className="flex items-start gap-3">
                <div className="mt-1 text-emerald-500">•</div>
                <div>
                  <span className="font-semibold">Top Product:</span> {stats.topProducts[0].name} is your bestseller, generating ₹{stats.topProducts[0].revenue.toLocaleString()} in revenue. Consider increasing stock or running promotions to capitalize on demand.
                </div>
              </li>
            )}
            {stats.topCustomers[0] && (
              <li className="flex items-start gap-3">
                <div className="mt-1 text-emerald-500">•</div>
                <div>
                  <span className="font-semibold">Top Customer:</span> {stats.topCustomers[0].name} ({stats.topCustomers[0].email}) has spent ₹{stats.topCustomers[0].totalSpent.toLocaleString()}. Reward loyal customers like this with discounts to encourage repeat business.
                </div>
              </li>
            )}
            {stats.categoryData[0] && (
              <li className="flex items-start gap-3">
                <div className="mt-1 text-emerald-500">•</div>
                <div>
                  <span className="font-semibold">Best Category:</span> {stats.categoryData[0].name} leads with ${stats.categoryData[0].value.toLocaleString()} revenue. Focus marketing efforts here to boost overall sales.
                </div>
              </li>
            )}
           <li className="flex items-start gap-3">
  <div className="mt-1 text-emerald-500">•</div>
  <div>
    <span className="font-semibold">Customer Retention:</span> {stats.conversionMetrics.repeatCustomers} repeat customers ({stats.totalCustomers > 0 ? ((stats.conversionMetrics.repeatCustomers / stats.totalCustomers) * 100).toFixed(1) : 0}% of total). Aim to increase this by implementing loyalty programs.
  </div>
</li>
            <li className="flex items-start gap-3">
              <div className="mt-1 text-emerald-500">•</div>
              <div>
                <span className="font-semibold">Inventory Alert:</span> {stats.lowStockProducts.length} products are low on stock. Prioritize restocking to avoid lost sales.
              </div>
            </li>
            {stats.growthRate !== 0 && (
              <li className="flex items-start gap-3">
                <div className="mt-1 text-emerald-500">•</div>
                <div>
                  <span className="font-semibold">Growth Trend:</span> Revenue has {stats.growthRate > 0 ? 'increased' : 'decreased'} by {Math.abs(stats.growthRate).toFixed(1)}% compared to the previous period. {stats.growthRate > 0 ? 'Keep up the momentum!' : 'Consider strategies to reverse this trend, like new promotions.'}
                </div>
              </li>
            )}
          </ul>
        </div>

        {/* Activity Heatmap */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-green-400 to-emerald-500 rounded-xl">
                <GitBranch className="h-6 w-6 text-white" />
              </div>
              Order Activity Heatmap
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Less</span>
              <div className="flex gap-1">
                {[0, 1, 2, 3, 4].map(level => (
                  <div
                    key={level}
                    className="w-3 h-3 rounded-sm border border-gray-200"
                    style={{ backgroundColor: getActivityColor(level) }}
                  />
                ))}
              </div>
              <span>More</span>
            </div>
          </div>
          
          {activityData.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(53, minmax(12px, 1fr))`, minWidth: '800px' }}>
                  {activityData.map((day, index) => (
                    <div
                      key={index}
                      className={`aspect-square rounded-sm border hover:border-gray-400 cursor-pointer transition-all group relative ₹{
                        day.date === new Date().toISOString().split('T')[0] ? 'border-2 border-blue-500' : 'border-gray-200'
                      }`}
                      style={{ backgroundColor: getActivityColor(day.level) }}
                      title={`${day.formattedDate}: ${day.orders} orders, ₹${day.revenue.toFixed(2)} revenue`}
                    >
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                        {day.formattedDate}<br/>
                        {day.orders} orders, ${day.revenue.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { label: 'Active Days', value: `${activityData.filter(d => d.orders > 0).length}/365` },
                  { label: 'Peak Day', value: `${stats.peakDay?.orders || 0} orders` },
                  { label: 'Avg Daily', value: `${(stats.totalActivity / 365).toFixed(1)} orders` },
                  { label: 'Last 7 Days', value: `${activityData.slice(-7).filter(d => d.orders > 0).length} active` }
                ].map((metric, index) => (
                  <div key={index} className="text-center p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-600">{metric.label}</p>
                    <p className="text-lg font-semibold text-gray-800">{metric.value}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <GitBranch className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 text-lg">No activity data available</p>
            </div>
          )}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-400 to-blue-600 rounded-xl">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              Revenue & Orders Trend {dateFilter === 'today' ? '(Today)' : `(${dateFilter === 'custom' ? 'Custom Range' : dateFilter.charAt(0).toUpperCase() + dateFilter.slice(1)})`}
            </h3>
            {revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={revenueData}>
                  <XAxis 
                    dataKey={dateFilter === 'today' ? 'time' : 'formattedDate'} 
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    interval={dateFilter === 'today' ? 1 : 'preserveStartEnd'}
                  />
                  <YAxis 
                    yAxisId="left"
                    orientation="left"
                    stroke="#3b82f6"
                    tickFormatter={(value) => `₹${value.toLocaleString()}`} 
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    stroke="#16a34a"
                    tickFormatter={(value) => value.toLocaleString()} 
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'revenue' ? `₹${value.toLocaleString()}` : value.toLocaleString(),
                      name.charAt(0).toUpperCase() + name.slice(1)
                    ]}
                    labelFormatter={(label) => dateFilter === 'today' ? `Hour: ${label}` : `Date: ${label}`}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                    }}
                  />
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#3b82f6" 
                    fill="url(#colorRevenue)" 
                    strokeWidth={3}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="orders" 
                    stroke="#16a34a" 
                    strokeWidth={3} 
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500 text-lg">No revenue data available</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-purple-400 to-purple-600 rounded-xl">
                <Package className="h-5 w-5 text-white" />
              </div>
              Sales by Category
            </h3>
            {stats.categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={stats.categoryData}
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    dataKey="value"
                    label={({name, percent}) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {stats.categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12">
                <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500 text-lg">No category data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Data Tables */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-xl">
                <Package className="h-5 w-5 text-white" />
              </div>
              Top Products
            </h3>
            <div className="overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-100">
                    <th className="py-4 px-2 text-left text-sm font-semibold text-gray-600">Product</th>
                    <th className="py-4 px-2 text-left text-sm font-semibold text-gray-600">Category</th>
                    <th className="py-4 px-2 text-center text-sm font-semibold text-gray-600">Sold</th>
                    <th className="py-4 px-2 text-right text-sm font-semibold text-gray-600">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.topProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors border-b border-gray-50">
                      <td className="py-4 px-2">
                        <div className="font-semibold text-gray-800">{product.name}</div>
                      </td>
                      <td className="py-4 px-2">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          {product.category}
                        </span>
                      </td>
                      <td className="py-4 px-2 text-center font-semibold text-gray-700">{product.quantity}</td>
                      <td className="py-4 px-2 text-right font-bold text-emerald-600">₹{product.revenue.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {stats.topProducts.length === 0 && (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500 text-lg">No product data available</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-orange-400 to-orange-600 rounded-xl">
                <Users className="h-5 w-5 text-white" />
              </div>
              Top Customers
            </h3>
            <div className="overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-100">
                    <th className="py-4 px-2 text-left text-sm font-semibold text-gray-600">Customer</th>
                    <th className="py-4 px-2 text-center text-sm font-semibold text-gray-600">Orders</th>
                    <th className="py-4 px-2 text-right text-sm font-semibold text-gray-600">Total Spent</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.topCustomers.map((customer) => (
                    <tr key={customer.email} className="hover:bg-gray-50 transition-colors border-b border-gray-50">
                      <td className="py-4 px-2">
                        <div className="font-semibold text-gray-800">{customer.name}</div>
                        <div className="text-sm text-gray-500">{customer.email}</div>
                      </td>
                      <td className="py-4 px-2 text-center">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                          {customer.totalOrders}
                        </span>
                      </td>
                      <td className="py-4 px-2 text-right font-bold text-emerald-600">₹{customer.totalSpent.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {stats.topCustomers.length === 0 && (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500 text-lg">No customer data available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-400 to-blue-600 rounded-xl">
                <ShoppingCart className="h-5 w-5 text-white" />
              </div>
              Recent Orders
            </h3>
            <div className="space-y-4">
              {stats.recentOrders.map((order) => (
                <div key={order.id} className="flex justify-between items-center p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl hover:from-blue-50 hover:to-blue-100 transition-all">
                  <div>
                    <div className="font-bold text-gray-800">#{String(order.id).slice(-8)}</div>
                    <div className="text-sm text-gray-600">{order.customerName || order.customer_name || 'Unknown'}</div>
                    <div className="text-xs text-gray-500">{order.formattedDate}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg text-emerald-600">₹{(order.totalAmount || order.total || order.amount || 0).toFixed(2)}</div>
                    <div className={`text-xs px-3 py-1 rounded-full font-medium ${
                      (order.status || '').toLowerCase() === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
                      (order.status || '').toLowerCase() === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      (order.status || '').toLowerCase() === 'processing' ? 'bg-blue-100 text-blue-800' :
                      (order.status || '').toLowerCase() === 'shipped' ? 'bg-purple-100 text-purple-800' :
                      (order.status || '').toLowerCase() === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {(order.status || 'Unknown').toUpperCase()}
                    </div>
                  </div>
                </div>
              ))}
              {stats.recentOrders.length === 0 && (
                <div className="text-center py-12">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500 text-lg">No recent orders</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-red-400 to-red-600 rounded-xl">
                <AlertCircle className="h-5 w-5 text-white" />
              </div>
              Low Stock Alert
            </h3>
            <div className="space-y-4">
              {stats.lowStockProducts.map((product) => {
                const stock = product.stockQuantity || product.stock || product.quantity || 0;
                const price = product.price || 0;
                return (
                  <div key={product.id} className="flex justify-between items-center p-4 bg-gradient-to-r from-gray-50 to-pink-50 rounded-xl border border-red-200">
                    <div>
                      <div className="font-semibold text-gray-800">{product.name || product.title || 'Unknown Product'}</div>
                      <div className="text-sm text-gray-600">{product.category || 'Uncategorized'}</div>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold text-lg ${
                        stock < 5 ? 'text-red-600' : 
                        stock < 10 ? 'text-orange-600' : 'text-yellow-600'
                      }`}>
                        {stock} left
                      </div>
                      <div className="text-sm text-gray-500">${price.toFixed(2)}</div>
                    </div>
                  </div>
                );
              })}
              {stats.lowStockProducts.length === 0 && (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 mx-auto mb-4 text-emerald-300" />
                  <p className="text-emerald-600 text-lg font-semibold">All products well stocked!</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-indigo-400 to-indigo-600 rounded-xl">
                <Activity className="h-5 w-5 text-white" />
              </div>
              Order Status
            </h3>
            {stats.statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={stats.statusData}>
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {stats.statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12">
                <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500 text-lg">No status data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Metrics Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl shadow-xl p-6 text-white">
            <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Users className="h-5 w-5" />
              Customer Insights
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-purple-100">Repeat Customers</span>
                <span className="font-bold text-xl">{stats.conversionMetrics.repeatCustomers}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-purple-100">Avg Orders/Customer</span>
                <span className="font-bold text-xl">{stats.conversionMetrics.avgOrdersPerCustomer.toFixed(1)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-purple-100">Customer LTV</span>
                <span className="font-bold text-xl">${stats.conversionMetrics.customerLifetimeValue.toFixed(0)}</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl shadow-xl p-6 text-white">
            <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Performance Metrics
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-emerald-100">Active Days</span>
                <span className="font-bold text-xl">{activityData.filter(d => d.orders > 0).length}/365</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-emerald-100">Best Day</span>
                <span className="font-bold text-xl">{stats.peakDay?.orders || 0} orders</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-emerald-100">Consistency</span>
                <span className="font-bold text-xl">
                  {((activityData.filter(d => d.orders > 0).length / 365) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl shadow-xl p-6 text-white">
            <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Data Overview
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-blue-100">Date Range</span>
                <span className="font-bold text-xl capitalize">{dateFilter}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-100">Total Records</span>
                <span className="font-bold text-xl">{filteredOrders.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-100">Last Updated</span>
                <span className="font-bold text-sm">{new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="text-center">
            <h3 className="text-xl font-bold text-gray-800 mb-2">Analytics Dashboard</h3>
            <p className="text-gray-600">Powered by real-time database integration</p>
            <div className="flex justify-center items-center gap-2 mt-4 text-sm text-gray-500">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span>Live data • Auto-refreshed from your database</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}