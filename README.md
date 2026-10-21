# Resrv

Resrv is a full-stack event ticket booking platform built around a transactional PostgreSQL booking workflow. Users can browse events, select individual seats, temporarily hold them, confirm bookings through a simulated checkout step, and manage their booking history. Administrators have a separate interface for publishing events and generating their seat maps.

## Key features

- User registration, login, logout, and authenticated profile retrieval
- JWT authentication stored in an HTTP-only `accessToken` cookie
- Role-based access control for `user` and `admin` accounts
- Public event catalogue and event detail pages
- Admin event creation with automatic seat generation
- Interactive individual seat selection
- Temporary 10-minute seat holds
- Booking confirmation without a real payment gateway
- User booking history and cancellation
- Separate user and administrator layouts
- PostgreSQL transactions and row-level locks for seat-booking concurrency
- Parameterized raw SQL queries through the `pg` client

## Screenshots

Screenshots are not currently included in the repository.

Suggested screenshots for a future portfolio presentation:

- `[Screenshot placeholder: public event catalogue]`
- `[Screenshot placeholder: event detail and seat selector]`
- `[Screenshot placeholder: user booking history]`
- `[Screenshot placeholder: administrator event dashboard]`

## Tech stack

### Frontend

- React
- Vite
- Tailwind CSS
- React Router
- Axios

### Backend

- Node.js
- Express.js
- `bcryptjs` for password hashing
- `jsonwebtoken` for JWT creation and verification
- `cookie-parser` for HTTP-only cookie access
- `cors` for credentialed frontend requests

### Database and security

- PostgreSQL
- `pg`
- Raw, parameterized SQL queries
- JWT authentication in HTTP-only cookies
- Database-backed role authorization

## Architecture overview

Resrv is organized as two separately runnable applications:

1. The React/Vite client renders public, user, and admin interfaces.
2. The Express server exposes authentication, event, and booking APIs.
3. PostgreSQL stores users, events, seats, holds, and bookings.
4. Axios sends credentialed requests from the client to the API.
5. The server reads the JWT from the `accessToken` cookie and checks the current database role before protected operations.

The frontend API base URL is configured with `VITE_API_URL`. The backend listens on `PORT` and connects to PostgreSQL using the `DB_*` variables described below.

### Booking flow

1. An administrator creates an event from the admin interface.
2. The backend inserts the event and generates seat records in one transaction.
3. A user opens the event details page and selects an available seat.
4. The backend locks the selected seat with `SELECT ... FOR UPDATE`, verifies that it is available, marks it `held`, and creates an active hold that expires after 10 minutes.
5. The user confirms the hold. The backend verifies ownership and expiry, changes the seat to `booked`, creates a confirmed booking, and marks the hold `confirmed` in one transaction.
6. A user can view booking history or cancel a confirmed booking. Cancellation releases the seat and marks the booking `cancelled`.

There is no real payment provider or payment authorization step. The confirmation action is the current simulated checkout/payment step.

## Project structure

```text
.
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AdminLayout.jsx
│   │   │   ├── AdminNavbar.jsx
│   │   │   ├── EventCard.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── SeatGrid.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── AdminCreateEvent.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── EventDetails.jsx
│   │   │   ├── Events.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── MyBookings.jsx
│   │   │   └── Register.jsx
│   │   ├── utils/
│   │   │   └── eventImage.js
│   │   ├── App.jsx
│   │   ├── axios.js
│   │   ├── index.css
│   │   └── main.jsx
│   ├── eslint.config.js
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── server/
│   ├── database/
│   │   └── schema.sql
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── booking.controller.js
│   │   │   └── event.controller.js
│   │   ├── db/
│   │   │   └── pool.js
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js
│   │   │   └── authorize.middleware.js
│   │   └── routes/
│   │       ├── auth.routes.js
│   │       ├── booking.routes.js
│   │       └── event.routes.js
│   ├── app.js
│   ├── index.js
│   ├── package.json
│   └── test-concurrency.mjs
├── package.json
└── package-lock.json
```

The root `package.json` does not define application run scripts. Development commands are run from `client/` and `server/`.

## Prerequisites

- Node.js with npm
- PostgreSQL
- A PostgreSQL database and a database user with permission to create the Resrv tables
- `psql` available on your PATH if using the command-line database setup below

## Installation and setup

Clone the repository and install dependencies for each application:

```powershell
git clone <repository-url>
cd booking-system

cd server
npm install

cd ..\client
npm install
```

Create the server environment file at `server/.env` and the client environment file at `client/.env`. Use the template in the next section and replace only the placeholders with local values.

## Environment variables

### `server/.env`

```dotenv
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=resrv
DB_USER=postgres
DB_PASSWORD=<your-local-postgresql-password>

JWT_SECRET=<replace-with-a-long-random-secret>
```

The server reads these exact variables:

| Variable | Purpose | Default |
|---|---|---|
| `PORT` | Express server port | `5000` |
| `NODE_ENV` | Controls production cookie attributes | unset/development behavior |
| `DB_HOST` | PostgreSQL host | none |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_NAME` | PostgreSQL database name | none |
| `DB_USER` | PostgreSQL user | none |
| `DB_PASSWORD` | PostgreSQL password | none |
| `JWT_SECRET` | Signs and verifies authentication tokens | none |

### `client/.env`

```dotenv
VITE_API_URL=http://localhost:5000/api
```

The client reads `VITE_API_URL` as the Axios base URL and sends requests with credentials enabled.

Do not commit either `.env` file. Never place real passwords, JWT secrets, or access tokens in this README or in source control.

## PostgreSQL setup and schema

Create a local database, for example:

```powershell
createdb -U postgres resrv
```

The repository's database definition is [`server/database/schema.sql`](./server/database/schema.sql). It defines these tables:

- `users`: account details and `user`/`admin` roles
- `events`: event metadata and creator
- `seats`: generated seats and `available`/`held`/`booked` status
- `holds`: user-owned temporary seat holds and expiry timestamps
- `bookings`: confirmed or cancelled bookings linked to a hold

The schema also defines foreign keys, status checks, unique event seat numbers, and a partial unique index preventing more than one confirmed booking per seat.

`schema.sql` currently contains exploratory `SELECT` statements plus manual `UPDATE` and cleanup statements in addition to the table definitions. It is not a migration runner and is not a clean, repeatable migration file. Before applying it to a new database, review the file and remove or comment out those diagnostic/data-manipulation statements, especially the cleanup block and sample role updates. Then run the reviewed DDL file:

```powershell
psql -h localhost -U postgres -d resrv -f .\server\database\schema.sql
```

There are no versioned migrations or seed scripts in the repository. New users are registered through the API; an administrator role must be assigned directly in PostgreSQL, for example:

```sql
UPDATE users
SET role = 'admin'
WHERE email = '<admin-email>';
```

## Running in development

Start the backend in one terminal:

```powershell
cd server
npm run dev
```

The server checks the PostgreSQL connection before listening and defaults to `http://localhost:5000`.

Start the frontend in a second terminal:

```powershell
cd client
npm run dev
```

Vite serves the client on its normal development URL, typically `http://localhost:5173`. The backend CORS configuration explicitly allows `http://localhost:5173` and `http://localhost:5174`.

Available client scripts:

```powershell
cd client
npm run build
npm run lint
npm run preview
```

The server also exposes:

```powershell
cd server
npm start
```

The server's `npm test` script is currently a placeholder that exits with an error; no automated test suite is configured.

## API documentation

All API paths below are relative to `http://localhost:5000/api`. Protected endpoints require the HTTP-only `accessToken` cookie created by login. Role checks are performed against the current user record in PostgreSQL.

| Method | Endpoint | Purpose | Authentication / role |
|---|---|---|---|
| `POST` | `/auth/register` | Create a user account from `name`, `email`, and `password` | Public |
| `POST` | `/auth/login` | Verify credentials and set the `accessToken` cookie | Public |
| `POST` | `/auth/logout` | Clear the `accessToken` cookie | Public |
| `GET` | `/auth/profile` | Return the authenticated user's profile | Authenticated |
| `GET` | `/events` | List events ordered by creation time | Public |
| `GET` | `/events/:id` | Return an event and its seat map | Public |
| `POST` | `/events` | Create an event and generate its seats | Authenticated `admin` |
| `POST` | `/bookings/hold` | Hold one available seat for 10 minutes; body: `{ "seatId": number }` | Authenticated `user` |
| `POST` | `/bookings/confirm` | Confirm an active hold; body: `{ "holdId": number }` | Authenticated `user` |
| `GET` | `/bookings/my-bookings` | List the current user's bookings | Authenticated `user` |
| `PATCH` | `/bookings/:id` | Cancel one confirmed booking owned by the current user | Authenticated `user` |

The root health-style response is available outside the API prefix at `GET /` and returns `Event Booking API is running!`.

## Booking concurrency and temporary seat holds

Seat acquisition and booking confirmation use explicit PostgreSQL transactions. The hold flow locks the target seat with `FOR UPDATE`, checks its status, updates it to `held`, and inserts an active hold before committing. This serializes competing requests for the same seat so two users cannot successfully hold it at the same time.

Confirmation locks both the user's hold and its seat, verifies that the hold belongs to the user and has not expired, changes the seat to `booked`, inserts a confirmed booking, and marks the hold `confirmed` before committing. Expired holds are marked `expired` and their seats are returned to `available` during the confirmation attempt.

The database additionally enforces a partial unique index on confirmed bookings per seat. The application does not run a background expiry worker; expiration is handled when a confirmation request discovers an expired hold.

For an optional manual concurrency check, the repository includes `server/test-concurrency.mjs`. It expects the server to be running and these shell variables to contain valid user JWT values:

```powershell
cd server
$env:SEAT_ID = "1"
$env:USER_A_TOKEN = "<user-a-jwt>"
$env:USER_B_TOKEN = "<user-b-jwt>"
node .\test-concurrency.mjs
```

It sends two simultaneous hold requests for the same seat and prints both responses. This script is a manual probe, not part of the configured `npm test` command.

## Security considerations

- Passwords are hashed with `bcryptjs`; plaintext passwords are not stored.
- JWTs are stored in an HTTP-only cookie rather than browser-accessible storage.
- Production mode enables the cookie's `secure` flag and uses `sameSite: "none"` for cross-site deployments.
- Protected routes verify the JWT and role authorization on the backend; frontend route guards are not the security boundary.
- Database queries use PostgreSQL parameter placeholders rather than string interpolation.
- Booking mutations use transactions and row locks to protect seat state.
- Keep `JWT_SECRET` and database credentials outside source control.
- Configure HTTPS, a restricted production CORS origin, and an appropriate cookie policy before deploying.

## Current limitations

- Payment is simulated; no payment gateway, charge, refund, or payment webhook is implemented.
- There are no versioned migrations or seed scripts.
- `schema.sql` includes manual diagnostic and data-manipulation SQL that should be reviewed before reuse.
- Hold expiration is checked during booking confirmation; there is no background cleanup job.
- The server's `npm test` command is a placeholder, and no automated test suite is configured.
- The backend CORS allowlist is limited to the two local Vite origins currently present in `server/app.js`.
- No deployment configuration is included in the repository.

## Future improvements

The following are not currently implemented and are potential next steps:

- Integrate a real payment provider with idempotent payment and webhook handling.
- Add versioned migrations and a safe development seed process.
- Add a scheduled job to expire and release stale holds proactively.
- Add automated unit, integration, and end-to-end tests.
- Add event editing, deletion, capacity reporting, and richer administrative booking management.
- Add production configuration for trusted origins, HTTPS, observability, and rate limiting.
- Add email confirmations and ticket/receipt generation.

## Contributing

1. Create a feature branch from the current default branch.
2. Keep changes focused and avoid committing `.env` files or credentials.
3. Install dependencies separately in `client/` and `server/`.
4. Run the frontend checks before opening a pull request:

   ```powershell
   cd client
   npm run lint
   npm run build
   ```

5. If changing booking or schema behavior, manually verify the affected API flow and document any database setup changes.
6. Open a pull request with a concise description, setup notes, and screenshots for UI changes when available.

## License

No license has been specified in the repository.