CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE events(
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    event_date TIMESTAMPTZ NOT NULL,
    total_seats INTEGER CHECK(total_seats > 0) NOT NULL,
    created_by INTEGER REFERENCES users(id) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
)

SELECT * FROM events;
SELECT * FROM holds;
SELECT * FROM seats;
SELECT * FROM bookings;


CREATE TABLE seats (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES events(id) NOT NULL,
    seat_number VARCHAR(10) NOT NULL,
    status VARCHAR(20) DEFAULT 'available' NOT NULL
        CHECK (status IN ('available', 'held', 'booked')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (event_id, seat_number)
);

CREATE TABLE holds (
    id SERIAL PRIMARY KEY,

    user_id INTEGER NOT NULL REFERENCES users(id),
    seat_id INTEGER NOT NULL REFERENCES seats(id),

    expires_at TIMESTAMPTZ NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'expired', 'cancelled', 'confirmed')),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,

    user_id INTEGER NOT NULL REFERENCES users(id),
    seat_id INTEGER NOT NULL REFERENCES seats(id),
    hold_id INTEGER NOT NULL UNIQUE REFERENCES holds(id),

    status VARCHAR(20) NOT NULL DEFAULT 'confirmed'
        CHECK (status IN ('confirmed', 'cancelled')),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX unique_confirmed_booking_per_seat
ON bookings (seat_id)
WHERE status = 'confirmed';

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

UPDATE users
SET role = 'admin'
WHERE email = 'satyam.test@example.com';

SELECT id, event_id, seat_number, status
FROM seats
ORDER BY id;

SELECT id, status
FROM seats
WHERE id = 4;

SELECT
    b.id AS booking_id,
    b.status AS booking_status,
    b.seat_id,
    s.status AS seat_status
FROM bookings AS b
JOIN seats AS s ON s.id = b.seat_id
WHERE b.id = 1;

BEGIN;

DELETE FROM bookings
WHERE seat_id IN (
    SELECT id
    FROM seats
    WHERE event_id IN (SELECT id FROM events)
);

DELETE FROM holds
WHERE seat_id IN (
    SELECT id
    FROM seats
    WHERE event_id IN (SELECT id FROM events)
);

DELETE FROM seats
WHERE event_id IN (SELECT id FROM events);

DELETE FROM events;

COMMIT;

UPDATE users
SET role = 'admin'
WHERE email = 'satyam@gmail.com'
RETURNING id, name, email, role;

SELECT id, event_id, seat_number, status
FROM seats
WHERE id = 20;

SELECT id, user_id, seat_id, status, expires_at
FROM holds
WHERE seat_id = 20
  AND status = 'active'
  AND expires_at > NOW();