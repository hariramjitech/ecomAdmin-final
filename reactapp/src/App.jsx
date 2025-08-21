import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./auth/Login.jsx";
import Register from "./auth/Register.jsx";
import UserDashboard from "./Dashboard/UserDashboard.jsx";
import AdminDashboard from "./Dashboard/AdminDashboard.jsx";
import ProductList from "./components/ProductList.jsx";
import ProductForm from "./components/ProductForm.jsx";
import OrderList from "./components/OrderList.jsx";
import CreateOrder from "./components/CreateOrder.jsx";
import OrderDetails from "./components/OrderDetails.jsx";
import Analytics from "./components/Analytics.jsx";
import PrivateRoute from "./auth/PrivateRoute.jsx";
import Profile from "./components/Profile.jsx";

// User Components
import PlaceOrder from "./UserComponents/PlaceOrder.jsx";
import UserOrderItem from "./UserComponents/UserOrderItem.jsx";
import UserOrderList from "./UserComponents/UserOrderList.jsx";
import UserProductList from "./UserComponents/UserProductList.jsx";
import UserDetails from "./components/UserDetails.jsx";
import UserList from "./components/UserList.jsx";
import NotFound from "./components/NotFound.jsx";

const App = () => {
  return (
    <Routes>
    
      {/* Auth */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* User Dashboard */}
      <Route
        path="/user/*"
        element={
          <PrivateRoute role="USER">
            <UserDashboard />
          </PrivateRoute>
        }
      >
        <Route path="products" element={<UserProductList />} />
        <Route path="orders" element={<UserOrderList />} />
        <Route path="orders/:id" element={<UserOrderItem />} />
        <Route path="place-order" element={<PlaceOrder />} />
        <Route path="profile" element={<Profile />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* Admin Dashboard */}
      <Route
        path="/admin/*"
        element={
          <PrivateRoute role="ADMIN">
            <AdminDashboard />
          </PrivateRoute>
        }
      >
        <Route path="products" element={<ProductList />} />
        <Route path="products/new" element={<ProductForm />} />
        <Route path="products/:id/edit" element={<ProductForm />} />
        <Route path="orders" element={<OrderList />} />
        <Route path="orders/:id" element={<OrderDetails />} />
        <Route path="create-order" element={<CreateOrder />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="profile" element={<Profile />} />
        <Route path="users/:id" element={<UserDetails />} />
        <Route path="users" element={<UserList />} />
        
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
};

export default App;
