import { Link } from "react-router-dom";
import { getEventImage } from "../utils/eventImage";

export default function EventCard({ event }) {
  const date = event.event_date ? new Date(event.event_date) : null;
  const isValidDate = date && !Number.isNaN(date.getTime());
  const imageUrl = getEventImage(event);

  const month = isValidDate
    ? date.toLocaleString("en-IN", { month: "short" }).toUpperCase()
    : "TBA";
  const day = isValidDate
    ? date.toLocaleString("en-IN", { day: "numeric" })
    : "—";
  const time = isValidDate
    ? date.toLocaleString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true })
    : "";

  return (
    <article className="group flex flex-col justify-between overflow-hidden rounded-xl border border-line bg-white shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-sage-border hover:shadow-lift">
      <div>
        {/* Event Photography Header */}
        <div className="relative h-52 w-full overflow-hidden bg-ivory">
          <img
            src={imageUrl}
            alt={event.name}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent opacity-80" />

          {/* Date Stamp Pill */}
          <div className="absolute left-3.5 top-3.5 flex flex-col items-center justify-center rounded-lg border border-white/40 bg-white/95 px-3 py-1.5 shadow-sm backdrop-blur-sm">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-sage-dark leading-tight">
              {month}
            </span>
            <span className="text-lg font-extrabold text-ink leading-tight font-display">
              {day}
            </span>
          </div>

          {/* Capacity Tag */}
          <div className="absolute right-3.5 top-3.5">
            <span className="rounded-full border border-white/20 bg-ink/75 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
              {event.total_seats ? `${event.total_seats} Total Seats` : "Open Seating"}
            </span>
          </div>

          {/* Time indicator overlay at bottom of photo */}
          {time && (
            <div className="absolute bottom-3 left-3.5 text-xs font-semibold text-white/90 drop-shadow">
              Starts at {time}
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6">
          <h3 className="font-display text-xl font-bold leading-snug text-ink transition-colors group-hover:text-sage-dark">
            {event.name}
          </h3>

          <p className="mt-2.5 line-clamp-2 text-sm leading-relaxed text-muted">
            {event.description ||
              "Join us for an extraordinary gathering. Seats are assigned in real-time."}
          </p>
        </div>
      </div>

      {/* Prominent View Event Action */}
      <div className="border-t border-line-subtle p-5 pt-4">
        <Link
          to={`/events/${event.id}`}
          className="button-primary w-full justify-between text-xs font-semibold !py-2.5 group-hover:bg-sage-dark"
        >
          <span>View Event & Select Seat</span>
          <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">
            →
          </span>
        </Link>
      </div>
    </article>
  );
}
