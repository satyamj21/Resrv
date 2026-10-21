import { Link, NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

const navClass = ({ isActive }) =>
  `text-sm font-medium transition-colors ${
    isActive ? "text-ink font-semibold" : "text-muted hover:text-ink"
  }`;

export default function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    setOpen(false);
    navigate("/");
  }

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-ivory/95 backdrop-blur-sm">
      <div className="page-shell flex h-[72px] items-center justify-between">
        <Link
          to="/"
          className="font-display text-2xl font-extrabold tracking-[-0.04em] text-ink hover:opacity-90 transition"
        >
          Resrv<span className="text-sage">.</span>
        </Link>

        {/* Mobile menu toggle */}
        <button
          className="flex h-10 w-10 items-center justify-center rounded-md border border-line text-lg text-ink md:hidden hover:bg-white transition"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? "✕" : "☰"}
        </button>

        {/* Navigation links */}
        <nav
          className={`${
            open
              ? "absolute inset-x-0 top-[72px] z-30 flex flex-col gap-4 border-b border-line bg-ivory p-6 shadow-soft"
              : "hidden"
          } md:static md:flex md:flex-row md:items-center md:gap-7 md:border-0 md:bg-transparent md:p-0 md:shadow-none`}
        >
          <NavLink
            to="/"
            end
            className={navClass}
            onClick={() => setOpen(false)}
          >
            Discover Events
          </NavLink>

          {user && user.role !== "admin" && (
            <NavLink
              to="/my-bookings"
              className={navClass}
              onClick={() => setOpen(false)}
            >
              My Bookings
            </NavLink>
          )}

          {user && user.role === "admin" && (
            <NavLink
              to="/admin"
              className={navClass}
              onClick={() => setOpen(false)}
            >
              Admin Dashboard
            </NavLink>
          )}

          {/* User state / auth actions */}
          {user ? (
            <div className="flex items-center gap-3 border-t border-line pt-4 md:border-l md:border-t-0 md:pl-6 md:pt-0">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sage-light border border-sage-border text-xs font-bold text-sage-dark">
                  {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                </span>
                <span className="text-sm font-semibold text-ink">
                  {user.name}
                </span>
                {user.role === "admin" && (
                  <span className="rounded bg-ink px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                    Admin
                  </span>
                )}
              </div>
              <span className="text-muted/40 hidden md:inline">·</span>
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-muted hover:text-ink transition-colors cursor-pointer"
              >
                Log out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 border-t border-line pt-4 md:border-l md:border-t-0 md:pl-6 md:pt-0">
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="text-sm font-semibold text-ink hover:text-sage transition"
              >
                Log in
              </Link>
              <Link
                to="/register"
                onClick={() => setOpen(false)}
                className="button-primary text-xs !py-2 !px-3.5"
              >
                Sign up
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
