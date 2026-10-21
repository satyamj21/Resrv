import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../axios";
import { useToast } from "../components/ToastProvider";

export default function AdminCreateEvent() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    description: "",
    event_date: "",
    total_seats: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await api.post("/events", {
        name: form.name,
        description: form.description || undefined,
        event_date: form.event_date,
        total_seats: Number(form.total_seats),
      });

      navigate("/admin", {
        state: { message: `"${form.name}" was published successfully!` },
      });
      toast.success(`"${form.name}" was published successfully!`);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Could not create event. Please verify all fields and try again.";
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="page-shell pb-24">
      {/* Breadcrumb */}
      <div className="py-6">
        <Link
          to="/admin"
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted hover:text-ink transition-colors"
        >
          <span>←</span>
          <span>Admin Dashboard</span>
        </Link>
      </div>

      <section className="pb-8">
        <p className="eyebrow">Administration</p>
        <h1 className="mt-3 font-display text-4xl font-extrabold tracking-[-0.05em] text-ink sm:text-6xl">
          Create New Event<span className="text-sage">.</span>
        </h1>
        <p className="mt-2 max-w-xl text-base text-muted sm:text-lg">
          Add an upcoming performance or gathering to your catalogue. Once published, it will be immediately available for ticket reservations.
        </p>
      </section>

      <form
        onSubmit={submit}
        className="mx-auto max-w-2xl rounded-xl border border-line bg-white p-7 shadow-soft sm:p-10"
      >
        {error && (
          <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* Event Name */}
          <label className="block text-xs font-bold uppercase tracking-wider text-muted">
            Event Title <span className="text-red-500">*</span>
            <input
              required
              type="text"
              placeholder="e.g. Symphony Under the Stars"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              className="input-field mt-1.5 font-normal"
            />
          </label>

          {/* Description */}
          <label className="block text-xs font-bold uppercase tracking-wider text-muted">
            Event Description
            <textarea
              rows={4}
              placeholder="Provide event details, schedule highlights, and what attendees should expect…"
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              className="input-field mt-1.5 font-normal resize-y"
            />
          </label>

          {/* Date & Seats Grid */}
          <div className="grid gap-6 sm:grid-cols-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-muted">
              Date & Start Time <span className="text-red-500">*</span>
              <input
                required
                type="datetime-local"
                value={form.event_date}
                onChange={(e) => update("event_date", e.target.value)}
                className="input-field mt-1.5 font-normal"
              />
            </label>

            <label className="block text-xs font-bold uppercase tracking-wider text-muted">
              Seat Capacity <span className="text-red-500">*</span>
              <input
                required
                type="number"
                min="1"
                step="1"
                placeholder="e.g. 50"
                value={form.total_seats}
                onChange={(e) => update("total_seats", e.target.value)}
                className="input-field mt-1.5 font-normal"
              />
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-col-reverse gap-3 border-t border-line-subtle pt-6 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => navigate("/admin")}
            className="button-secondary text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="button-primary text-xs font-semibold"
          >
            {submitting ? "Publishing Event…" : "Publish Event"}
          </button>
        </div>
      </form>
    </main>
  );
}
