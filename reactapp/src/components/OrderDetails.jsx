import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getOrder, updateOrderStatus, deleteOrder } from '../utils/api';
import {
  Package,
  Truck,
  CheckCircle,
  Trash2,
  ArrowLeft,
  Save,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  Clock,
  AlertCircle,
  FileText,
  RefreshCw,
  Printer,
  Send,
  X,
  ShoppingCart,
  CreditCard,
  Truck as TruckIcon,
  Archive,
  Settings
} from 'lucide-react';
import { jsPDF } from 'jspdf';

export default function OrderDetails({ orderId: propOrderId, onBack }) {
  const params = useParams();
  const navigate = useNavigate();
  const orderId = propOrderId ?? params.id;

  // State management
  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Helper: accept axios response or plain object
  const extractData = useCallback((resp) => {
    if (!resp) return resp;
    if (resp.data !== undefined) return resp.data;
    return resp;
  }, []);

  // Load order details
  const loadOrder = useCallback(async () => {
    if (!orderId) {
      setError('Order ID is required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');
      const resp = await getOrder(orderId);
      const data = extractData(resp);
      
      if (!data) {
        setError('Order not found');
        setOrder(null);
        return;
      }

      // Normalize order data
      const normalizedOrder = {
        ...data,
        orderItems: Array.isArray(data.orderItems) ? data.orderItems : [],
        totalAmount: parseFloat(data.totalAmount) || 0,
        user: data.user || {}
      };

      setOrder(normalizedOrder);
      setStatus(normalizedOrder.status || 'PENDING');
    } catch (err) {
      console.error('loadOrder error', err);
      setError('Failed to load order details. Please try again.');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [orderId, extractData]);

  // Initial load
  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  // Auto-clear messages
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 6000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Handle status update
  const handleSave = async () => {
    if (!orderId || status === order?.status) return;

    try {
      setSaving(true);
      await updateOrderStatus(orderId, status);
      setOrder((prev) => (prev ? { ...prev, status } : prev));
      setSuccessMessage(`Order status updated to ${status} successfully`);
    } catch (err) {
      console.error('updateOrderStatus error', err);
      setError('Failed to update order status. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Handle order deletion
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      return;
    }
    
    try {
      setSaving(true);
      await deleteOrder(orderId);
      setSuccessMessage('Order deleted successfully');
      setTimeout(() => {
        if (onBack) onBack();
        else navigate('/orders');
      }, 1500);
    } catch (err) {
      console.error('deleteOrder error', err);
      setError('Failed to delete order. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Handle back navigation
  const handleBack = useCallback(() => {
    if (onBack) onBack();
    else navigate('/admin/orders');
  }, [onBack, navigate]);

  // Get status badge styling
  const getStatusBadge = (orderStatus) => {
    const baseClasses = "px-4 py-2 rounded-full text-sm font-semibold uppercase tracking-wider";
    switch (orderStatus) {
      case 'PENDING':
        return `${baseClasses} bg-yellow-100 text-yellow-800 border border-yellow-200`;
      case 'SHIPPED':
        return `${baseClasses} bg-blue-100 text-blue-800 border border-blue-200`;
      case 'DELIVERED':
        return `${baseClasses} bg-green-100 text-green-800 border border-green-200`;
      case 'CANCELLED':
        return `${baseClasses} bg-red-100 text-red-800 border border-red-200`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 border border-gray-200`;
    }
  };

  // Calculate order totals
  const calculateTotals = useCallback((items) => {
    const subtotal = items.reduce((sum, item) => {
      const price = parseFloat(item.priceAtPurchase || item.price || 0);
      const quantity = parseInt(item.quantity || item.qty || 1);
      return sum + (price * quantity);
    }, 0);
    
    const tax = subtotal * 0.18;
    const shipping = subtotal > 500 ? 0 : 50;
    const total = subtotal + tax + shipping;

    return { subtotal, tax, shipping, total };
  }, []);

  // Generate and print invoice
  const handlePrint = () => {
    if (!order) return;

    const doc = new jsPDF();
    const items = order.orderItems || [];
    const totals = calculateTotals(items);

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Order #${order.id}`, 105, 30, { align: 'center' });
    doc.text(order.orderDate ? new Date(order.orderDate).toLocaleDateString('en-GB') : 'N/A', 105, 38, { align: 'center' });

    // Customer and Shipping Info
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Billed To:', 20, 50);
    doc.setFont('helvetica', 'normal');
    doc.text(order.customerName || 'N/A', 20, 58);
    doc.text(order.customerEmail || 'N/A', 20, 64);
    if (order.customerPhone) doc.text(order.customerPhone, 20, 70);

    doc.setFont('helvetica', 'bold');
    doc.text('Shipped To:', 120, 50);
    doc.setFont('helvetica', 'normal');
    doc.text(order.shippingAddress || 'N/A', 120, 58);
    if (order.trackingNumber) doc.text(`Tracking: ${order.trackingNumber}`, 120, 64);

    // Order Details
    doc.setFont('helvetica', 'bold');
    doc.text('Order Details', 20, 80);
    doc.setFont('helvetica', 'normal');
    doc.text(`Status: ${order.status}`, 20, 88);
    doc.text(`Payment: ${order.paymentStatus || 'N/A'} (${order.paymentMethod || 'N/A'})`, 20, 94);

    // Items Table
    let y = 110;
    doc.setFillColor(240, 240, 240);
    doc.rect(20, y - 8, 170, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text(['Product', 'ID', 'Qty', 'Unit Price', 'Total'], [20, 60, 90, 120, 160], y);
    doc.setFont('helvetica', 'normal');
    y += 8;

    items.forEach(item => {
      const prod = item.product || {};
      const price = parseFloat(item.priceAtPurchase || item.price || 0);
      const quantity = parseInt(item.quantity || 1);
      const total = price * quantity;
      doc.text([
        (prod.name || 'Product').substring(0, 20),
        prod.id || 'N/A',
        quantity.toString(),
        `₹${price.toFixed(2)}`,
        `₹${total.toFixed(2)}`
      ], [20, 60, 90, 120, 160], y);
      y += 8;
    });

    // Totals
    y += 8;
    doc.text(['Subtotal:', `₹${totals.subtotal.toFixed(2)}`], [120, 160], y);
    y += 8;
    doc.text(['Tax (18%):', `₹${totals.tax.toFixed(2)}`], [120, 160], y);
    y += 8;
    doc.text(['Shipping:', `₹${totals.shipping.toFixed(2)}`], [120, 160], y);
    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.text(['Total:', `₹${order.totalAmount.toFixed(2)}`], [120, 160], y);

    // Notes
    if (order.notes) {
      y += 16;
      doc.setFont('helvetica', 'bold');
      doc.text('Notes:', 20, y);
      doc.setFont('helvetica', 'normal');
      doc.text(order.notes, 20, y + 8, { maxWidth: 170 });
    }

    // Footer
    y = Math.max(y + 16, 260);
    doc.setFont('helvetica', 'bold');
    doc.text('Company Details', 20, y);
    doc.setFont('helvetica', 'normal');
    doc.text(['Your Company Name', 'Your Company Address', 'Your Company Email | Your Company Phone'], 20, y + 8);

    // Open print dialog
    doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');
    setSuccessMessage('Invoice opened for printing');
  };

  // Handle PDF export
  const handleExport = () => {
    if (!order) return;

    const doc = new jsPDF();
    const items = order.orderItems || [];
    const totals = calculateTotals(items);

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Order #${order.id}`, 105, 30, { align: 'center' });
    doc.text(order.orderDate ? new Date(order.orderDate).toLocaleDateString('en-GB') : 'N/A', 105, 38, { align: 'center' });

    // Customer and Shipping Info
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Billed To:', 20, 50);
    doc.setFont('helvetica', 'normal');
    doc.text(order.customerName || 'N/A', 20, 58);
    doc.text(order.customerEmail || 'N/A', 20, 64);
    if (order.customerPhone) doc.text(order.customerPhone, 20, 70);

    doc.setFont('helvetica', 'bold');
    doc.text('Shipped To:', 120, 50);
    doc.setFont('helvetica', 'normal');
    doc.text(order.shippingAddress || 'N/A', 120, 58);
    if (order.trackingNumber) doc.text(`Tracking: ${order.trackingNumber}`, 120, 64);

    // Order Details
    doc.setFont('helvetica', 'bold');
    doc.text('Order Details', 20, 80);
    doc.setFont('helvetica', 'normal');
    doc.text(`Status: ${order.status}`, 20, 88);
    doc.text(`Payment: ${order.paymentStatus || 'N/A'} (${order.paymentMethod || 'N/A'})`, 20, 94);

    // Items Table
    let y = 110;
    doc.setFillColor(240, 240, 240);
    doc.rect(20, y - 8, 170, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text(['Product', 'ID', 'Qty', 'Unit Price', 'Total'], [20, 60, 90, 120, 160], y);
    doc.setFont('helvetica', 'normal');
    y += 8;

    items.forEach(item => {
      const prod = item.product || {};
      const price = parseFloat(item.priceAtPurchase || item.price || 0);
      const quantity = parseInt(item.quantity || 1);
      const total = price * quantity;
      doc.text([
        (prod.name || 'Product').substring(0, 20),
        prod.id || 'N/A',
        quantity.toString(),
        `₹${price.toFixed(2)}`,
        `₹${total.toFixed(2)}`
      ], [20, 60, 90, 120, 160], y);
      y += 8;
    });

    // Totals
    y += 8;
    doc.text(['Subtotal:', `₹${totals.subtotal.toFixed(2)}`], [120, 160], y);
    y += 8;
    doc.text(['Tax (18%):', `₹${totals.tax.toFixed(2)}`], [120, 160], y);
    y += 8;
    doc.text(['Shipping:', `₹${totals.shipping.toFixed(2)}`], [120, 160], y);
    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.text(['Total:', `₹${order.totalAmount.toFixed(2)}`], [120, 160], y);

    // Notes
    if (order.notes) {
      y += 16;
      doc.setFont('helvetica', 'bold');
      doc.text('Notes:', 20, y);
      doc.setFont('helvetica', 'normal');
      doc.text(order.notes, 20, y + 8, { maxWidth: 170 });
    }

    // Footer
    y = Math.max(y + 16, 260);
    doc.setFont('helvetica', 'bold');
    doc.text('Company Details', 20, y);
    doc.setFont('helvetica', 'normal');
    doc.text(['Your Company Name', 'Your Company Address', 'Your Company Email | Your Company Phone'], 20, y + 8);

    doc.save(`order-${order.id}-invoice.pdf`);
    setSuccessMessage('Invoice exported as PDF');
  };

  // Quick status change handlers
  const handleQuickStatusChange = async (newStatus) => {
    if (newStatus === order?.status) return;
    setStatus(newStatus);
    
    try {
      setSaving(true);
      await updateOrderStatus(orderId, newStatus);
      setOrder((prev) => (prev ? { ...prev, status: newStatus } : prev));
      setSuccessMessage(`Order status updated to ${newStatus} successfully`);
    } catch (err) {
      console.error('Quick status update error', err);
      setError('Failed to update order status. Please try again.');
      setStatus(order?.status || '');
    } finally {
      setSaving(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-100">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-gray-700 text-lg font-medium">Loading order details...</p>
          <p className="text-gray-500 text-sm">Please wait while we fetch the information</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-100">
        <div className="max-w-3xl mx-auto pt-12 px-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Order Not Found</h3>
            <p className="text-red-600 mb-6">{error}</p>
            <div className="flex gap-4 justify-center">
              <button 
                onClick={handleBack}
                className="flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Orders
              </button>
              <button 
                onClick={loadOrder}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No order state
  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-100">
        <div className="max-w-3xl mx-auto pt-12 px-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Order Not Available</h3>
            <p className="text-gray-600 mb-6">The requested order could not be found.</p>
            <button 
              onClick={handleBack}
              className="flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors mx-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Orders
            </button>
          </div>
        </div>
      </div>
    );
  }

  const items = order.orderItems || [];
  const totals = calculateTotals(items);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-700" />
              </button>
              <Package className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Order Details</h1>
                <p className="text-gray-600">#{order.id}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={loadOrder}
                disabled={loading || saving}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Printer className="w-4 h-4" />
                Print Invoice
              </button>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <FileText className="w-4 h-4" />
                Export PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Messages */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-800 font-medium">{successMessage}</span>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-800 font-medium">{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Order #{order.id}</h2>
                  <div className="flex items-center gap-3">
                    <span className={getStatusBadge(order.status)}>{order.status}</span>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">
                        {order.orderDate ? new Date(order.orderDate).toLocaleDateString('en-GB', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : '—'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-green-600">₹{order.totalAmount.toFixed(2)}</p>
                  <p className="text-gray-600 text-sm">{items.length} items</p>
                </div>
              </div>

              {/* Customer and User Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-100">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-600" />
                    Customer & User Information
                  </h3>
                  <div className="space-y-3">
                    <div className="text-sm text-gray-500 font-medium">Customer Details</div>
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-900">{order.customerName || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">{order.customerEmail || 'N/A'}</span>
                    </div>
                    {order.customerPhone && (
                      <div className="flex items-center gap-3">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700">{order.customerPhone}</span>
                      </div>
                    )}
                    {order.user && Object.keys(order.user).length > 0 && (
                      <>
                        <div className="mt-4 text-sm text-gray-500 font-medium border-t border-gray-100 pt-3">User Details</div>
                        <div className="flex items-center gap-3">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-900">{order.user.name || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-700">{order.user.email || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Settings className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-700">Role: {order.user.role || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-700">
                            Last Login: {order.user.lastLogin ? new Date(order.user.lastLogin).toLocaleString('en-GB') : 'N/A'}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-green-600" />
                    Shipping Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                      <span className="text-gray-700">{order.shippingAddress || 'N/A'}</span>
                    </div>
                    {order.trackingNumber && (
                      <div className="flex items-center gap-3">
                        <TruckIcon className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700 font-mono text-sm">{order.trackingNumber}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              {(order.paymentStatus || order.paymentMethod) && (
                <div className="pt-6 border-t border-gray-100">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-purple-600" />
                    Payment Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {order.paymentStatus && (
                      <div className="flex items-center gap-3">
                        <span className="text-gray-600">Payment Status:</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${
                          order.paymentStatus === 'PAID' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {order.paymentStatus}
                        </span>
                      </div>
                    )}
                    {order.paymentMethod && (
                      <div className="flex items-center gap-3">
                        <span className="text-gray-600">Payment Method:</span>
                        <span className="font-medium text-gray-900">{order.paymentMethod}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Order Notes */}
              {order.notes && (
                <div className="pt-6 border-t border-gray-100">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-orange-600" />
                    Order Notes
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700">{order.notes}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-blue-600" />
                Order Items ({items.length})
              </h3>

              {items.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">Product</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-900">ID</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-900">Quantity</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-900">Unit Price</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-900">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, index) => {
                        const prod = item.product ?? {};
                        const price = parseFloat(item.priceAtPurchase ?? item.price ?? prod.price ?? 0);
                        const quantity = parseInt(item.quantity ?? item.qty ?? 1);
                        const total = price * quantity;

                        return (
                          <tr key={item.id ?? `item-${index}`} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-4 px-4">
                              <div>
                                <p className="font-medium text-gray-900">{prod.name ?? 'Product'}</p>
                                {prod.description && (
                                  <p className="text-sm text-gray-500">{prod.description}</p>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-4 text-center">
                              <span className="text-sm text-gray-600 font-mono">#{prod.id ?? 'N/A'}</span>
                            </td>
                            <td className="py-4 px-4 text-center">
                              <span className="font-medium">{quantity}</span>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <span className="font-medium">₹{price.toFixed(2)}</span>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <span className="font-semibold text-green-600">₹{total.toFixed(2)}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* Order Totals */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="max-w-md ml-auto space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Subtotal:</span>
                        <span className="font-medium">₹{totals.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Tax (18%):</span>
                        <span className="font-medium">₹{totals.tax.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Shipping:</span>
                        <span className="font-medium">₹{totals.shipping.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                        <span className="text-lg font-semibold text-gray-900">Total:</span>
                        <span className="text-xl font-bold text-green-600">₹{order.totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No items in this order.</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Actions & Status Management */}
          <div className="space-y-6">
            {/* Status Management */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Order Status
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label htmlFor="order-status" className="font-medium text-gray-700">
                    Current Status:
                  </label>
                  <span className={getStatusBadge(order.status)}>{order.status}</span>
                </div>

                <div className="space-y-3">
                  <label htmlFor="order-status" className="block font-medium text-gray-700">
                    Update Status:
                  </label>
                  <select
                    id="order-status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="SHIPPED">Shipped</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                  
                  <button 
                    onClick={handleSave} 
                    disabled={saving || status === order.status}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Update Status
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5 text-gray-600" />
                Quick Actions
              </h3>
              
              <div className="space-y-3">
                {order.status === 'PENDING' && (
                  <button
                    onClick={() => handleQuickStatusChange('SHIPPED')}
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                  >
                    <Truck className="w-4 h-4" />
                    Mark as Shipped
                  </button>
                )}

                {order.status === 'SHIPPED' && (
                  <button
                    onClick={() => handleQuickStatusChange('DELIVERED')}
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Mark as Delivered
                  </button>
                )}

                {(order.status === 'PENDING' || order.status === 'SHIPPED') && (
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to cancel this order?')) {
                        handleQuickStatusChange('CANCELLED');
                      }
                    }}
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                    Cancel Order
                  </button>
                )}

                <div className="pt-3 border-t border-gray-100">
                  <button
                    onClick={() => {
                      const subject = `Order Update - ${order.id}`;
                      const body = `Dear ${order.customerName},\n\nYour order ${order.id} status has been updated to: ${order.status}\n\nThank you for your business!`;
                      window.location.href = `mailto:${order.customerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                      setSuccessMessage('Email client opened');
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    Email Customer
                  </button>
                </div>

                <div className="pt-3 border-t border-red-100">
                  <button
                    onClick={handleDelete}
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Order
                  </button>
                </div>
              </div>
            </div>

            {/* Order Timeline/History */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-600" />
                Order Timeline
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-3 h-3 bg-blue-600 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium text-gray-900">Order Created</p>
                    <p className="text-sm text-gray-600">
                      {order.orderDate ? new Date(order.orderDate).toLocaleString('en-GB') : 'Unknown'}
                    </p>
                  </div>
                </div>

                {order.status === 'SHIPPED' && (
                  <div className="flex items-start gap-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium text-gray-900">Order Shipped</p>
                      <p className="text-sm text-gray-600">Currently in transit</p>
                    </div>
                  </div>
                )}

                {order.status === 'DELIVERED' && (
                  <>
                    <div className="flex items-start gap-3">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mt-2"></div>
                      <div>
                        <p className="font-medium text-gray-900">Order Shipped</p>
                        <p className="text-sm text-gray-600">Package sent to customer</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-3 h-3 bg-green-600 rounded-full mt-2"></div>
                      <div>
                        <p className="font-medium text-gray-900">Order Delivered</p>
                        <p className="text-sm text-gray-600">Successfully completed</p>
                      </div>
                    </div>
                  </>
                )}

                {order.status === 'CANCELLED' && (
                  <div className="flex items-start gap-3">
                    <div className="w-3 h-3 bg-red-600 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium text-gray-900">Order Cancelled</p>
                      <p className="text-sm text-gray-600">Order was cancelled</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Order Summary Card */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" />
                Order Summary
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Order ID:</span>
                  <span className="font-mono text-sm font-medium">#{order.id}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Items:</span>
                  <span className="font-medium">{items.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Status:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                    order.status === 'SHIPPED' ? 'bg-blue-100 text-blue-800' :
                    order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                    order.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {order.status}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-blue-200">
                  <span className="font-semibold text-gray-900">Total:</span>
                  <span className="text-xl font-bold text-green-600">₹{order.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Additional Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Archive className="w-5 h-5 text-gray-600" />
                Additional Actions
              </h3>
              
              <div className="space-y-3">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`Order #${order.id} - Status: ${order.status} - Total: ₹${order.totalAmount.toFixed(2)}`);
                    setSuccessMessage('Order details copied to clipboard');
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  Copy Order Info
                </button>

                {order.trackingNumber && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(order.trackingNumber);
                      setSuccessMessage('Tracking number copied to clipboard');
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <TruckIcon className="w-4 h-4" />
                    Copy Tracking #
                  </button>
                )}

                <button
                  onClick={handlePrint}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  Print Invoice
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Back to Orders Button */}
        <div className="mt-8 flex justify-center">
          <button 
            onClick={handleBack}
            className="flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Orders List
          </button>
        </div>
      </div>
    </div>
  );
}