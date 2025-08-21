import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { fetchOrders, updateOrderStatus, deleteOrder } from "../utils/api";
import {
  Package,
  Truck,
  CheckCircle,
  Trash2,
  Search,
  Filter,
  Eye,
  Calendar,
  DollarSign,
  User,
  MapPin,
  Clock,
  RefreshCw,
  Download,
  Mail,
  Phone,
  AlertCircle,
  TrendingUp,
  ShoppingCart,
  X,
} from "lucide-react";

const OrderList = ({ onViewOrder }) => {
  // State management
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("ALL");
  const [amountFilter, setAmountFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("orderDate");
  const [sortOrder, setSortOrder] = useState("desc");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const ordersPerPage = 8;
  const navigate = useNavigate();

  // Helper functions
  const extractData = useCallback((resp) => {
    if (!resp) return resp;
    if (resp.data !== undefined) return resp.data;
    return resp;
  }, []);

  const normalizeOrders = useCallback(
    (raw) =>
      Array.isArray(raw)
        ? raw.map((o) => ({
            ...o,
            id: o.id || o._id || o.orderId,
            orderItems: Array.isArray(o.orderItems) ? o.orderItems : [],
            totalAmount: parseFloat(o.totalAmount) || 0,
            orderDate: o.orderDate || new Date().toISOString(),
          }))
        : [],
    []
  );

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetchOrders();
      const data = extractData(res);
      const normalizedData = normalizeOrders(data);
      setOrders(normalizedData);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError("Failed to load orders. Please check your connection and try again.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [extractData, normalizeOrders]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 6000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleUpdateStatus = async (e, id, status) => {
    if (e) e.stopPropagation();
    try {
      setActionLoading(true);
      await updateOrderStatus(id, status);
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === id ? { ...order, status } : order
        )
      );
      setSuccessMessage(`Order #${id} status updated to ${status}`);
      setTimeout(loadOrders, 1000);
    } catch (err) {
      console.error("Error updating order status:", err);
      setError("Failed to update order status. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteOrder = async (e, id) => {
    if (e) e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this order? This action cannot be undone.")) {
      try {
        setActionLoading(true);
        await deleteOrder(id);
        setOrders((prevOrders) => prevOrders.filter((order) => order.id !== id));
        setSuccessMessage(`Order #${id} deleted successfully`);
      } catch (err) {
        console.error("Error deleting order:", err);
        setError("Failed to delete order. Please try again.");
      } finally {
        setActionLoading(false);
      }
    }
  };

  const handleViewDetails = (e, id) => {
    if (e) e.stopPropagation();
    if (onViewOrder) onViewOrder(id);
    navigate(`/admin/orders/${id}`);
  };

  const filteredAndSortedOrders = useMemo(() => {
    let filtered = orders.filter((order) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        searchTerm === "" ||
        order.customerName?.toLowerCase().includes(searchLower) ||
        order.customerEmail?.toLowerCase().includes(searchLower) ||
        order.id?.toString().toLowerCase().includes(searchLower) ||
        order.shippingAddress?.toLowerCase().includes(searchLower) ||
        order.trackingNumber?.toLowerCase().includes(searchLower);

      const matchesStatus = statusFilter === "ALL" || order.status === statusFilter;

      const orderDate = new Date(order.orderDate);
      const now = new Date();
      let matchesDate = true;
      if (dateFilter === "TODAY") {
        matchesDate = orderDate.toDateString() === now.toDateString();
      } else if (dateFilter === "WEEK") {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        matchesDate = orderDate >= weekAgo;
      } else if (dateFilter === "MONTH") {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        matchesDate = orderDate >= monthAgo;
      }

      let matchesAmount = true;
      const amount = order.totalAmount;
      if (amountFilter === "LOW") {
        matchesAmount = amount < 500;
      } else if (amountFilter === "MEDIUM") {
        matchesAmount = amount >= 500 && amount < 1500;
      } else if (amountFilter === "HIGH") {
        matchesAmount = amount >= 1500;
      }

      return matchesSearch && matchesStatus && matchesDate && matchesAmount;
    });

    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === "orderDate") {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      } else if (sortBy === "totalAmount") {
        aValue = parseFloat(aValue) || 0;
        bValue = parseFloat(bValue) || 0;
      } else if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      return sortOrder === "asc"
        ? aValue < bValue
          ? -1
          : aValue > bValue
          ? 1
          : 0
        : aValue > bValue
        ? -1
        : aValue < bValue
        ? 1
        : 0;
    });

    return filtered;
  }, [orders, searchTerm, statusFilter, dateFilter, amountFilter, sortBy, sortOrder]);

  const totalPages = Math.ceil(filteredAndSortedOrders.length / ordersPerPage);
  const paginatedOrders = filteredAndSortedOrders.slice(
    (currentPage - 1) * ordersPerPage,
    currentPage * ordersPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, dateFilter, amountFilter]);

  const stats = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter((o) => o.status === "PENDING").length;
    const shipped = orders.filter((o) => o.status === "SHIPPED").length;
    const delivered = orders.filter((o) => o.status === "DELIVERED").length;
    const cancelled = orders.filter((o) => o.status === "CANCELLED").length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const averageOrderValue = total > 0 ? totalRevenue / total : 0;

    return { total, pending, shipped, delivered, cancelled, totalRevenue, averageOrderValue };
  }, [orders]);

  const handleExportOrders = useCallback(() => {
    const csvContent = [
      "Order ID,Customer Name,Email,Phone,Status,Total Amount,Order Date,Shipping Address,Items Count",
      ...filteredAndSortedOrders.map((order) =>
        [
          order.id,
          `"${order.customerName || ""}"`,
          order.customerEmail || "",
          order.customerPhone || "",
          order.status,
          order.totalAmount,
          new Date(order.orderDate).toLocaleDateString(),
          `"${order.shippingAddress || ""}"`,
          order.orderItems?.length || 0,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders-export-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    setSuccessMessage("Orders exported to CSV successfully");
  }, [filteredAndSortedOrders]);

  const getStatusBadge = (status) => {
    const baseClasses = "px-2 py-1 rounded-md text-xs font-medium uppercase tracking-wider";
    switch (status) {
      case "PENDING":
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case "SHIPPED":
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case "DELIVERED":
        return `${baseClasses} bg-green-100 text-green-800`;
      case "CANCELLED":
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-gray-600 text-lg font-medium">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (error && orders.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md p-6 bg-white rounded-lg shadow-sm">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Unable to Load Orders</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadOrders}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Order Management</h1>
                <p className="text-sm text-gray-600">Manage your e-commerce orders</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={loadOrders}
                disabled={loading || actionLoading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading || actionLoading ? "animate-spin" : ""}`} />
                Refresh
              </button>
              <button
                onClick={handleExportOrders}
                disabled={filteredAndSortedOrders.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Messages */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <span className="text-green-800 font-medium">{successMessage}</span>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <span className="text-red-800 font-medium">{error}</span>
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
              </div>
              <ShoppingCart className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Shipped</p>
                <p className="text-2xl font-bold text-blue-600">{stats.shipped}</p>
              </div>
              <Truck className="w-6 h-6 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Delivered</p>
                <p className="text-2xl font-bold text-green-600">{stats.delivered}</p>
              </div>
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Revenue</p>
                <p className="text-2xl font-bold text-green-600">₹{stats.totalRevenue.toFixed(2)}</p>
              </div>
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Order</p>
                <p className="text-2xl font-bold text-purple-600">₹{stats.averageOrderValue.toFixed(2)}</p>
              </div>
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg border border-gray-200 mb-6">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Search & Filters</h3>
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors text-sm"
              >
                <Filter className="w-4 h-4" />
                {showAdvancedFilters ? "Hide" : "Show"} Advanced
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search orders, customers, emails..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ALL">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="SHIPPED">Shipped</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
              </select>

              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split("-");
                  setSortBy(field);
                  setSortOrder(order);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="orderDate-desc">Newest First</option>
                <option value="orderDate-asc">Oldest First</option>
                <option value="totalAmount-desc">Highest Amount</option>
                <option value="totalAmount-asc">Lowest Amount</option>
                <option value="customerName-asc">Customer A-Z</option>
                <option value="customerName-desc">Customer Z-A</option>
              </select>
            </div>

            {showAdvancedFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 mt-4 border-t border-gray-200">
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="ALL">All Time</option>
                  <option value="TODAY">Today</option>
                  <option value="WEEK">This Week</option>
                  <option value="MONTH">This Month</option>
                </select>

                <select
                  value={amountFilter}
                  onChange={(e) => setAmountFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="ALL">All Amounts</option>
                  <option value="LOW">Under ₹500</option>
                  <option value="MEDIUM">₹500 - ₹1500</option>
                  <option value="HIGH">Above ₹1500</option>
                </select>

                <button
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("ALL");
                    setDateFilter("ALL");
                    setAmountFilter("ALL");
                    setSortBy("orderDate");
                    setSortOrder("desc");
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Orders Count */}
        {filteredAndSortedOrders.length > 0 && (
          <div className="mb-4 text-sm text-gray-600">
            Showing {(currentPage - 1) * ordersPerPage + 1} to{" "}
            {Math.min(currentPage * ordersPerPage, filteredAndSortedOrders.length)} of{" "}
            {filteredAndSortedOrders.length} orders
            {filteredAndSortedOrders.length !== orders.length && (
              <span className="text-blue-600"> (filtered from {orders.length} total)</span>
            )}
          </div>
        )}

        {/* Orders Grid */}
        {filteredAndSortedOrders.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              {orders.length === 0 ? "No orders yet" : "No orders match your filters"}
            </h3>
            <p className="text-gray-600 mb-4">
              {orders.length === 0
                ? "When you receive orders, they will appear here."
                : "Try adjusting your search criteria or clearing filters."}
            </p>
            {orders.length > 0 && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("ALL");
                  setDateFilter("ALL");
                  setAmountFilter("ALL");
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {paginatedOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                data-testid={`order-card-${order.id}`}
              >
                {/* Order Header */}
                <div className="p-4 border-b border-gray-100 bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">#{order.id}</h3>
                      <p className="text-xs text-gray-500">
                        {new Date(order.orderDate).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <span className={getStatusBadge(order.status)}>{order.status}</span>
                  </div>
                </div>

                {/* Order Content */}
                <div className="p-4">
                  {/* Customer Info */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-900 text-sm">{order.customerName}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600 text-xs">{order.customerEmail}</span>
                    </div>
                    {order.customerPhone && (
                      <div className="flex items-center gap-2 mb-1">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600 text-xs">{order.customerPhone}</span>
                      </div>
                    )}
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600 text-xs line-clamp-2 leading-relaxed">
                        {order.shippingAddress}
                      </span>
                    </div>
                  </div>

                  {/* Order Summary */}
                  <div className="border-t border-gray-100 pt-3 mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-lg font-bold text-green-600">₹{order.totalAmount.toFixed(2)}</span>
                      <span className="text-xs text-gray-500">{order.orderItems?.length || 0} items</span>
                    </div>

                    {order.orderItems?.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-gray-700 mb-1">Items:</p>
                        <div className="text-xs text-gray-600 space-y-0.5">
                          {order.orderItems.slice(0, 2).map((item, index) => (
                            <div key={item.id || index} className="truncate">
                              {item.product?.name || "Product"} × {item.quantity} (₹
                              {item.priceAtPurchase || item.price || 0})
                            </div>
                          ))}
                          {order.orderItems.length > 2 && (
                            <div className="text-gray-500 italic">+{order.orderItems.length - 2} more items</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => handleViewDetails(e, order.id)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-xs font-medium"
                        data-testid={`view-button-${order.id}`}
                      >
                        <Eye className="w-3 h-3" />
                        View Details
                      </button>
                      <button
                        onClick={(e) => handleDeleteOrder(e, order.id)}
                        disabled={actionLoading}
                        className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
                        title="Delete Order"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Status Action Buttons */}
                    <div className="flex gap-1 text-xs">
                      {order.status === "PENDING" && (
                        <>
                                                    <button
                            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                            onClick={(e) => handleUpdateStatus(e, order.id, "SHIPPED")}
                            disabled={actionLoading}
                          >
                            <Truck className="w-3 h-3" />
                            Ship
                          </button>
                          <button
                            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                            onClick={(e) => handleUpdateStatus(e, order.id, "CANCELLED")}
                            disabled={actionLoading}
                          >
                            <X className="w-3 h-3" />
                            Cancel
                          </button>
                        </>
                      )}
                      {order.status === "SHIPPED" && (
                        <>
                          <button
                            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                            onClick={(e) => handleUpdateStatus(e, order.id, "DELIVERED")}
                            disabled={actionLoading}
                          >
                            <CheckCircle className="w-3 h-3" />
                            Deliver
                          </button>
                          <button
                            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                            onClick={(e) => handleUpdateStatus(e, order.id, "CANCELLED")}
                            disabled={actionLoading}
                          >
                            <X className="w-3 h-3" />
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <button
              data-testid="page-prev"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              className="px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              Previous
            </button>

            <div className="flex gap-1">
              {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 7) {
                  pageNum = i + 1;
                } else if (currentPage <= 4) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 3) {
                  pageNum = totalPages - 6 + i;
                } else {
                  pageNum = currentPage - 3 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-2 rounded-md transition-colors text-sm ${
                      currentPage === pageNum
                        ? "bg-blue-600 text-white"
                        : "bg-white border border-gray-300 hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              data-testid="page-next"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              className="px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              Next
            </button>
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-4 text-center">
            <p className="text-gray-600 text-sm">
              Page {currentPage} of {totalPages}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderList;