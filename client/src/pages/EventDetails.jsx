import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import api from "../axios";
import SeatGrid from "../components/SeatGrid";
import { useAuth } from "../context/AuthContext";
import { getEventImage } from "../utils/eventImage";
import { useToast } from "../components/ToastProvider";

export default function EventDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [event, setEvent] = useState(null);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [hold, setHold] = useState(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const { toast } = useToast();

  const isAdmin = user?.role === "admin";

  async function load() {
    const { data } = await api.get(`/events/${id}`);
    const record = data.event ?? data.data?.event ?? data.data ?? data;
    setEvent(record);
  }

  // Initial load
  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => {
    load()
      .catch((e) =>
        setError(e.response?.data?.message || "Could not load event details."),
      )
      .finally(() => setLoading(false));
  }, [id]);

  async function holdSeat() {
    if (!user) {
      return navigate("/login", { state: { from: location.pathname } });
    }
    if (!selectedSeat) return;
    setWorking(true);
    setError("");
    try {
      const { data } = await api.post("/bookings/hold", {
        seatId: selectedSeat.id,
      });
      setHold({ id: data.holdId, seat: selectedSeat });
      setMessage("Seat held temporarily! Please confirm your booking to secure your ticket.");
      toast.success("Seat held for 10 minutes.");
      await load();
    } catch (e) {
      const message = e.response?.data?.message || "Could not hold seat.";
      setError(message);
      toast.error(message);
    } finally {
      setWorking(false);
    }
  }

  async function confirm() {
    setWorking(true);
    setError("");
    try {
      await api.post("/bookings/confirm", { holdId: hold.id });
      toast.success("Your booking was confirmed successfully!");
      navigate("/my-bookings", {
        state: { message: "Your booking was confirmed successfully!" },
      });
    } catch (e) {
      const message =
        e.response?.data?.message || "Could not confirm your booking.";
      setError(message);
      toast.error(message);
      setHold(null);
      await load().catch(() => {});
    } finally {
      setWorking(false);
    }
  }

  if (loading) {
    return (
      <main className="page-shell py-16">
        <div className="skeleton h-6 w-32 mb-8" />
        <div className="grid gap-10 md:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <div className="skeleton h-12 w-3/4" />
            <div className="skeleton h-6 w-1/2" />
            <div className="skeleton h-64 w-full rounded-xl mt-8" />
          </div>
          <div className="skeleton h-64 w-full rounded-xl" />
        </div>
      </main>
    );
  }

  if (!event) {
    return (
      <main className="page-shell py-20">
        <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center max-w-lg mx-auto">
          <p className="font-semibold text-red-700">{error || "Event not found."}</p>
          <Link
            to={isAdmin ? "/admin" : "/"}
            className="button-secondary mt-5 inline-flex text-xs"
          >
            ← {isAdmin ? "Return to Dashboard" : "Browse All Events"}
          </Link>
        </div>
      </main>
    );
  }

  const date = event.event_date && new Date(event.event_date);

  return (
    <main className="page-shell pb-24">
      {/* Breadcrumb back navigation */}
      <div className="py-6">
        <Link
          to={isAdmin ? "/admin" : "/"}
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted hover:text-ink transition-colors"
        >
          <span>←</span>
          <span>{isAdmin ? "Admin Dashboard" : "All Events"}</span>
        </Link>
      </div>

      {/* Event Photography Banner */}
      <div className="relative mb-8 h-56 sm:h-72 w-full overflow-hidden rounded-2xl border border-line bg-ivory shadow-soft">
        <img
          src={getEventImage(event)}
          alt={event.name}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/20 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 flex flex-wrap items-end justify-between gap-3 text-white">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-sage-border">
              {date && !Number.isNaN(date.getTime())
                ? date.toLocaleString("en-IN", { dateStyle: "full" })
                : "Upcoming Gathering"}
            </p>
            <h1 className="mt-1 font-display text-2xl sm:text-4xl font-extrabold tracking-tight drop-shadow">
              {event.name}
            </h1>
          </div>
          {event.total_seats && (
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-sm border border-white/30">
              {event.total_seats} Total Capacity
            </span>
          )}
        </div>
      </div>

      {/* Event Header Information */}
      <section className="grid gap-8 border-b border-line pb-12 md:grid-cols-[1.1fr_0.9fr] md:items-end">
        <div>
          <div className="flex items-center gap-3">
            <p className="eyebrow">Event Profile</p>
            {isAdmin && (
              <span className="rounded bg-ink px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                Admin Preview
              </span>
            )}
          </div>
          <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            About This Gathering
          </h2>
        </div>

        <div className="space-y-3">
          <p className="text-base font-semibold text-sage-dark sm:text-lg">
            {date && !Number.isNaN(date.getTime())
              ? date.toLocaleString("en-IN", {
                  dateStyle: "full",
                  timeStyle: "short",
                })
              : "Date to be announced"}
          </p>
          <p className="text-sm leading-relaxed text-muted sm:text-base">
            {event.description || "An experience worth showing up for."}
          </p>
          {event.total_seats && (
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">
              Capacity: {event.total_seats} Seats Total
            </p>
          )}
        </div>
      </section>

      {/* Main Body */}
      {isAdmin ? (
        <section className="pt-10">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="eyebrow">Live Seating Map</p>
              <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink">
                Current Availability
              </h2>
            </div>
            <span className="rounded-full bg-ivory px-3 py-1 text-xs font-medium text-muted border border-line">
              Read-only Admin Mode
            </span>
          </div>

          <SeatGrid
            seats={event.seats || []}
            selectedSeat={null}
            onSelect={() => {}}
            disabled
          />
        </section>
      ) : (
        <section className="grid gap-10 pt-10 lg:grid-cols-[1fr_320px]">
          <div>
            <div className="mb-6">
              <p className="eyebrow">Ticket Reservation</p>
              <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink">
                Select Your Seat
              </h2>
            </div>

            <SeatGrid
              seats={event.seats || []}
              selectedSeat={selectedSeat}
              onSelect={(seat) => {
                setSelectedSeat(seat);
                setHold(null);
                setMessage("");
                setError("");
              }}
              disabled={working || !!hold}
            />

            {/* Notification messages */}
            {message && (
              <div className="mt-6 rounded-lg border border-sage-border bg-sage-light p-4 text-sm font-medium text-sage-dark">
                {message}
              </div>
            )}

            {error && (
              <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                {error}
              </div>
            )}
          </div>

          {/* Checkout & Reservation Sidebar */}
          <aside className="h-fit rounded-xl border border-line bg-white p-6 shadow-soft">
            <p className="eyebrow">Your Selection</p>
            <h3 className="mt-2 font-display text-2xl font-bold text-ink">
              {selectedSeat ? `Seat ${selectedSeat.seat_number}` : "No seat chosen"}
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              {hold
                ? "Your seat is temporarily held for checkout. Confirm below to complete your order."
                : "Select any green available seat on the chart to begin your reservation."}
            </p>

            {hold ? (
              <button
                disabled={working}
                onClick={confirm}
                className="button-primary mt-6 w-full !py-3 text-sm font-semibold"
              >
                {working ? "Confirming Ticket…" : "Confirm Booking"}
              </button>
            ) : (
              <button
                disabled={!selectedSeat || working}
                onClick={holdSeat}
                className="button-primary mt-6 w-full !py-3 text-sm font-semibold"
              >
                {working
                  ? "Holding Seat…"
                  : user
                    ? "Hold This Seat"
                    : "Log in to Reserve"}
              </button>
            )}

            {!user && (
              <p className="mt-4 text-center text-xs text-muted">
                Requires a free Resrv account
              </p>
            )}
          </aside>
        </section>
      )}
    </main>
  );
}
