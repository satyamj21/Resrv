import { Link, NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

const navClass = ({ isActive }) =>
  `text-sm font-medium transition-colors ${
    isActive ? "text-ink font-semibold" : "text-muted hover:text-ink"
  }`;

export default function AdminNavbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    setOpen(false);
    navigate("/login");
  }

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-ivory/95 backdrop-blur-sm">
      <div className="page-shell flex h-[72px] items-center justify-between">
        <Link
          to="/admin"
          className="flex items-center gap-2.5 font-display text-2xl font-extrabold tracking-[-0.04em] text-ink hover:opacity-90 transition"
        >
          <span>
            Resrv<span className="text-sage">.</span>
          </span>
          <span className="rounded bg-ink px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
            Admin
          </span>
        </Link>

        {/* Mobile menu toggle */}
        <button
          className="flex h-10 w-10 items-center justify-center rounded-md border border-line text-lg text-ink md:hidden hover:bg-white transition"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? "✕" : "☰"}
        </button>

        {/* Admin Navigation */}
        <nav
          className={`${
            open
              ? "absolute inset-x-0 top-[72px] z-30 flex flex-col gap-4 border-b border-line bg-ivory p-6 shadow-soft"
              : "hidden"
          } md:static md:flex md:flex-row md:items-center md:gap-7 md:border-0 md:bg-transparent md:p-0 md:shadow-none`}
        >
          <NavLink
            to="/admin"
            end
            className={navClass}
            onClick={() => {
              setOpen(false);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            Admin Dashboard
          </NavLink>

          <NavLink
            to="/admin"
            className={navClass}
            onClick={() => {
              setOpen(false);
              const el = document.getElementById("events");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Manage Events
          </NavLink>

          <NavLink
            to="/admin/events/new"
            className={navClass}
            onClick={() => setOpen(false)}
          >
            Create Event
          </NavLink>

          {/* Admin user chip & Logout */}
          <div className="flex items-center gap-3 border-t border-line pt-4 md:border-l md:border-t-0 md:pl-6 md:pt-0">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sage-light border border-sage-border text-xs font-bold text-sage-dark">
                {user?.name ? user.name.charAt(0).toUpperCase() : "A"}
              </span>
              <span className="text-sm font-semibold text-ink">
                {user?.name}
              </span>
            </div>
            <span className="text-muted/40 hidden md:inline">·</span>
            <button
              onClick={handleLogout}
              aria-label="Logout"
              className="text-sm font-medium text-muted hover:text-red-700 transition-colors cursor-pointer"
            >
              Logout
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}
