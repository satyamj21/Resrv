import { Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./components/AdminLayout";
import Events from "./pages/Events";
import EventDetails from "./pages/EventDetails";
import Login from "./pages/Login";
import Register from "./pages/Register";
import MyBookings from "./pages/MyBookings";
import AdminDashboard from "./pages/AdminDashboard";
import AdminCreateEvent from "./pages/AdminCreateEvent";
import AdminEditEvent from "./pages/AdminEditEvent";

function PublicLayout() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Events />} />
        <Route path="/events/:id" element={<EventDetails />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* User-only protected routes */}
        <Route element={<ProtectedRoute allowedRole="user" />}>
          <Route path="/my-bookings" element={<MyBookings />} />
        </Route>
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-ivory text-ink">
      <Routes>
        {/* Admin routes — own layout with admin navbar */}
        <Route element={<ProtectedRoute allowedRole="admin" />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/events/new" element={<AdminCreateEvent />} />
            <Route path="/admin/events/:id/edit" element={<AdminEditEvent />} />
          </Route>
        </Route>

        {/* All other routes — public layout with user navbar */}
        <Route path="/*" element={<PublicLayout />} />
      </Routes>
    </div>
  );
}
