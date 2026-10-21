import { pool } from "../db/pool.js";

const holdSeat = async (req, res) => {
  const { seatId } = req.body;
  const userId = req.user.id;

  if (typeof seatId !== "number" || !Number.isInteger(seatId) || seatId <= 0) {
    return res.status(400).json({
      success: false,
      message: "Seat ID must be a positive integer",
    });
  }

  let client;
  let transactionStarted = false;

  try {
    client = await pool.connect();
    await client.query("BEGIN");
    transactionStarted = true;

    const seatResult = await client.query(
      "SELECT * FROM seats WHERE id = $1 FOR UPDATE",
      [seatId],
    );

    if (seatResult.rows.length === 0) {
      const error = new Error("Seat not found");
      error.statusCode = 404;
      throw error;
    }

    const seat = seatResult.rows[0];

    if (seat.status !== "available") {
      const error = new Error("Seat is not available for booking");
      error.statusCode = 409;
      throw error;
    }

    await client.query("UPDATE seats SET status = 'held' WHERE id = $1", [
      seatId,
    ]);

    const result = await client.query(
      "INSERT INTO holds (user_id, seat_id, expires_at, status) VALUES ($1, $2, NOW() + INTERVAL '10 minutes', 'active') RETURNING *",
      [userId, seatId],
    );

    const hold = result.rows[0];

    await client.query("COMMIT");
    transactionStarted = false;

    return res.status(201).json({
      success: true,
      message: "Seat held successfully",
      holdId: hold.id,
    });
  } catch (error) {
    if (client && transactionStarted) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Transaction rollback failed:", rollbackError);
      }
    }

    console.error("Hold seat error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : "Failed to hold seat",
    });
  } finally {
    if (client) {
      client.release();
    }
  }
};

const confirmBooking = async (req, res) => {
  const { holdId } = req.body;
  const userId = req.user.id;

  if (!holdId) {
    return res.status(400).json({
      success: false,
      message: "Hold ID is required",
    });
  }

  if (typeof holdId !== "number" || !Number.isInteger(holdId) || holdId <= 0) {
    return res.status(400).json({
      success: false,
      message: "Hold ID must be a positive integer",
    });
  }

  let client;
  let transactionStarted = false;

  try {
    client = await pool.connect();

    await client.query("BEGIN");
    transactionStarted = true;

    const holdResult = await client.query(
      `SELECT *
       FROM holds
       WHERE id = $1 AND user_id = $2
       FOR UPDATE`,
      [holdId, userId],
    );

    const hold = holdResult.rows[0];

    if (!hold) {
      const error = new Error("Hold not found");
      error.statusCode = 404;
      throw error;
    }

    if (hold.status !== "active") {
      const error = new Error("Hold is not active");
      error.statusCode = 400;
      throw error;
    }

    const seatResult = await client.query(
      `SELECT *
       FROM seats
       WHERE id = $1
       FOR UPDATE`,
      [hold.seat_id],
    );

    const seat = seatResult.rows[0];

    if (!seat) {
      const error = new Error("Seat not found");
      error.statusCode = 404;
      throw error;
    }

    if (new Date(hold.expires_at) <= new Date()) {
      await client.query(
        `UPDATE holds
         SET status = 'expired'
         WHERE id = $1
           AND user_id = $2
           AND status = 'active'`,
        [holdId, userId],
      );

      await client.query(
        `UPDATE seats AS s
         SET status = 'available'
         WHERE s.id = $1
           AND s.status = 'held'
           AND NOT EXISTS (
             SELECT 1
             FROM holds AS h
             WHERE h.seat_id = s.id
               AND h.id <> $2
               AND h.status = 'active'
               AND h.expires_at > NOW()
           )`,
        [hold.seat_id, holdId],
      );

      await client.query("COMMIT");
      transactionStarted = false;

      return res.status(410).json({
        success: false,
        message: "Hold has expired. Please select the seat again.",
      });
    }

    if (seat.status !== "held") {
      const error = new Error("Seat is not held");
      error.statusCode = 409;
      throw error;
    }

    const seatUpdate = await client.query(
      `UPDATE seats
       SET status = 'booked'
       WHERE id = $1
         AND status = 'held'
       RETURNING id`,
      [hold.seat_id],
    );

    if (seatUpdate.rowCount === 0) {
      const error = new Error("Seat is no longer available");
      error.statusCode = 409;
      throw error;
    }

    const bookingResult = await client.query(
      `INSERT INTO bookings
         (user_id, seat_id, hold_id, status)
       VALUES ($1, $2, $3, 'confirmed')
       RETURNING id`,
      [userId, hold.seat_id, holdId],
    );

    const booking = bookingResult.rows[0];

    const holdUpdate = await client.query(
      `UPDATE holds
       SET status = 'confirmed'
       WHERE id = $1
         AND user_id = $2
         AND status = 'active'
         AND expires_at > NOW()
       RETURNING id`,
      [holdId, userId],
    );

    if (holdUpdate.rowCount === 0) {
      const error = new Error("Hold has expired or is no longer active");
      error.statusCode = 409;
      throw error;
    }

    await client.query("COMMIT");
    transactionStarted = false;

    return res.status(201).json({
      success: true,
      message: "Booking confirmed successfully",
      bookingId: booking.id,
    });
  } catch (error) {
    if (client && transactionStarted) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Transaction rollback failed:", rollbackError);
      }
    }

    console.error("Confirm booking error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : "Failed to confirm booking",
    });
  } finally {
    if (client) {
      client.release();
    }
  }
};

const getMyBookings = async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT
        b.id AS booking_id,
        b.status AS booking_status,
        b.created_at AS booked_at,
        s.seat_number,
        e.name AS event_name,
        e.event_date AS event_date
      FROM bookings AS b
      JOIN seats AS s ON b.seat_id = s.id
      JOIN events AS e ON s.event_id = e.id
      WHERE b.user_id = $1
      ORDER BY b.created_at DESC`,
      [userId],
    );

    return res.status(200).json({
      success: true,
      bookings: result.rows,
    });
  } catch (error) {
    console.error("Get my bookings error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch bookings",
    });
  }
};

const cancelBooking = async (req, res) => {
  const bookingId = Number(req.params.id);
  const userId = req.user.id;

  if (!Number.isInteger(bookingId) || bookingId <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid booking ID",
    });
  }

  let client;
  let transactionStarted = false;

  try {
    client = await pool.connect();

    await client.query("BEGIN");
    transactionStarted = true;

    const bookingResult = await client.query(
      `SELECT *
       FROM bookings
       WHERE id = $1 AND user_id = $2
       FOR UPDATE`,
      [bookingId, userId],
    );

    const booking = bookingResult.rows[0];

    if (!booking) {
      const error = new Error("Booking not found");
      error.statusCode = 404;
      throw error;
    }

    if (booking.status !== "confirmed") {
      const error = new Error("Booking cannot be cancelled");
      error.statusCode = 409;
      throw error;
    }

    const seatResult = await client.query(
      `SELECT *
       FROM seats
       WHERE id = $1
       FOR UPDATE`,
      [booking.seat_id],
    );

    const seat = seatResult.rows[0];

    if (!seat || seat.status !== "booked") {
      const error = new Error("Seat is not currently booked");
      error.statusCode = 409;
      throw error;
    }

    const seatUpdate = await client.query(
      `UPDATE seats
       SET status = 'available'
       WHERE id = $1
         AND status = 'booked'
       RETURNING id`,
      [booking.seat_id],
    );

    if (seatUpdate.rowCount === 0) {
      const error = new Error("Unable to release seat");
      error.statusCode = 409;
      throw error;
    }

    await client.query(
      `UPDATE bookings
       SET status = 'cancelled'
       WHERE id = $1
         AND user_id = $2
         AND status = 'confirmed'`,
      [bookingId, userId],
    );

    await client.query("COMMIT");
    transactionStarted = false;

    return res.status(200).json({
      success: true,
      message: "Booking cancelled successfully",
      bookingId: booking.id,
    });
  } catch (error) {
    if (client && transactionStarted) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Transaction rollback failed:", rollbackError);
      }
    }

    console.error("Cancel booking error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : "Failed to cancel booking",
    });
  } finally {
    if (client) {
      client.release();
    }
  }
};

export { holdSeat, confirmBooking, getMyBookings, cancelBooking };
