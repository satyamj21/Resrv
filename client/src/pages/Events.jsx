import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../axios";
import EventCard from "../components/EventCard";
import { getEventImage } from "../utils/eventImage";

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  function fetchEvents() {
    setLoading(true);
    setError("");
    api
      .get("/events")
      .then(({ data }) => setEvents(data.events || []))
      .catch((e) =>
        setError(
          e.response?.data?.message || "Could not load events. Please try again.",
        ),
      )
      .finally(() => setLoading(false));
  }

  // Initial synchronization
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    fetchEvents();
  }, []);

  // Display the most recently created events first
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      const timeA = new Date(a.created_at || 0).getTime();
      const timeB = new Date(b.created_at || 0).getTime();
      if (timeB !== timeA) return timeB - timeA;
      return Number(b.id || 0) - Number(a.id || 0);
    });
  }, [events]);

  // Filtered list based on search
  const filteredEvents = useMemo(() => {
    if (!search.trim()) return sortedEvents;
    const q = search.toLowerCase();
    return sortedEvents.filter(
      (ev) =>
        (ev.name && ev.name.toLowerCase().includes(q)) ||
        (ev.description && ev.description.toLowerCase().includes(q)),
    );
  }, [sortedEvents, search]);

  const featuredEvent = sortedEvents[0] || null;

  return (
    <main className="page-shell pb-28">
      {/* Refined Balanced Hero */}
      <section className="grid gap-12 py-12 sm:py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-sage-border bg-sage-light px-3.5 py-1 text-xs font-bold text-sage-dark">
            <span className="h-1.5 w-1.5 rounded-full bg-sage-dark animate-pulse" />
            <span>Curated Event Seating</span>
          </div>

          <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.08] tracking-[-0.05em] text-ink sm:text-6xl">
            A seat saved for what matters most<span className="text-sage">.</span>
          </h1>

          <p className="mt-4 max-w-lg text-base leading-relaxed text-muted sm:text-lg">
            Experience memorable talks, workshops, and concerts. Reserve your
            precise seat on our interactive live chart with zero guesswork.
          </p>

          {/* Hero CTAs */}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href="#catalogue"
              className="button-primary text-sm font-semibold !py-3 !px-6"
            >
              Browse Catalogue ↓
            </a>
            <div className="flex items-center gap-2 text-xs font-semibold text-muted">
              <span>✓ Instant hold</span>
              <span>·</span>
              <span>✓ Real-time seating</span>
            </div>
          </div>
        </div>

        {/* Hero Spotlight Preview Card */}
        <div>
          {loading ? (
            <div className="overflow-hidden rounded-2xl border border-line bg-white p-6 shadow-soft">
              <div className="skeleton h-56 w-full rounded-xl" />
              <div className="mt-5 space-y-3">
                <div className="skeleton h-4 w-28" />
                <div className="skeleton h-6 w-3/4" />
                <div className="skeleton h-4 w-full" />
              </div>
            </div>
          ) : featuredEvent ? (
            <div className="group relative overflow-hidden rounded-2xl border border-line bg-white shadow-lift transition hover:border-sage-border">
              <div className="relative h-60 w-full overflow-hidden bg-ivory">
                <img
                  src={getEventImage(featuredEvent)}
                  alt={featuredEvent.name}
                  className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/20 to-transparent" />
                <span className="absolute left-4 top-4 rounded-full border border-white/20 bg-ink/80 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
                  Spotlight Event
                </span>
                <span className="absolute right-4 top-4 rounded-full border border-white/20 bg-white/90 px-3 py-1 text-[11px] font-bold text-ink backdrop-blur-sm">
                  {featuredEvent.total_seats ? `${featuredEvent.total_seats} Total Seats` : "Open Seating"}
                </span>

                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-sage-border">
                    {featuredEvent.event_date
                      ? new Date(featuredEvent.event_date).toLocaleDateString("en-IN", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "Upcoming"}
                  </p>
                  <h2 className="mt-1 font-display text-2xl font-bold leading-tight text-white drop-shadow">
                    {featuredEvent.name}
                  </h2>
                </div>
              </div>

              <div className="p-6">
                <p className="line-clamp-2 text-sm leading-relaxed text-muted">
                  {featuredEvent.description ||
                    "Reserve your seat for this featured gathering. Choose your exact vantage point on our live seat map."}
                </p>

                <div className="mt-5 flex items-center justify-between border-t border-line-subtle pt-4">
                  <span className="text-xs font-semibold text-sage-dark">
                    Live Booking Open
                  </span>
                  <Link
                    to={`/events/${featuredEvent.id}`}
                    className="button-primary text-xs !py-2 !px-4"
                  >
                    Reserve This Event →
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-line bg-white p-8 text-center shadow-soft">
              <p className="font-display text-lg font-bold text-ink">
                Ready for upcoming events
              </p>
              <p className="mt-2 text-sm text-muted">
                Catalogue updates frequently with new performances.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Events Catalogue Section */}
      <section id="catalogue" className="border-t border-line pt-14">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">The Calendar</p>
            <h2 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              Upcoming Gatherings
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search filter input */}
            <div className="relative min-w-[220px]">
              <input
                type="text"
                placeholder="Search events…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field !py-2 !text-xs !bg-white"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted hover:text-ink"
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            {!loading && !error && (
              <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-muted border border-line shadow-xs">
                {filteredEvents.length} {filteredEvents.length === 1 ? "event" : "events"}
              </span>
            )}
          </div>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="overflow-hidden rounded-xl border border-line bg-white shadow-soft"
              >
                <div className="skeleton h-52 w-full" />
                <div className="p-6 space-y-3">
                  <div className="skeleton h-4 w-28" />
                  <div className="skeleton h-6 w-3/4" />
                  <div className="skeleton h-4 w-full" />
                  <div className="skeleton h-10 w-full rounded-md mt-4" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
            <p className="text-sm font-medium text-red-700">{error}</p>
            <button
              onClick={fetchEvents}
              className="button-secondary mt-4 text-xs font-semibold"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty Search Result */}
        {!loading && !error && filteredEvents.length === 0 && search && (
          <div className="rounded-xl border border-line bg-white p-12 text-center shadow-soft">
            <p className="font-display text-lg font-bold text-ink">
              No events found matching "{search}"
            </p>
            <button
              onClick={() => setSearch("")}
              className="button-secondary mt-4 text-xs"
            >
              Clear Filter
            </button>
          </div>
        )}

        {/* Empty Events Database */}
        {!loading && !error && events.length === 0 && (
          <div className="rounded-xl border border-line bg-white p-14 text-center shadow-soft">
            <p className="font-display text-xl font-bold text-ink">
              No events scheduled yet
            </p>
            <p className="mt-2 text-sm text-muted">
              Check back soon as new dates and performances are published.
            </p>
          </div>
        )}

        {/* Events Grid — Sorted Newest First, No Artificial Numbering */}
        {!loading && !error && filteredEvents.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>

      {/* Value Proposition / How It Works Strip */}
      <section className="mt-20 border-t border-line pt-14">
        <div className="text-center sm:text-left">
          <p className="eyebrow">The Resrv Standard</p>
          <h2 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Thoughtful ticketing from start to finish
          </h2>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          <div className="rounded-xl border border-line bg-white p-6 shadow-soft">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sage-light border border-sage-border text-sage-dark font-display font-bold">
              01
            </div>
            <h3 className="mt-4 font-display text-lg font-bold text-ink">
              Live Stage Seating
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Pick your exact vantage point. Available seats are indicated in green with immediate selection.
            </p>
          </div>

          <div className="rounded-xl border border-line bg-white p-6 shadow-soft">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sage-light border border-sage-border text-sage-dark font-display font-bold">
              02
            </div>
            <h3 className="mt-4 font-display text-lg font-bold text-ink">
              Guaranteed Hold
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              When you choose a seat, it is temporarily locked for you so no one else can claim it while you checkout.
            </p>
          </div>

          <div className="rounded-xl border border-line bg-white p-6 shadow-soft">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sage-light border border-sage-border text-sage-dark font-display font-bold">
              03
            </div>
            <h3 className="mt-4 font-display text-lg font-bold text-ink">
              Seamless Management
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Review your confirmed bookings, check seat assignments, and manage cancellations with a click.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
