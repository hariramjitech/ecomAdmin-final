import React, { useState } from 'react';
import { createProduct } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';

const ProductForm = ({ onSave, onCancel }) => {
  const [product, setProduct] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stockQuantity: '',
    imageUrl: '',
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct({ ...product, [name]: value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formatted = {
        ...product,
        price: parseFloat(product.price) || 0,
        stockQuantity: parseInt(product.stockQuantity) || 0,
      };
      const response = await createProduct(formatted);
      if (onSave) onSave(response);
      navigate('/admin/products');
    } catch (err) {
      setError('Invalid product data. Please check your inputs.');
    }
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    navigate('/');
  };

  const fields = [
    { key: 'name', label: 'Product Name', type: 'text', required: true },
    { key: 'description', label: 'Description', type: 'text', required: true },
    { key: 'price', label: 'Price ($)', type: 'number', required: true },
    { key: 'category', label: 'Category', type: 'text', required: true },
    { key: 'stockQuantity', label: 'Stock Quantity', type: 'number', required: true },
    { key: 'imageUrl', label: 'Image URL', type: 'text', required: false },
  ];

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Add New Product</h2>
        <button
          onClick={handleCancel}
          className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md border border-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.map(({ key, label, type, required }) => (
          <div key={key} className="space-y-1">
            <label htmlFor={key} className="block text-sm font-medium text-gray-700">
              {label} {required && <span className="text-red-500">*</span>}
            </label>
            <input
              id={key}
              name={key}
              value={product[key]}
              onChange={handleChange}
              type={type}
              required={required}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              data-testid={`${key}-input`}
            />
          </div>
        ))}

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            data-testid="form-cancel"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            data-testid="form-save"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Product
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;