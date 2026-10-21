import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import api from "../axios";
import Modal from "../components/Modal";
import { useToast } from "../components/ToastProvider";

export default function MyBookings() {
  const location = useLocation();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(location.state?.message || "");
  const [cancelling, setCancelling] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const { toast } = useToast();

  async function load() {
    const { data } = await api.get("/bookings/my-bookings");
    setBookings(data.bookings || []);
  }

  // Initial load
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    load()
      .catch((e) =>
        setError(e.response?.data?.message || "Could not load your bookings."),
      )
      .finally(() => setLoading(false));
  }, []);

  async function cancel() {
    if (!cancelTarget) return;
    const id = cancelTarget.booking_id;
    setCancelling(id);
    setError("");
    try {
      await api.patch(`/bookings/${id}`);
      setBookings((all) =>
        all.map((item) =>
          item.booking_id === id
            ? { ...item, booking_status: "cancelled" }
            : item,
        ),
      );
      setNotice("Booking cancelled successfully.");
      toast.success("Booking cancelled successfully.");
      setCancelTarget(null);
    } catch (e) {
      const message =
        e.response?.data?.message || "Could not cancel this booking.";
      setError(message);
      toast.error(message);
    } finally {
      setCancelling(null);
    }
  }

  return (
    <main className="page-shell pb-24">
      <section className="py-14 sm:py-20">
        <p className="eyebrow">Your Activity</p>
        <h1 className="mt-3 font-display text-4xl font-extrabold tracking-[-0.05em] text-ink sm:text-6xl">
          My Bookings<span className="text-sage">.</span>
        </h1>
        <p className="mt-2 text-base text-muted sm:text-lg">
          Everything you’ve reserved, all in one place.
        </p>
      </section>

      {/* Notifications */}
      {notice && (
        <div className="mb-6 flex items-center justify-between rounded-lg border border-sage-border bg-sage-light p-4 text-sm font-medium text-sage-dark">
          <p>{notice}</p>
          <button
            onClick={() => setNotice("")}
            className="text-sm font-bold text-sage-dark/70 hover:text-sage-dark cursor-pointer ml-3"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {/* Loading Skeletons */}
      {loading && (
        <div className="space-y-4">
          {[1, 2].map((n) => (
            <div
              key={n}
              className="rounded-xl border border-line bg-white p-6 shadow-soft flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="space-y-2.5">
                <div className="skeleton h-4 w-32" />
                <div className="skeleton h-6 w-48" />
                <div className="skeleton h-4 w-40" />
              </div>
              <div className="skeleton h-8 w-24 rounded-full" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && bookings.length === 0 && (
        <div className="rounded-xl border border-line bg-white p-14 text-center shadow-soft">
          <p className="font-display text-2xl font-bold text-ink">
            No bookings found
          </p>
          <p className="mt-2 text-sm text-muted">
            You haven't reserved tickets for any events yet.
          </p>
          <Link to="/" className="button-primary mt-6 inline-flex">
            Discover Events
          </Link>
        </div>
      )}

      {/* Bookings List */}
      {!loading && bookings.length > 0 && (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const isActive = booking.booking_status === "confirmed";
            const date = new Date(booking.event_date);
            return (
              <article
                key={booking.booking_id}
                className="flex flex-col justify-between gap-6 rounded-xl border border-line bg-white p-6 shadow-soft transition-all duration-150 hover:border-line sm:flex-row sm:items-center"
              >
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-sage-dark">
                    {date.toLocaleDateString("en-IN", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                  <h2 className="mt-1 font-display text-xl font-bold text-ink">
                    {booking.event_name}
                  </h2>
                  <p className="mt-1.5 text-xs text-muted">
                    Seat <span className="font-bold text-ink">{booking.seat_number}</span> · Booking #{booking.booking_id}
                  </p>
                </div>

                <div className="flex items-center gap-4 border-t border-line-subtle pt-4 sm:border-0 sm:pt-0">
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                      isActive
                        ? "border border-sage-border bg-sage-light text-sage-dark"
                        : "border border-neutral-200 bg-neutral-100 text-muted"
                    }`}
                  >
                    {booking.booking_status}
                  </span>

                  {isActive && (
                    <button
                      disabled={cancelling === booking.booking_id}
                      onClick={() => setCancelTarget(booking)}
                      className="button-secondary text-xs !py-1.5 !px-3 hover:border-red-300 hover:text-red-700"
                    >
                      {cancelling === booking.booking_id
                        ? "Cancelling…"
                        : "Cancel Booking"}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
      <Modal
        open={Boolean(cancelTarget)}
        title="Cancel this booking?"
        description={
          cancelTarget
            ? `Your reservation for ${cancelTarget.event_name}, seat ${cancelTarget.seat_number}, will be cancelled and the seat released.`
            : ""
        }
        destructive
        busy={Boolean(cancelling)}
        onClose={() => {
          if (!cancelling) setCancelTarget(null);
        }}
      >
        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={Boolean(cancelling)}
            onClick={() => setCancelTarget(null)}
            className="button-secondary"
          >
            Keep Booking
          </button>
          <button
            type="button"
            disabled={Boolean(cancelling)}
            onClick={cancel}
            className="button-primary !border-red-700 !bg-red-700 hover:!border-red-800 hover:!bg-red-800"
          >
            {cancelling ? "Cancelling…" : "Cancel Booking"}
          </button>
        </div>
      </Modal>
    </main>
  );
}
