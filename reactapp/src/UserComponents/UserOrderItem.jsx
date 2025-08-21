import React from "react";
import { updateOrderStatus } from "../utils/api.js"; 

const UserOrderItem = ({ order, onCancel }) => {
  const handleCancel = () => {
    updateOrderStatus(order.id, "CANCELLED")
      .then(() => onCancel(order.id))
      .catch(err => console.error(err));
  };

  return (
    <li className="border p-2 rounded flex justify-between items-center">
      <div>
        <p>Order ID: {order.id}</p>
        <p>Product: {order.productName}</p>
        <p>Quantity: {order.quantity}</p>
        <p>Status: {order.status}</p>
      </div>
      {order.status !== "CANCELLED" && (
        <button onClick={handleCancel} className="bg-red-500 text-white px-3 py-1 rounded">
          Cancel
        </button>
      )}
    </li>
  );
};

export default UserOrderItem;
