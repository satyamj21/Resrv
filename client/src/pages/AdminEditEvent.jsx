import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../axios";
import { useToast } from "../components/ToastProvider";

function toDateTimeLocal(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const pad = (part) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function AdminEditEvent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    description: "",
    event_date: "",
    total_seats: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    api
      .get(`/events/${id}`)
      .then(({ data }) => {
        const event = data.event;
        setForm({
          name: event.name || "",
          description: event.description || "",
          event_date: toDateTimeLocal(event.event_date),
          total_seats: String(event.total_seats || ""),
        });
      })
      .catch((err) =>
        setError(err.response?.data?.message || "Could not load event."),
      )
      .finally(() => setLoading(false));
  }, [id]);

  function update(field, value) {
    setForm((previous) => ({ ...previous, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await api.put(`/events/${id}`, {
        name: form.name,
        description: form.description,
        event_date: form.event_date,
        total_seats: Number(form.total_seats),
      });
      navigate("/admin", {
        replace: true,
        state: { message: `"${form.name}" was updated successfully.` },
      });
      toast.success(`"${form.name}" was updated successfully.`);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Could not update event. Please verify all fields and try again.";
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="page-shell pb-24">
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
          Edit Event<span className="text-sage">.</span>
        </h1>
        <p className="mt-2 max-w-xl text-base text-muted sm:text-lg">
          Update event details and adjust the available seat capacity.
        </p>
      </section>

      {loading ? (
        <div className="mx-auto max-w-2xl rounded-xl border border-line bg-white p-10 shadow-soft">
          <div className="skeleton h-8 w-48" />
          <div className="mt-6 space-y-4">
            <div className="skeleton h-12 w-full" />
            <div className="skeleton h-28 w-full" />
            <div className="skeleton h-12 w-full" />
          </div>
        </div>
      ) : (
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
            <label className="block text-xs font-bold uppercase tracking-wider text-muted">
              Event Title <span className="text-red-500">*</span>
              <input
                required
                type="text"
                value={form.name}
                onChange={(event) => update("name", event.target.value)}
                className="input-field mt-1.5 font-normal"
              />
            </label>

            <label className="block text-xs font-bold uppercase tracking-wider text-muted">
              Event Description
              <textarea
                rows={4}
                value={form.description}
                onChange={(event) => update("description", event.target.value)}
                className="input-field mt-1.5 font-normal resize-y"
              />
            </label>

            <div className="grid gap-6 sm:grid-cols-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-muted">
                Date & Start Time <span className="text-red-500">*</span>
                <input
                  required
                  type="datetime-local"
                  value={form.event_date}
                  onChange={(event) => update("event_date", event.target.value)}
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
                  value={form.total_seats}
                  onChange={(event) => update("total_seats", event.target.value)}
                  className="input-field mt-1.5 font-normal"
                />
              </label>
            </div>
          </div>

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
              {submitting ? "Saving Changes…" : "Save Changes"}
            </button>
          </div>
        </form>
      )}
    </main>
  );
}
