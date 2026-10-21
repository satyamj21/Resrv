import { pool } from "../db/pool.js";

const authorizeRoles = (...roles) => {
  return async (req, res, next) => {
    try {
      const result = await pool.query(
        "SELECT id, role FROM users WHERE id = $1",
        [req.user.id],
      );

      const user = result.rows[0];

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const isAuthorized = roles.includes(user.role);

      if (!isAuthorized) {
        return res.status(401).json({
          success: false,
          message: "Access denied",
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  };
};

export default authorizeRoles;
