import { pool } from "../db/pool.js";

const createEvent = async (req, res) => {
  const { name, description, event_date, total_seats } = req.body;

  if (!name || !event_date || total_seats === undefined) {
    return res.status(400).json({
      success: false,
      message: "Name, event date and total seats are required",
    });
  }

  if (
    typeof total_seats !== "number" ||
    !Number.isInteger(total_seats) ||
    total_seats <= 0
  ) {
    return res.status(400).json({
      success: false,
      message: "Total seats must be a positive integer",
    });
  }

  if (typeof name !== "string" || !name.trim()) {
    return res.status(400).json({
      success: false,
      message: "Event name is required",
    });
  }

  if (
    description !== undefined &&
    description !== null &&
    typeof description !== "string"
  ) {
    return res.status(400).json({
      success: false,
      message: "Description must be a string",
    });
  }

  if (Number.isNaN(Date.parse(event_date))) {
    return res.status(400).json({
      success: false,
      message: "Invalid event date",
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

export { createEvent, getEvents, getEventById };
