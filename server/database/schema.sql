-- ============================================
-- Resrv: Event Ticket Booking Platform
-- PostgreSQL Database Schema
-- ============================================

-- 1. Users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Events
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    event_date TIMESTAMPTZ NOT NULL,
    total_seats INTEGER NOT NULL CHECK (total_seats > 0),
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Seats
CREATE TABLE seats (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES events(id),
    seat_number VARCHAR(10) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'available'
        CHECK (status IN ('available', 'held', 'booked')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (event_id, seat_number)
);

-- 4. Seat Holds
CREATE TABLE holds (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    seat_id INTEGER NOT NULL REFERENCES seats(id),
    expires_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'expired', 'cancelled', 'confirmed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. Bookings
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    seat_id INTEGER NOT NULL REFERENCES seats(id),
    hold_id INTEGER NOT NULL UNIQUE REFERENCES holds(id),
    status VARCHAR(20) NOT NULL DEFAULT 'confirmed'
        CHECK (status IN ('confirmed', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Prevent multiple confirmed bookings for the same seat.
-- Cancelled bookings do not conflict with this index.
CREATE UNIQUE INDEX unique_confirmed_booking_per_seat
ON bookings (seat_id)
WHERE status = 'confirmed';
