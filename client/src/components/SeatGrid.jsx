const labels = [
  { status: "available", label: "Available", class: "seat-available" },
  { status: "selected", label: "Selected", class: "seat-selected" },
  { status: "held", label: "Held", class: "seat-held" },
  { status: "booked", label: "Booked", class: "seat-booked" },
];

export default function SeatGrid({
  seats = [],
  selectedSeat,
  onSelect,
  disabled,
}) {
  if (!seats.length) {
    return (
      <div className="rounded-xl border border-line bg-white p-10 text-center text-sm text-muted">
        Seat mapping is not available for this event yet.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-line bg-white p-6 shadow-soft sm:p-8">
      {/* Legend */}
      <div className="mb-8 flex flex-wrap items-center justify-center gap-6 border-b border-line-subtle pb-6 text-xs font-medium text-muted">
        {labels.map((item) => (
          <div key={item.status} className="flex items-center gap-2">
            <span
              className={`inline-block h-4 w-4 rounded-[4px] border ${item.class}`}
            />
            <span>{item.label}</span>
          </div>
        ))}
      </div>

      {/* Stage visualizer */}
      <div className="mx-auto mb-10 max-w-sm">
        <div className="rounded-t-lg border-t-4 border-sage/60 bg-gradient-to-b from-sage/10 to-transparent py-2.5 text-center text-[11px] font-bold uppercase tracking-[0.2em] text-muted">
          Stage & Performance Area
        </div>
      </div>

      {/* Interactive Seat Chart */}
      <div className="grid grid-cols-5 gap-2.5 sm:grid-cols-8 md:grid-cols-10 justify-items-center">
        {seats.map((seat) => {
          const status = String(seat.status || "available").toLowerCase();
          const isSelected = String(selectedSeat?.id) === String(seat.id);
          const isAvailable = status === "available";

          return (
            <button
              key={seat.id}
              type="button"
              disabled={disabled || !isAvailable}
              onClick={() => onSelect(seat)}
              aria-label={`Seat ${seat.seat_number}, ${isSelected ? "selected" : status}`}
              className={`seat ${
                isSelected
                  ? "seat-selected"
                  : `seat-${status}`
              } ${
                !isAvailable ? "opacity-75 cursor-not-allowed" : "cursor-pointer"
              }`}
            >
              {seat.seat_number}
            </button>
          );
        })}
      </div>
    </div>
  );
}
