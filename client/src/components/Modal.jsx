import { useCallback, useEffect, useRef, useState } from "react";

export default function Modal({
  open,
  title,
  description,
  children,
  onClose,
  closeLabel = "Close dialog",
  destructive = false,
  busy = false,
}) {
  const dialogRef = useRef(null);
  const closeTimerRef = useRef(null);
  const [closing, setClosing] = useState(false);

  const requestClose = useCallback(() => {
    if (busy || closing) return;
    setClosing(true);
    closeTimerRef.current = window.setTimeout(onClose, 160);
  }, [busy, closing, onClose]);

  useEffect(() => {
    if (!open) {
      // Reset the exit state before a later opening.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setClosing(false);
      return undefined;
    }

    const previousActiveElement = document.activeElement;
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !busy) {
        requestClose();
      }

      if (event.key === "Tab" && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), select:not([disabled])',
        );
        if (!focusable.length) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    dialogRef.current?.querySelector("button:not([disabled])")?.focus();

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      previousActiveElement?.focus?.();
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
  }, [busy, open, requestClose]);

  if (!open) return null;

  return (
    <div
      className={`modal-backdrop ${closing ? "modal-backdrop-closing" : ""}`}
      role="presentation"
    >
      <div
        ref={dialogRef}
        className={`modal-panel ${closing ? "modal-panel-closing" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby={description ? "modal-description" : undefined}
      >
        <div className="flex items-start justify-between gap-5">
          <div>
            <div
              className={`modal-icon ${destructive ? "modal-icon-danger" : ""}`}
              aria-hidden="true"
            >
              {destructive ? "!" : "•"}
            </div>
            <h2
              id="modal-title"
              className="mt-4 font-display text-2xl font-extrabold tracking-tight text-ink"
            >
              {title}
            </h2>
            {description && (
              <p
                id="modal-description"
                className="mt-2 max-w-md text-sm leading-relaxed text-muted"
              >
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={requestClose}
            disabled={busy}
            className="modal-close"
            aria-label={closeLabel}
          >
            ×
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}
