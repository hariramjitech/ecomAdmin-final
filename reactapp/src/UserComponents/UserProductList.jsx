import React, { useEffect, useState, useMemo } from "react";
import { fetchProducts } from "../utils/api.js";
import { Package, AlertCircle, Search, Filter, X } from "lucide-react";

const UserProductList = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortBy, setSortBy] = useState('name-asc');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchProducts()
      .then(res => {
        setProducts(res.data);
        setFilteredProducts(res.data);
        setLoading(false);
      })
      .catch(err => {
        setError("Failed to load products. Please try again later.");
        setLoading(false);
        console.error(err);
      });
  }, []);

  useEffect(() => {
    applyFiltersAndSorting();
  }, [products, searchTerm, categoryFilter, sortBy]);

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

  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setSortBy('name-asc');
  };

  const handleImageError = (e) => {
    e.target.style.display = 'none';
    e.target.nextSibling.style.display = 'flex';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const hasActiveFilters = searchTerm || categoryFilter || sortBy !== 'name-asc';

  return (
    <div className="container mx-auto p-6 bg-gray-50 min-h-screen">
      <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
        Explore Our Products
      </h2>

      {/* Filters Section */}
      {!loading && !error && products.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
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
      )}

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <div
              key={index}
              className="animate-pulse bg-white p-4 rounded-lg shadow-md"
            >
              <div className="h-48 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="flex flex-col items-center justify-center text-center text-red-500 text-lg font-medium py-8">
          <AlertCircle size={48} className="mb-4" />
          {error}
        </div>
      )}

      {!loading && !error && filteredProducts.length === 0 && (
        <div className="flex flex-col items-center justify-center text-center text-gray-500 text-lg font-medium py-8">
          <Package size={48} className="mb-4" />
          {hasActiveFilters ? (
            <>
              <p className="mb-2">No products match your filters</p>
              <button 
                onClick={clearFilters} 
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Clear Filters
              </button>
            </>
          ) : (
            <p>No products available at the moment.</p>
          )}
        </div>
      )}

      {!loading && !error && filteredProducts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map(product => (
            <div
              key={product.id}
              className="bg-white rounded-lg shadow-md overflow-hidden transform transition duration-300 hover:scale-105 hover:shadow-xl"
            >
              <div className="relative h-48 bg-gray-100">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-48 object-cover"
                    onError={handleImageError}
                  />
                ) : null}
                <div className={`absolute inset-0 flex items-center justify-center bg-gray-100 ${product.imageUrl ? 'hidden' : ''}`}>
                  <Package size={48} className="text-gray-400" />
                </div>
              </div>
              
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {product.name}
                </h3>
                <p className="text-gray-600 mb-2 text-sm line-clamp-2">
                  {product.description || "No description available"}
                </p>
                
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {product.category}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    product.stockQuantity === 0 ? 'bg-red-100 text-red-800' : 
                    product.stockQuantity <= 10 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {product.stockQuantity === 0 ? 'Out of Stock' : `${product.stockQuantity} in stock`}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <p className="text-xl font-bold text-indigo-600">
                    {formatCurrency(product.price)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserProductList;