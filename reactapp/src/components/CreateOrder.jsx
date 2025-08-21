import React, { useState, useEffect } from 'react';
import { fetchProducts, createOrder, updateProduct } from '../utils/api';

const CreateOrder = () => {
  const [order, setOrder] = useState({
    customerName: '',
    customerEmail: '',
    shippingAddress: '',
    orderItems: []
  });
  
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '', type: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortBy, setSortBy] = useState('name-asc');
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    // Get userId from localStorage when component mounts
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      setUserId(parseInt(storedUserId, 10));
    } else {
      showMessage('❌ User not logged in. Please log in to create an order.', 'error');
    }
    
    loadProducts();
  }, []);

  useEffect(() => {
    applyFiltersAndSorting();
  }, [products, searchTerm, categoryFilter, sortBy]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await fetchProducts();
      setProducts(response.data);
      setFilteredProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
      showMessage('❌ Failed to load products', 'error');
      setProducts([]);
      setFilteredProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSorting = () => {
    let result = [...products];

    // Apply search filter
    if (searchTerm) {
      result = result.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply category filter
    if (categoryFilter) {
      result = result.filter(p => 
        p.category.toLowerCase().startsWith(categoryFilter.toLowerCase())
      );
    }

    // Apply sorting
    if (sortBy === 'name-asc') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'name-desc') {
      result.sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortBy === 'price-asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'stock-asc') {
      result.sort((a, b) => a.stockQuantity - b.stockQuantity);
    } else if (sortBy === 'stock-desc') {
      result.sort((a, b) => b.stockQuantity - a.stockQuantity);
    }

    setFilteredProducts(result);
  };

  const showMessage = (text, type, shouldNavigate = false) => {
    setAlert({ show: true, message: text, type });
    setTimeout(() => {
      setAlert({ show: false, message: '', type: '' });
    }, 3000);
  };

  const addItem = (product) => {
    if (!order.orderItems.find(item => item.productId === product.id)) {
      if (product.stockQuantity === 0) {
        showMessage('❌ Product is out of stock', 'error');
        return;
      }
      setOrder({
        ...order,
        orderItems: [...order.orderItems, { 
          productId: product.id, 
          quantity: 1
        }]
      });
      showMessage(`✅ ${product.name} added to order`, 'success');
    } else {
      showMessage('⚠️ Product already in order', 'warning');
    }
  };

  const updateQuantity = (productId, qty) => {
    const quantity = parseInt(qty);
    const product = products.find(p => p.id === productId);
    
    if (quantity < 1) {
      showMessage('❌ Quantity must be at least 1', 'error');
      return;
    }
    
    if (quantity > product.stockQuantity) {
      showMessage(`❌ Only ${product.stockQuantity} units available`, 'error');
      return;
    }
    
    setOrder({
      ...order,
      orderItems: order.orderItems.map(item =>
        item.productId === productId ? { ...item, quantity } : item
      )
    });
  };

  const removeItem = (productId) => {
    const product = products.find(p => p.id === productId);
    setOrder({
      ...order,
      orderItems: order.orderItems.filter(item => item.productId !== productId)
    });
    showMessage(`🗑️ ${product?.name} removed from order`, 'info');
  };

  const getTotalAmount = () => {
    return order.orderItems.reduce((total, item) => {
      const product = products.find(p => p.id === item.productId);
      return total + (product?.price || 0) * item.quantity;
    }, 0);
  };

  const getTotalItems = () => {
    return order.orderItems.reduce((total, item) => total + item.quantity, 0);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setSortBy('name-asc');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const updateProductStock = async (productId, quantityOrdered) => {
    try {
      const product = products.find(p => p.id === productId);
      if (product) {
        const updatedProduct = {
          ...product,
          stockQuantity: product.stockQuantity - quantityOrdered
        };
        await updateProduct(productId, updatedProduct);
      }
    } catch (error) {
      console.error(`Error updating stock for product ${productId}:`, error);
    }
  };

  const handleSubmit = async () => {
    // Check if user is logged in
    if (!userId) {
      showMessage("❌ Please log in to create an order", 'error');
      return;
    }

    if (order.orderItems.length === 0) {
      showMessage("❌ Please select at least one product", 'error');
      return;
    }

    if (!order.customerName.trim() || !order.customerEmail.trim() || !order.shippingAddress.trim()) {
      showMessage("❌ Please fill in all required fields", 'error');
      return;
    }

    try {
      setSubmitting(true);
      
      // Prepare order data for API - including userId from localStorage
      const orderData = {
        userId: userId, // Add userId from localStorage
        customerName: order.customerName.trim(),
        customerEmail: order.customerEmail.trim(),
        shippingAddress: order.shippingAddress.trim(),
        orderItems: order.orderItems,
        totalAmount: getTotalAmount(),
        status: 'PENDING'
      };

      console.log('Creating order with data:', orderData); // Debug log

      // Create the order
      await createOrder(orderData);
      
      // Update stock for each ordered product
      const stockUpdatePromises = order.orderItems.map(item => 
        updateProductStock(item.productId, item.quantity)
      );
      
      await Promise.all(stockUpdatePromises);
      
      showMessage("✅ Order created successfully and stock updated!", 'success');
      
      // Reset form after successful submission
      setTimeout(() => {
        setOrder({
          customerName: '',
          customerEmail: '',
          shippingAddress: '',
          orderItems: []
        });
        // Refresh products to show updated stock
        loadProducts();
      }, 2000);
    } catch (error) {
      console.error('Error creating order:', error);
      const errorMessage = error.response?.data?.message || 'Order creation failed. Please try again.';
      showMessage(`❌ ${errorMessage}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-gray-200 border-t-blue-600 rounded-full mx-auto mb-4 animate-spin"></div>
          <p className="text-gray-600 text-lg font-medium">Loading products...</p>
        </div>
      </div>
    );
  }

  // Show login message if no userId found
  if (!userId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-sm">
          <div className="text-6xl mb-4">🔐</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Login Required</h2>
          <p className="text-gray-600 mb-6">You need to be logged in to create an order.</p>
          <button 
            onClick={() => window.location.href = '/login'} // Adjust path as needed
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-3 focus:ring-blue-100"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Alert System */}
      {alert.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`bg-white rounded-lg shadow-2xl max-w-md w-full p-6 transform scale-100 transition-all duration-300 ${
            alert.type === 'success' ? 'border-l-4 border-green-500' :
            alert.type === 'error' ? 'border-l-4 border-red-500' :
            alert.type === 'warning' ? 'border-l-4 border-yellow-500' :
            'border-l-4 border-blue-500'
          }`}>
            <div className="flex justify-between items-start">
              <span className="text-gray-800 font-medium flex-1">{alert.message}</span>
              <button 
                className="text-gray-400 text-xl font-bold hover:text-gray-600 transition-colors ml-4 p-0 leading-none focus:outline-none focus:text-gray-600"
                onClick={() => setAlert({ show: false, message: '', type: '' })}
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1 leading-tight">Create New Order</h1>
              <p className="text-gray-600">Add products and customer details to create an order</p>
              {userId && (
                <p className="text-sm text-blue-600 mt-2">Creating order for User ID: {userId}</p>
              )}
            </div>
            <div className="flex gap-3">
              <div className="px-4 py-2 bg-blue-50 text-blue-800 rounded-full font-semibold text-sm">
                {getTotalItems()} items
              </div>
              <div className="px-4 py-2 bg-green-50 text-green-800 rounded-full font-semibold text-sm">
                {formatCurrency(getTotalAmount())}
              </div>
            </div>
          </div>
        </div>

        {/* Customer Information */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center mb-6">
            <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center mr-3">
              <span className="text-blue-600 font-bold text-sm">1</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Customer Information</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex flex-col">
              <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name *</label>
              <input
                type="text"
                value={order.customerName}
                onChange={e => setOrder({ ...order, customerName: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm transition-all duration-200 focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100 bg-white placeholder-gray-400"
                placeholder="Enter customer name"
                required
              />
            </div>
            <div className="flex flex-col">
              <label className="block text-sm font-medium text-gray-700 mb-2">Customer Email *</label>
              <input
                type="email"
                value={order.customerEmail}
                onChange={e => setOrder({ ...order, customerEmail: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm transition-all duration-200 focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100 bg-white placeholder-gray-400"
                placeholder="customer@example.com"
                required
              />
            </div>
            <div className="flex flex-col sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Shipping Address *</label>
              <textarea
                value={order.shippingAddress}
                onChange={e => setOrder({ ...order, shippingAddress: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm transition-all duration-200 focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100 bg-white resize-vertical placeholder-gray-400 font-sans"
                rows="3"
                placeholder="Enter complete shipping address"
                required
              />
            </div>
          </div>
        </div>

        {/* Product Selection */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center mb-6">
            <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center mr-3">
              <span className="text-blue-600 font-bold text-sm">2</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Select Products</h2>
          </div>
          
          {/* Filters */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white transition-all duration-200 focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100 placeholder-gray-400"
              />
              <input
                type="text"
                placeholder="Filter by category..."
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white transition-all duration-200 focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100 placeholder-gray-400"
              />
              <select 
                value={sortBy} 
                onChange={e => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white transition-all duration-200 focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100 cursor-pointer"
              >
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
                <option value="price-asc">Price (Low-High)</option>
                <option value="price-desc">Price (High-Low)</option>
                <option value="stock-asc">Stock (Low-High)</option>
                <option value="stock-desc">Stock (High-Low)</option>
              </select>
              <button 
                type="button" 
                onClick={clearFilters} 
                className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium cursor-pointer transition-colors duration-200 hover:bg-red-600 focus:outline-none focus:ring-3 focus:ring-red-100"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredProducts.length > 0 ? (
              filteredProducts.map(product => (
                <div key={product.id} className="border border-gray-200 rounded-lg p-6 bg-white transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{product.name}</h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2 leading-6 overflow-hidden" style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical'
                    }}>{product.description}</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="px-3 py-1 bg-green-50 text-green-800 rounded-full text-sm font-medium">
                        {formatCurrency(product.price)}
                      </span>
                      <span className="px-3 py-1 bg-blue-50 text-blue-800 rounded-full text-sm font-medium">
                        {product.category}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        product.stockQuantity === 0 
                          ? 'bg-red-50 text-red-800' 
                          : 'bg-gray-50 text-gray-700'
                      }`}>
                        {product.stockQuantity === 0 ? 'Out of Stock' : `${product.stockQuantity} in stock`}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    {product.stockQuantity > 0 ? (
                      <button 
                        type="button" 
                        onClick={() => addItem(product)}
                        disabled={order.orderItems.some(item => item.productId === product.id)}
                        className={`px-4 py-2 rounded-lg font-medium text-sm cursor-pointer transition-all duration-200 inline-flex items-center justify-center focus:outline-none focus:ring-3 ${
                          order.orderItems.some(item => item.productId === product.id)
                            ? 'bg-gray-100 text-gray-600 cursor-not-allowed focus:ring-gray-100'
                            : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md hover:-translate-y-px focus:ring-blue-100'
                        }`}
                      >
                        {order.orderItems.some(item => item.productId === product.id) ? 'Added ✓' : 'Add to Order'}
                      </button>
                    ) : (
                      <button type="button" className="px-4 py-2 bg-gray-100 text-gray-400 rounded-lg font-medium text-sm cursor-not-allowed" disabled>
                        Out of Stock
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <div className="text-6xl mb-4">📦</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-600 mb-4">
                  {products.length === 0 ? 'No products available in the database' : 'Try adjusting your search or filters'}
                </p>
                {products.length === 0 && (
                  <button 
                    onClick={loadProducts}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-3 focus:ring-blue-100"
                  >
                    Retry Loading
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center mb-6">
            <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center mr-3">
              <span className="text-blue-600 font-bold text-sm">3</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Order Summary ({order.orderItems.length} items)</h2>
          </div>
          
          {order.orderItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🛒</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No items selected yet</h3>
              <p className="text-gray-600">Add products from above to create your order</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {order.orderItems.map(item => {
                const product = products.find(p => p.id === item.productId);
                if (!product) return null;
                
                return (
                  <div key={item.productId} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">{product.name}</h4>
                        <p className="text-gray-600 text-sm mb-2">{product.description}</p>
                        <span className="text-green-600 font-medium">{formatCurrency(product.price)} each</span>
                      </div>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium text-gray-700">Qty:</label>
                          <input
                            type="number"
                            min="1"
                            max={product.stockQuantity}
                            value={item.quantity}
                            onChange={e => updateQuantity(item.productId, e.target.value)}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-center text-sm focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100 transition-all duration-200"
                          />
                          <span className="text-xs text-gray-600">max: {product.stockQuantity}</span>
                        </div>
                        <div className="font-semibold text-gray-900 ml-auto sm:ml-0">
                          {formatCurrency(product.price * item.quantity)}
                        </div>
                        <button 
                          type="button" 
                          onClick={() => removeItem(item.productId)}
                          className="px-3 py-1 bg-red-500 text-white rounded text-xs font-medium cursor-pointer transition-colors duration-200 hover:bg-red-600 focus:outline-none focus:ring-3 focus:ring-red-100"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              <div className="border-t-2 border-gray-200 pt-4 mt-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                  <span className="text-xl font-bold text-gray-900">Order Total:</span>
                  <span className="text-2xl font-bold text-green-600">{formatCurrency(getTotalAmount())}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="text-center">
          <button 
            onClick={handleSubmit}
            disabled={order.orderItems.length === 0 || submitting || !userId}
            className={`px-8 py-4 rounded-lg font-semibold text-lg cursor-pointer transition-all duration-200 inline-flex items-center justify-center min-w-[200px] focus:outline-none focus:ring-3 ${
              order.orderItems.length === 0 || submitting || !userId
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed focus:ring-gray-100'
                : 'bg-green-600 text-white hover:bg-green-700 hover:shadow-md hover:-translate-y-px focus:ring-green-100'
            }`}
          >
            {submitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Processing...
              </>
            ) : (
              `Place Order • ${formatCurrency(getTotalAmount())}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateOrder;