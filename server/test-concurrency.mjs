const baseUrl = "http://localhost:5000/api";
const seatId = Number(process.env.SEAT_ID || 1);

const users = [
  {
    name: "User A",
    token: process.env.USER_A_TOKEN,
  },
  {
    name: "User B",
    token: process.env.USER_B_TOKEN,
  },
];

if (users.some((user) => !user.token)) {
  throw new Error("Set both USER_A_TOKEN and USER_B_TOKEN first.");
}

const results = await Promise.all(
  users.map(async (user) => {
    try {
      const response = await fetch(`${baseUrl}/bookings/hold`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `accessToken=${user.token}`,
        },
        body: JSON.stringify({ seatId }),
      });

      const data = await response.json();

      return {
        user: user.name,
        status: response.status,
        response: data,
      };
    } catch (error) {
      return {
        user: user.name,
        error: error.message,
      };
    }
  }),
);

console.log(JSON.stringify(results, null, 2));
