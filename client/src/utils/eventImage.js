// Curated high-resolution Unsplash photography matching Resrv's calm, cultural, and editorial aesthetic
const EVENT_IMAGES = {
  tech: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80",
  workshop: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1200&q=80",
  music: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=1200&q=80",
  jazz: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80",
  classical: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=1200&q=80",
  art: "https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=1200&q=80",
  theatre: "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=1200&q=80",
  gathering: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80",
  talk: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=1200&q=80",
};

const DEFAULT_POOL = [
  EVENT_IMAGES.gathering,
  EVENT_IMAGES.music,
  EVENT_IMAGES.workshop,
  EVENT_IMAGES.art,
  EVENT_IMAGES.theatre,
  EVENT_IMAGES.tech,
];

/**
 * Returns a high-quality, event-relevant image URL based on event name and description.
 */
export function getEventImage(event = {}) {
  const text = `${event.name || ""} ${event.description || ""}`.toLowerCase();

  if (text.includes("genai") || text.includes("ai") || text.includes("tech") || text.includes("code") || text.includes("dev")) {
    return EVENT_IMAGES.tech;
  }
  if (text.includes("workshop") || text.includes("masterclass") || text.includes("training") || text.includes("learn")) {
    return EVENT_IMAGES.workshop;
  }
  if (text.includes("jazz") || text.includes("blues")) {
    return EVENT_IMAGES.jazz;
  }
  if (text.includes("music") || text.includes("concert") || text.includes("gig") || text.includes("band") || text.includes("live")) {
    return EVENT_IMAGES.music;
  }
  if (text.includes("symphony") || text.includes("orchestra") || text.includes("opera") || text.includes("classical")) {
    return EVENT_IMAGES.classical;
  }
  if (text.includes("art") || text.includes("exhibit") || text.includes("gallery") || text.includes("design") || text.includes("photo")) {
    return EVENT_IMAGES.art;
  }
  if (text.includes("theatre") || text.includes("theater") || text.includes("drama") || text.includes("play") || text.includes("act")) {
    return EVENT_IMAGES.theatre;
  }
  if (text.includes("talk") || text.includes("conference") || text.includes("summit") || text.includes("keynote")) {
    return EVENT_IMAGES.talk;
  }

  // Consistent deterministic fallback using id
  const index = Math.abs(Number(event.id) || 0) % DEFAULT_POOL.length;
  return DEFAULT_POOL[index];
}
