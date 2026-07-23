import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const roleLabel = {
  owner: "System Owner",
  second_owner: "Second Owner",
  salesman: "Salesman",
};

const linkClass = ({ isActive }) =>
  `px-3 py-2 rounded-lg text-sm font-semibold transition ${
    isActive ? "bg-teal-500 text-white" : "text-teal-600 hover:bg-teal-100"
  }`;

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-teal-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500 font-display text-lg font-bold text-white">K</div>
          <div>
            <p className="font-display text-base font-bold leading-tight text-ink">Kandy Bottle Distribution</p>
            <p className="text-xs text-teal-500">{roleLabel[user.role]}</p>
          </div>
        </div>

        <nav className="hidden items-center gap-1 md:flex">
          <NavLink to="/" end className={linkClass}>Dashboard</NavLink>
          {(user.role === "owner" || user.role === "second_owner" || user.canAddRoutesShops) && (
            <>
              <NavLink to="/stock" className={linkClass}>Stock</NavLink>
              <NavLink to="/routes-shops" className={linkClass}>Routes &amp; Shops</NavLink>
              <NavLink to="/expenses" className={linkClass}>Expenses</NavLink>
            </>
          )}
          {user.role === "owner" && <NavLink to="/users" className={linkClass}>Employees</NavLink>}
          {user.role === "salesman" && <NavLink to="/my-routes" className={linkClass}>My Routes</NavLink>}
          {(user.role === "salesman" || user.role === "owner" || user.role === "second_owner") && (
            <NavLink to="/inquiries" className={linkClass}>Inquiries</NavLink>
          )}
          <NavLink to="/history" className={linkClass}>History</NavLink>
        </nav>

        <div className="flex items-center gap-3">
          <span className="hidden text-sm font-medium text-ink sm:inline">{user.name}</span>
          <button onClick={handleLogout} className="btn-secondary !px-3 !py-1.5 text-xs">
            Log out
          </button>
        </div>
      </div>
      <nav className="flex gap-1 overflow-x-auto border-t border-teal-100 px-4 py-2 md:hidden">
        <NavLink to="/" end className={linkClass}>Dashboard</NavLink>
        {(user.role === "owner" || user.role === "second_owner" || user.canAddRoutesShops) && (
          <>
            <NavLink to="/stock" className={linkClass}>Stock</NavLink>
            <NavLink to="/routes-shops" className={linkClass}>Routes</NavLink>
            <NavLink to="/expenses" className={linkClass}>Expenses</NavLink>
          </>
        )}
        {user.role === "owner" && <NavLink to="/users" className={linkClass}>Employees</NavLink>}
        {user.role === "salesman" && <NavLink to="/my-routes" className={linkClass}>My Routes</NavLink>}
        {(user.role === "salesman" || user.role === "owner" || user.role === "second_owner") && (
          <NavLink to="/inquiries" className={linkClass}>Inquiries</NavLink>
        )}
        <NavLink to="/history" className={linkClass}>History</NavLink>
      </nav>
    </header>
  );
};

export default Navbar;
