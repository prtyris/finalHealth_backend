import rateLimit from "express-rate-limit";
import AppError from "../errors/AppError.js";

export const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 15 minutes
  max: 100, // 10 attempts per IP per window
  standardHeaders: true,
  legacyHeaders: false,

  handler: (req, res, next) => {
    next(
      new AppError(
        "Too many login attempts. Try again later.",
        429,
        "RATE_LIMITED",
      ),
    );
  },
});
