import React, { useEffect, useState } from "react";
import { getUserById } from "../utils/api.js";

const UserOrderList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDetailsId, setShowDetailsId] = useState(null);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      setLoading(false);
      return;
    }

    getUserById(userId)
      .then((res) => {
        setOrders(res.data.orders || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleCancel = (id) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: "CANCELLED" } : o))
    );
  };

  const downloadInvoicePDF = (order) => {
    const printWindow = window.open('', '_blank');
    const invoiceHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Invoice ${order.id}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; padding: 20px; }
          .invoice-header { background: #2563eb; color: white; padding: 30px; text-align: center; margin-bottom: 20px; }
          .invoice-title { font-size: 32px; font-weight: bold; margin-bottom: 10px; }
          .order-info { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
          .info-section { background: #f9fafb; padding: 15px; border-radius: 8px; }
          .info-label { font-weight: bold; color: #6b7280; margin-bottom: 5px; }
          .status { padding: 8px 16px; border-radius: 20px; font-weight: bold; display: inline-block; }
          .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .items-table th, .items-table td { padding: 12px; border-bottom: 1px solid #ddd; text-align: left; }
          .items-table th { background: #f3f4f6; }
          .total { text-align: right; font-size: 24px; font-weight: bold; margin-top: 20px; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <div class="invoice-header">
          <h1 class="invoice-title">INVOICE</h1>
          <p>Order #${order.id}</p>
        </div>
        
        <div class="order-info">
          <div class="info-section">
            <div class="info-label">Order Date:</div>
            <div>${new Date(order.orderDate).toLocaleDateString()}</div>
          </div>
          <div class="info-section">
            <div class="info-label">Status:</div>
            <div><span class="status">${order.status}</span></div>
          </div>
          <div class="info-section">
            <div class="info-label">Customer:</div>
            <div>${order.customerName}</div>
            <div>${order.customerEmail}</div>
          </div>
          <div class="info-section">
            <div class="info-label">Shipping Address:</div>
            <div>${order.shippingAddress}</div>
          </div>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Description</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${order.orderItems?.map(item => `
              <tr>
                <td>${item.product?.name || 'N/A'}</td>
                <td>${item.product?.description || 'N/A'}</td>
                <td>${item.quantity}</td>
                <td>₹${item.priceAtPurchase?.toFixed(2) || '0.00'}</td>
                <td>₹${((item.priceAtPurchase || 0) * (item.quantity || 0)).toFixed(2)}</td>
              </tr>
            `).join('') || '<tr><td colspan="5">No items found</td></tr>'}
          </tbody>
        </table>

        <div class="total">
          Total Amount: ₹${order.totalAmount?.toFixed(2) || '0.00'}
        </div>

        <script>
          window.onload = function() {
            window.print();
            window.close();
          }
        </script>
      </body>
      </html>
    `;
    
    printWindow.document.write(invoiceHTML);
    printWindow.document.close();
  };

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-32 bg-gray-200 rounded mb-4"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">
        My Orders
      </h2>

      {orders.length > 0 ? (
        <div className="space-y-6">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow duration-200"
            >
              {/* Order Header */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                  <div>
                    <p className="text-sm text-gray-500">
                      Order #{order.id}
                    </p>
                    <p className="text-lg font-semibold">
                      Placed on:{" "}
                      {new Date(order.orderDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="mt-2 md:mt-0">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        order.status === "PENDING"
                          ? "bg-yellow-100 text-yellow-800"
                          : order.status === "PROCESSING"
                          ? "bg-blue-100 text-blue-800"
                          : order.status === "SHIPPED"
                          ? "bg-indigo-100 text-indigo-800"
                          : order.status === "DELIVERED"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>

                {/* Customer & Shipping Info */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <p>
                      <span className="font-medium">Customer:</span>{" "}
                      {order.customerName}
                    </p>
                    <p>
                      <span className="font-medium">Email:</span>{" "}
                      {order.customerEmail}
                    </p>
                  </div>
                  <div>
                    <p>
                      <span className="font-medium">Shipping Address:</span>{" "}
                      {order.shippingAddress}
                    </p>
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div className="p-4 flex flex-col md:flex-row md:items-center justify-between">
                <div className="text-lg font-semibold">
                  Total: ₹{order.totalAmount?.toFixed(2) || "0.00"}
                </div>
                <div className="flex space-x-2 mt-2 md:mt-0">
                  <button
                    onClick={() =>
                      setShowDetailsId(
                        showDetailsId === order.id ? null : order.id
                      )
                    }
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm"
                  >
                    {showDetailsId === order.id ? "Hide Details" : "View Details"}
                  </button>
                  <button
                    onClick={() => downloadInvoicePDF(order)}
                    className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-sm"
                  >
                    Download Invoice
                  </button>
                  {(order.status === "PENDING" ||
                    order.status === "PROCESSING") && (
                    <button
                      onClick={() => handleCancel(order.id)}
                      className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-sm"
                    >
                      Cancel Order
                    </button>
                  )}
                </div>
              </div>

              {/* Order Items */}
              {showDetailsId === order.id && (
                <div className="p-4 border-t border-gray-100 space-y-4 bg-gray-50">
                  {order.orderItems?.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm"
                    >
                      <div className="flex items-center space-x-4">
                        {item.product?.imageUrl && (
                          <img
                            src={item.product.imageUrl}
                            alt={item.product.name}
                            className="w-16 h-16 object-cover rounded-md border"
                          />
                        )}
                        <div>
                          <p className="font-medium">{item.product?.name}</p>
                          <p className="text-sm text-gray-500">
                            {item.product?.description}
                          </p>
                          <p className="text-sm text-gray-500">
                            Qty: {item.quantity} × ₹{item.priceAtPurchase}
                          </p>
                        </div>
                      </div>
                      <div className="font-semibold">
                        ₹{((item.priceAtPurchase || 0) * (item.quantity || 0)).toFixed(2)}
                      </div>
                    </div>
                  )) || (
                    <div className="text-center py-4 text-gray-500">
                      No items found for this order
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-100">
          <svg
            className="mx-auto h-16 w-16 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            No orders found
          </h3>
          <p className="mt-2 text-gray-500">
            No orders found for your account.
          </p>
        </div>
      )}
    </div>
  );
};

export default UserOrderList;