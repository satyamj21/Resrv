import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import api from "../axios";
import Modal from "../components/Modal";
import { useToast } from "../components/ToastProvider";

export default function AdminDashboard() {
  const location = useLocation();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(location.state?.message || "");
  const [deleting, setDeleting] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { toast } = useToast();

  function fetchEvents() {
    setLoading(true);
    setError("");
    api
      .get("/events")
      .then(({ data }) => setEvents(data.events || []))
      .catch((e) =>
        setError(e.response?.data?.message || "Could not load events."),
      )
      .finally(() => setLoading(false));
  }

  async function deleteEvent() {
    if (!deleteTarget) return;
    const event = deleteTarget;
    setDeleting(event.id);
    setError("");
    setNotice("");
    try {
      await api.delete(`/events/${event.id}`);
      setEvents((current) => current.filter((item) => item.id !== event.id));
      setNotice(`"${event.name}" was deleted successfully.`);
      toast.success(`"${event.name}" was deleted successfully.`);
      setDeleteTarget(null);
    } catch (err) {
      const message =
        err.response?.data?.message || "Could not delete event. Please try again.";
      setError(message);
      toast.error(message);
    } finally {
      setDeleting(null);
    }
  }

  // Initial synchronization
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    fetchEvents();
  }, []);

  return (
    <main className="page-shell pb-24">
      {/* Header */}
      <section className="flex flex-col gap-6 py-14 sm:flex-row sm:items-end sm:justify-between sm:py-20">
        <div>
          <p className="eyebrow">Administration</p>
          <h1 className="mt-3 font-display text-4xl font-extrabold tracking-[-0.05em] text-ink sm:text-6xl">
            Manage Events<span className="text-sage">.</span>
          </h1>
          <p className="mt-2 text-base text-muted sm:text-lg">
            Monitor ticketing, capacity, and publish new events to the catalogue.
          </p>
        </div>
        <Link
          to="/admin/events/new"
          className="button-primary shrink-0 self-start sm:self-auto"
        >
          + Create Event
        </Link>
      </section>

      {/* Success notice */}
      {notice && (
        <div className="mb-8 flex items-center justify-between rounded-lg border border-sage-border bg-sage-light p-4 text-sm font-medium text-sage-dark">
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

      {/* Stats summary widgets */}
      {!loading && !error && events.length > 0 && (
        <section className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-line bg-white p-6 shadow-soft">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">
              Total Events
            </p>
            <p className="mt-2 font-display text-3xl font-extrabold text-ink sm:text-4xl">
              {events.length}
            </p>
          </div>
          <div className="rounded-xl border border-line bg-white p-6 shadow-soft">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">
              Upcoming
            </p>
            <p className="mt-2 font-display text-3xl font-extrabold text-ink sm:text-4xl">
              {events.filter((e) => new Date(e.event_date) > new Date()).length}
            </p>
          </div>
          <div className="col-span-2 sm:col-span-1 rounded-xl border border-line bg-white p-6 shadow-soft">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">
              Total Seats
            </p>
            <p className="mt-2 font-display text-3xl font-extrabold text-ink sm:text-4xl">
              {events.reduce((sum, e) => sum + (e.total_seats || 0), 0)}
            </p>
          </div>
        </section>
      )}

      {/* Event list */}
      <section id="events" className="border-t border-line pt-10">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="eyebrow">Catalogue</p>
            <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              All Events
            </h2>
          </div>
          {!loading && !error && (
            <span className="rounded-full bg-ivory px-3 py-1 text-xs font-semibold text-muted border border-line">
              {events.length} {events.length === 1 ? "event" : "events"} recorded
            </span>
          )}
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="rounded-xl border border-line bg-white p-6 shadow-soft flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-2.5">
                  <div className="skeleton h-5 w-44" />
                  <div className="skeleton h-4 w-32" />
                  <div className="skeleton h-3 w-64" />
                </div>
                <div className="skeleton h-8 w-28 rounded-md" />
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-sm font-medium text-red-700">{error}</p>
            <button
              onClick={fetchEvents}
              className="button-secondary mt-4 text-xs font-semibold"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && events.length === 0 && (
          <div className="rounded-xl border border-line bg-white p-14 text-center shadow-soft">
            <p className="font-display text-2xl font-bold text-ink">
              No events found
            </p>
            <p className="mt-2 text-sm text-muted">
              Get started by creating your first event for attendees.
            </p>
            <Link
              to="/admin/events/new"
              className="button-primary mt-6 inline-flex"
            >
              + Create First Event
            </Link>
          </div>
        )}

        {/* Events list */}
        {!loading && !error && events.length > 0 && (
          <div className="space-y-4">
            {events.map((event) => {
              const date = event.event_date && new Date(event.event_date);
              const isNew =
                event.created_at &&
                Date.now() - new Date(event.created_at).getTime() <
                  24 * 60 * 60 * 1000;

              return (
                <article
                  key={event.id}
                  className="flex flex-col justify-between gap-5 rounded-xl border border-line bg-white p-6 shadow-soft transition-all duration-150 hover:border-sage-border sm:flex-row sm:items-center"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h3 className="font-display text-xl font-bold leading-tight text-ink">
                        {event.name}
                      </h3>
                      {isNew && (
                        <span className="inline-flex items-center rounded-full bg-sage-light border border-sage-border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sage-dark">
                          New
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 text-xs font-medium text-muted">
                      {date && !Number.isNaN(date.getTime())
                        ? date.toLocaleString("en-IN", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })
                        : "Date TBA"}
                      {event.total_seats ? ` · ${event.total_seats} Total Seats` : ""}
                    </p>
                    {event.description && (
                      <p className="mt-2 line-clamp-1 text-xs text-muted">
                        {event.description}
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2 self-start sm:self-auto">
                    <Link
                      to={`/events/${event.id}`}
                      className="button-secondary text-xs font-semibold"
                    >
                      View Details ↗
                    </Link>
                    <Link
                      to={`/admin/events/${event.id}/edit`}
                      className="button-secondary text-xs font-semibold"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      disabled={deleting === event.id}
                      onClick={() => setDeleteTarget(event)}
                      className="button-secondary text-xs font-semibold hover:border-red-300 hover:text-red-700"
                    >
                      {deleting === event.id ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
      <Modal
        open={Boolean(deleteTarget)}
        title="Delete this event?"
        description={
          deleteTarget
            ? `“${deleteTarget.name}” will be permanently removed. Events with existing bookings cannot be deleted.`
            : ""
        }
        destructive
        busy={Boolean(deleting)}
        onClose={() => {
          if (!deleting) setDeleteTarget(null);
        }}
      >
        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={Boolean(deleting)}
            onClick={() => setDeleteTarget(null)}
            className="button-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={Boolean(deleting)}
            onClick={deleteEvent}
            className="button-primary !border-red-700 !bg-red-700 hover:!border-red-800 hover:!bg-red-800"
          >
            {deleting ? "Deleting…" : "Delete Event"}
          </button>
        </div>
      </Modal>
    </main>
  );
}
