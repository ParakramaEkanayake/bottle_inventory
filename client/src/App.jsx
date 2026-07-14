import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import StockManagement from "./pages/StockManagement";
import RoutesShops from "./pages/RoutesShops";
import Expenses from "./pages/Expenses";
import UsersManagement from "./pages/UsersManagement";
import MyRoutes from "./pages/MyRoutes";
import RouteDetail from "./pages/RouteDetail";
import ShopVisit from "./pages/ShopVisit";
import History from "./pages/History";
import Inquiry from "./pages/Inquiry";

function App() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route
            path="/stock"
            element={<ProtectedRoute allowedRoles={["owner", "second_owner"]}><StockManagement /></ProtectedRoute>}
          />
          <Route
            path="/routes-shops"
            element={<ProtectedRoute allowedRoles={["owner", "second_owner"]}><RoutesShops /></ProtectedRoute>}
          />
          <Route
            path="/expenses"
            element={<ProtectedRoute allowedRoles={["owner", "second_owner"]}><Expenses /></ProtectedRoute>}
          />
          <Route
            path="/users"
            element={<ProtectedRoute allowedRoles={["owner"]}><UsersManagement /></ProtectedRoute>}
          />
          <Route
            path="/my-routes"
            element={<ProtectedRoute allowedRoles={["salesman", "owner", "second_owner"]}><MyRoutes /></ProtectedRoute>}
          />
          <Route
            path="/my-routes/:routeId"
            element={<ProtectedRoute allowedRoles={["salesman", "owner", "second_owner"]}><RouteDetail /></ProtectedRoute>}
          />
          <Route
            path="/my-routes/:routeId/shop/:shopId"
            element={<ProtectedRoute allowedRoles={["salesman", "owner", "second_owner"]}><ShopVisit /></ProtectedRoute>}
          />
          <Route
            path="/inquiries"
            element={<ProtectedRoute allowedRoles={["salesman", "owner", "second_owner"]}><Inquiry /></ProtectedRoute>}
          />
          <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
