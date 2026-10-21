import { pool } from "../db/pool.js";

const validateEventInput = ({ name, description, event_date, total_seats }) => {
  if (!name || !event_date || total_seats === undefined) {
    return "Name, event date and total seats are required";
  }

  if (
    typeof total_seats !== "number" ||
    !Number.isInteger(total_seats) ||
    total_seats <= 0
  ) {
    return "Total seats must be a positive integer";
  }

  if (typeof name !== "string" || !name.trim()) {
    return "Event name is required";
  }

  if (name.trim().length > 150) {
    return "Event name must be 150 characters or fewer";
  }

  if (
    description !== undefined &&
    description !== null &&
    typeof description !== "string"
  ) {
    return "Description must be a string";
  }

  if (Number.isNaN(Date.parse(event_date))) {
    return "Invalid event date";
  }

  return null;
};

const createEvent = async (req, res) => {
  const { name, description, event_date, total_seats } = req.body;
  const validationError = validateEventInput({
    name,
    description,
    event_date,
    total_seats,
  });

  if (validationError) {
    return res.status(400).json({
      success: false,
      message: validationError,
    });
  }

  let client;
  let transactionStarted = false;

  try {
    client = await pool.connect();
    await client.query("BEGIN");
    transactionStarted = true;

    const insertEvent = await client.query(
      `INSERT INTO events
        (name, description, event_date, total_seats, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, description, event_date, total_seats`,
      [
        name.trim(),
        description?.trim() || null,
        event_date,
        total_seats,
        req.user.id,
      ],
    );

    const newEvent = insertEvent.rows[0];

    if (!newEvent) {
      throw new Error("Event creation failed");
    }

    await client.query(
      `INSERT INTO seats (event_id, seat_number)
       SELECT $1, generate_series(1, $2)::text`,
      [newEvent.id, total_seats],
    );

    await client.query("COMMIT");
    transactionStarted = false;

    return res.status(201).json({
      success: true,
      message: "Event and seats created successfully",
      event: newEvent,
    });
  } catch (error) {
    if (client && transactionStarted) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Transaction rollback failed:", rollbackError);
      }
    }

    console.error("Create event error:", error);

    return res.status(500).json({
      success: false,
      message: "Event creation failed",
    });
  } finally {
    if (client) {
      client.release();
    }
  }
};

const updateEvent = async (req, res) => {
  const eventId = Number(req.params.id);
  const { name, description, event_date, total_seats } = req.body;
  const validationError = validateEventInput({
    name,
    description,
    event_date,
    total_seats,
  });

  if (!Number.isInteger(eventId) || eventId <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid event ID",
    });
  }

  if (validationError) {
    return res.status(400).json({
      success: false,
      message: validationError,
    });
  }

  let client;
  let transactionStarted = false;

  try {
    client = await pool.connect();
    await client.query("BEGIN");
    transactionStarted = true;

    const eventResult = await client.query(
      "SELECT id FROM events WHERE id = $1 FOR UPDATE",
      [eventId],
    );

    if (eventResult.rows.length === 0) {
      const error = new Error("Event not found");
      error.statusCode = 404;
      throw error;
    }

    const seatResult = await client.query(
      `SELECT id, seat_number, status
       FROM seats
       WHERE event_id = $1
       ORDER BY seat_number::integer
       FOR UPDATE`,
      [eventId],
    );
    const seats = seatResult.rows;
    const bookedSeatCount = seats.filter((seat) => seat.status === "booked").length;
    const removedSeats = seats.filter(
      (seat) => Number(seat.seat_number) > total_seats,
    );
    const protectedRemovedSeats = removedSeats.filter((seat) =>
      ["booked", "held"].includes(seat.status),
    );

    if (total_seats < bookedSeatCount) {
      const error = new Error(
        `Seat capacity cannot be reduced below ${bookedSeatCount} booked seat(s)`,
      );
      error.statusCode = 409;
      throw error;
    }

    if (protectedRemovedSeats.length > 0) {
      const hasBookedSeat = protectedRemovedSeats.some(
        (seat) => seat.status === "booked",
      );
      const error = new Error(
        hasBookedSeat
          ? "Seat capacity cannot be reduced because booked seats would be removed"
          : "Seat capacity cannot be reduced while affected seats have active holds",
      );
      error.statusCode = 409;
      throw error;
    }

    await client.query(
      `UPDATE events
       SET name = $1, description = $2, event_date = $3, total_seats = $4
       WHERE id = $5`,
      [name.trim(), description?.trim() || null, event_date, total_seats, eventId],
    );

    if (total_seats > seats.length) {
      await client.query(
        `INSERT INTO seats (event_id, seat_number)
         SELECT $1, generate_series($2, $3)::text`,
        [eventId, seats.length + 1, total_seats],
      );
    } else if (total_seats < seats.length) {
      await client.query(
        `DELETE FROM seats
         WHERE event_id = $1
           AND seat_number::integer > $2
           AND status = 'available'`,
        [eventId, total_seats],
      );
    }

    const updatedEvent = await client.query(
      `SELECT id, name, description, event_date, total_seats, created_at
       FROM events
       WHERE id = $1`,
      [eventId],
    );

    await client.query("COMMIT");
    transactionStarted = false;

    return res.status(200).json({
      success: true,
      message: "Event updated successfully",
      event: updatedEvent.rows[0],
    });
  } catch (error) {
    if (client && transactionStarted) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Transaction rollback failed:", rollbackError);
      }
    }

    console.error("Update event error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : "Event update failed",
    });
  } finally {
    if (client) {
      client.release();
    }
  }
};

const deleteEvent = async (req, res) => {
  const eventId = Number(req.params.id);

  if (!Number.isInteger(eventId) || eventId <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid event ID",
    });
  }

  let client;
  let transactionStarted = false;

  try {
    client = await pool.connect();
    await client.query("BEGIN");
    transactionStarted = true;

    const eventResult = await client.query(
      "SELECT id FROM events WHERE id = $1 FOR UPDATE",
      [eventId],
    );

    if (eventResult.rows.length === 0) {
      const error = new Error("Event not found");
      error.statusCode = 404;
      throw error;
    }

    const seatResult = await client.query(
      `SELECT id
       FROM seats
       WHERE event_id = $1`,
      [eventId],
    );
    const seatIds = seatResult.rows.map((seat) => seat.id);

    if (seatIds.length > 0) {
      await client.query(
        `SELECT id
         FROM holds
         WHERE seat_id = ANY($1::integer[])
         FOR UPDATE`,
        [seatIds],
      );

      await client.query(
        `SELECT id
         FROM seats
         WHERE event_id = $1
         FOR UPDATE`,
        [eventId],
      );

      const bookingResult = await client.query(
        `SELECT COUNT(*)::integer AS count
         FROM bookings
         WHERE seat_id = ANY($1::integer[])`,
        [seatIds],
      );

      if (bookingResult.rows[0].count > 0) {
        const error = new Error(
          "Event cannot be deleted because it has existing bookings",
        );
        error.statusCode = 409;
        throw error;
      }

      await client.query(
        `UPDATE holds
         SET status = 'cancelled'
         WHERE seat_id = ANY($1::integer[])
           AND status = 'active'`,
        [seatIds],
      );
      await client.query("DELETE FROM holds WHERE seat_id = ANY($1::integer[])", [
        seatIds,
      ]);
      await client.query("DELETE FROM seats WHERE event_id = $1", [eventId]);
    }

    await client.query("DELETE FROM events WHERE id = $1", [eventId]);
    await client.query("COMMIT");
    transactionStarted = false;

    return res.status(200).json({
      success: true,
      message: "Event deleted successfully",
      eventId,
    });
  } catch (error) {
    if (client && transactionStarted) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Transaction rollback failed:", rollbackError);
      }
    }

    console.error("Delete event error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : "Event deletion failed",
    });
  } finally {
    if (client) {
      client.release();
    }
  }
};

const getEvents = async (req, res) => {
  try {
    const events = await pool.query(
      "SELECT id, name, description, event_date, total_seats, created_at FROM events ORDER BY created_at DESC",
    );
    const allEvents = events.rows;
    return res.status(200).json({
      success: true,
      events: allEvents,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

const getEventById = async (req, res) => {
  try {
    const event = await pool.query(
      `SELECT
        e.id, e.name, e.description, e.event_date, e.total_seats,
        COALESCE(
          json_agg(
            json_build_object('id', s.id, 'seat_number', s.seat_number, 'status', s.status)
            ORDER BY s.id
          ) FILTER (WHERE s.id IS NOT NULL),
          '[]'::json
        ) AS seats
       FROM events AS e
       LEFT JOIN seats AS s ON s.event_id = e.id
       WHERE e.id = $1
       GROUP BY e.id`,
      [req.params.id],
    );

    if (event.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    const seats = await pool.query(
      `SELECT id, seat_number, status
       FROM seats
       WHERE event_id = $1
       ORDER BY id`,
      [req.params.id],
    );

    return res.status(200).json({
      success: true,
      event: event.rows[0],
      seats: seats.rows,
    });
  } catch (error) {
    console.error("Get event by ID error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export { createEvent, updateEvent, deleteEvent, getEvents, getEventById };
