import React, { useEffect, useState, useMemo } from 'react';
import { Search, Filter, X, Edit3, Trash2, Save, XCircle, Package, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { fetchProducts, deleteProduct, updateProduct } from '../utils/api';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ show: false, message: '', type: '' });
  const [editData, setEditData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stockQuantity: '',
    imageUrl: ''
  });

  // Same filter states as CreateOrder
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortBy, setSortBy] = useState('name-asc');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    applyFiltersAndSorting();
  }, [products, searchTerm, categoryFilter, sortBy]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await fetchProducts();
      setProducts(res.data);
      setFilteredProducts(res.data);
    } catch (error) {
      console.error('Error loading products:', error);
      showMessage('❌ Failed to load products', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Exact same filtering logic as CreateOrder
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

  // Get unique categories for filter suggestions
  const categories = useMemo(() => {
    return [...new Set(products.map(p => p.category))];
  }, [products]);

  // Statistics
  const stats = useMemo(() => {
    const totalProducts = products.length;
    const inStock = products.filter(p => p.stockQuantity > 0).length;
    const outOfStock = products.filter(p => p.stockQuantity === 0).length;
    const lowStock = products.filter(p => p.stockQuantity > 0 && p.stockQuantity <= 10).length;
    const totalValue = products.reduce((sum, p) => sum + (p.price * p.stockQuantity), 0);

    return { totalProducts, inStock, outOfStock, lowStock, totalValue };
  }, [products]);

  const showMessage = (text, type) => {
    setAlert({ show: true, message: text, type });
    setTimeout(() => {
      setAlert({ show: false, message: '', type: '' });
    }, 3000);
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

  const handleDelete = async (id) => {
    const product = products.find(p => p.id === id);
    if (window.confirm(`Are you sure you want to delete "${product?.name}"?`)) {
      try {
        await deleteProduct(id);
        showMessage(`✅ ${product?.name} deleted successfully`, 'success');
        await loadProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
        showMessage('❌ Failed to delete product', 'error');
      }
    }
  };

  const startEdit = (product) => {
    setEditingId(product.id);
    setEditData({
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      stockQuantity: product.stockQuantity,
      imageUrl: product.imageUrl || ''
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({
      name: '',
      description: '',
      price: '',
      category: '',
      stockQuantity: '',
      imageUrl: ''
    });
  };

  const handleUpdate = async () => {
    if (!editData.name.trim() || !editData.description.trim() || !editData.category.trim()) {
      showMessage('❌ Please fill in all required fields', 'error');
      return;
    }

    if (editData.price <= 0) {
      showMessage('❌ Price must be greater than 0', 'error');
      return;
    }

    if (editData.stockQuantity < 0) {
      showMessage('❌ Stock quantity cannot be negative', 'error');
      return;
    }

    try {
      const updatedData = {
        ...editData,
        price: parseFloat(editData.price),
        stockQuantity: parseInt(editData.stockQuantity)
      };
      
      await updateProduct(editingId, updatedData);
      const product = products.find(p => p.id === editingId);
      showMessage(`✅ ${product?.name} updated successfully`, 'success');
      setEditingId(null);
      await loadProducts();
    } catch (error) {
      console.error('Error updating product:', error);
      showMessage('❌ Failed to update product', 'error');
    }
  };

  const hasActiveFilters = searchTerm || categoryFilter || sortBy !== 'name-asc';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alert System */}
      {alert.show && (
        <div className="fixed top-4 right-4 z-50 max-w-md">
          <div className={`flex items-center gap-3 p-4 rounded-lg shadow-lg border ${
            alert.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex-shrink-0">
              {alert.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            </div>
            <span className="text-sm font-medium flex-1">{alert.message}</span>
            <button 
              className="flex-shrink-0 text-gray-400 hover:text-gray-600"
              onClick={() => setAlert({ show: false, message: '', type: '' })}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Header with Statistics */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Package className="text-blue-600" size={24} />
              <h1 className="text-2xl font-bold text-gray-900">Product Inventory</h1>
            </div>
            <p className="text-gray-600">Manage your product catalog with ease</p>
          </div>
          
          {/* Statistics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2">
              <Package className="text-blue-600" size={16} />
              <div>
                <div className="text-xs text-blue-600 font-medium">Total</div>
                <div className="text-lg font-bold text-blue-900">{stats.totalProducts}</div>
              </div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
              <CheckCircle className="text-green-600" size={16} />
              <div>
                <div className="text-xs text-green-600 font-medium">In Stock</div>
                <div className="text-lg font-bold text-green-900">{stats.inStock}</div>
              </div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
              <AlertCircle className="text-red-600" size={16} />
              <div>
                <div className="text-xs text-red-600 font-medium">Out of Stock</div>
                <div className="text-lg font-bold text-red-900">{stats.outOfStock}</div>
              </div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center gap-2">
              <TrendingUp className="text-yellow-600" size={16} />
              <div>
                <div className="text-xs text-yellow-600 font-medium">Low Stock</div>
                <div className="text-lg font-bold text-yellow-900">{stats.lowStock}</div>
              </div>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 flex items-center gap-2">
              <TrendingUp className="text-purple-600" size={16} />
              <div>
                <div className="text-xs text-purple-600 font-medium">Total Value</div>
                <div className="text-lg font-bold text-purple-900">{formatCurrency(stats.totalValue)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <button 
            className="flex items-center gap-2 text-gray-700 hover:text-blue-600 font-medium"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={20} />
            <span>Filters & Search</span>
            <span className="text-sm">{showFilters ? '▲' : '▼'}</span>
            {hasActiveFilters && <div className="w-2 h-2 bg-red-500 rounded-full"></div>}
          </button>
          
          <div className="text-sm text-gray-600">
            Showing {filteredProducts.length} of {products.length} products
          </div>
        </div>
        
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {searchTerm && (
                <button 
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500"
                  onClick={() => setSearchTerm('')}
                >
                  <X size={16} />
                </button>
              )}
            </div>
            
            <div className="relative">
              <input
                type="text"
                placeholder="Filter by category..."
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                list="categories-list"
              />
              <datalist id="categories-list">
                {categories.map(category => (
                  <option key={category} value={category} />
                ))}
              </datalist>
              {categoryFilter && (
                <button 
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500"
                  onClick={() => setCategoryFilter('')}
                >
                  <X size={16} />
                </button>
              )}
            </div>
            
            <select 
              value={sortBy} 
              onChange={e => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="price-asc">Price (Low-High)</option>
              <option value="price-desc">Price (High-Low)</option>
              <option value="stock-asc">Stock (Low-High)</option>
              <option value="stock-desc">Stock (High-Low)</option>
            </select>
            
            {hasActiveFilters && (
              <button 
                type="button" 
                onClick={clearFilters} 
                className="flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
              >
                <X size={16} />
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Products ({filteredProducts.length})</h2>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <Package className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600 mb-4">
              {hasActiveFilters 
                ? "Try adjusting your search or filters" 
                : "Start by adding your first product"
              }
            </p>
            {hasActiveFilters && (
              <button 
                onClick={clearFilters} 
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map(product => (
                  <tr 
                    key={product.id} 
                    className={`hover:bg-gray-50 transition-colors ${editingId === product.id ? 'bg-blue-50' : ''}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === product.id ? (
                        <input 
                          value={editData.name} 
                          onChange={e => setEditData({ ...editData, name: e.target.value })} 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                          placeholder="Product name"
                          required
                        />
                      ) : (
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                      )}
                    </td>
                    
                    <td className="px-6 py-4">
                      {editingId === product.id ? (
                        <textarea 
                          value={editData.description} 
                          onChange={e => setEditData({ ...editData, description: e.target.value })} 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none" 
                          rows="2"
                          placeholder="Product description"
                          required
                        />
                      ) : (
                        <div className="text-sm text-gray-900 max-w-xs truncate">{product.description}</div>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === product.id ? (
                        <input 
                          type="number" 
                          value={editData.price} 
                          onChange={e => setEditData({ ...editData, price: e.target.value })} 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          required
                        />
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {formatCurrency(product.price)}
                        </span>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === product.id ? (
                        <input 
                          value={editData.category} 
                          onChange={e => setEditData({ ...editData, category: e.target.value })} 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Category"
                          list="edit-categories-list"
                          required
                        />
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {product.category}
                        </span>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === product.id ? (
                        <input 
                          type="number" 
                          value={editData.stockQuantity} 
                          onChange={e => setEditData({ ...editData, stockQuantity: e.target.value })} 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          min="0"
                          placeholder="0"
                          required
                        />
                      ) : (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          product.stockQuantity === 0 ? 'bg-red-100 text-red-800' : 
                          product.stockQuantity <= 10 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {product.stockQuantity === 0 ? 'Out of Stock' : product.stockQuantity}
                        </span>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === product.id ? (
                        <input 
                          value={editData.imageUrl} 
                          onChange={e => setEditData({ ...editData, imageUrl: e.target.value })} 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                          placeholder="Image URL (optional)"
                        />
                      ) : (
                        <div className="flex items-center">
                          {product.imageUrl ? (
                            <img 
                              src={product.imageUrl} 
                              alt={product.name} 
                              className="h-10 w-10 rounded-lg object-cover border border-gray-200"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div className={`h-10 w-10 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 ${product.imageUrl ? 'hidden' : ''}`}>
                            <Package size={16} />
                          </div>
                        </div>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {editingId === product.id ? (
                        <div className="flex gap-2">
                          <button 
                            onClick={handleUpdate} 
                            className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 transition-colors"
                          >
                            <Save size={14} />
                            Save
                          </button>
                          <button 
                            onClick={cancelEdit} 
                            className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <XCircle size={14} />
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => startEdit(product)} 
                            className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
                          >
                            <Edit3 size={14} />
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDelete(product.id)} 
                            className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Hidden datalist for edit mode categories */}
      <datalist id="edit-categories-list">
        {categories.map(category => (
          <option key={category} value={category} />
        ))}
      </datalist>
    </div>
  );
};

export default ProductList;