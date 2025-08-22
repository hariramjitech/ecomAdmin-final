import React, { useState } from "react";
import { Routes, Route, NavLink, useNavigate } from "react-router-dom";
import { 
  Package, 
  Plus, 
  ShoppingCart, 
  FileText, 
  BarChart3,
  Store,
  User,
  LogOut,
  ChevronUp,
  Users
} from "lucide-react";

// Import your actual components
import ProductList from "../components/ProductList.jsx";
import ProductForm from "../components/ProductForm.jsx";
import OrderList from "../components/OrderList.jsx";
import CreateOrder from "../components/CreateOrder.jsx";
import OrderDetails from "../components/OrderDetails.jsx";
import Analytics from "../components/Analytics.jsx";
import Profile from "../components/Profile.jsx";
import UserList from "../components/UserList.jsx";
import UserDetails from "../components/UserDetails.jsx";
import NotFound from "../components/NotFound.jsx";

const AdminDashboard = () => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navigate = useNavigate();
  
  const navItems = [
    { to: "/admin/products", icon: Package, label: "Products", end: true },
    { to: "/admin/products/new", icon: Plus, label: "Add Product" },
    { to: "/admin/orders", icon: ShoppingCart, label: "Orders" },
    { to: "/admin/orders/new", icon: FileText, label: "Create Order" },
    { to: "/admin/users", icon: Users, label: "Users" },
    { to: "/admin/analytics", icon: BarChart3, label: "Analytics" },
  ];

  // Get user info from localStorage or use defaults
  const user = {
    name: localStorage.getItem("userName") || "Admin User",
    email: localStorage.getItem("userEmail") || "admin@example.com",
    role: localStorage.getItem("userRole") || "ADMIN"
  };
const handleLogout = () => {
  localStorage.clear();
  console.log("After logout:", { ...localStorage }); // check what's left
  navigate("/login");
};
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex">
      {/* Sidebar Navigation - Fixed */}
      <div className="w-64 bg-white shadow-sm border-r border-gray-200 flex flex-col fixed h-full">
        {/* Header in Sidebar */}
        <div className="flex items-center space-x-3 p-4 border-b border-gray-200">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-md">
            <Store className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-sm font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-hidden">
          <div className="p-4 h-full flex flex-col">
            <ul className="space-y-2 flex-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) =>
                        `flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                          isActive
                            ? "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-r-4 border-blue-600 shadow-sm"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm"
                        }`
                      }
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        {/* Profile Section */}
        <div className="border-t border-gray-200 p-4 relative">
          <button 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center space-x-3 w-full px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors duration-200"
          >
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white font-bold text-sm">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-gray-700 truncate">{user.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user.role.toLowerCase()}</p>
            </div>
            <ChevronUp className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${showProfileMenu ? 'rotate-180' : ''}`} />
          </button>

          {showProfileMenu && (
            <div className="absolute bottom-full left-4 right-4 mb-2 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
              <div className="py-1" role="menu" aria-orientation="vertical">
                <button
                  onClick={() => {
                    navigate("/admin/profile");
                    setShowProfileMenu(false);
                  }}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                  role="menuitem"
                >
                  <User className="w-4 h-4 mr-3" />
                  Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left border-t border-gray-100"
                  role="menuitem"
                >
                  <LogOut className="w-4 h-4 mr-3" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 ml-64 min-h-screen">
        <div className="p-6">
          <Routes>
    
            <Route path="products" element={<ProductList />} />
            <Route path="products/new" element={<ProductForm />} />

            <Route path="orders">
              <Route index element={<OrderList />} />
              <Route path=":id" element={<OrderDetails />} />
              <Route path="new" element={<CreateOrder />} />
            </Route>

           
            <Route path="users">
              <Route index element={<UserList />} />
              <Route path=":id" element={<UserDetails />} />
            </Route>

            <Route path="analytics" element={<Analytics />} />


            <Route path="profile" element={<Profile />} />
              <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;


