import rateLimit from "express-rate-limit";

// Auth routes: 10 attempts per 15 minutes per IP
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "Too many login attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

// General authenticated API: 300 requests per 15 minutes per IP
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { message: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public chat widget: 60 requests per minute per IP
export const publicChatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { message: "Too many chat requests, please slow down" },
  standardHeaders: true,
  legacyHeaders: false,
});

// File upload: 20 uploads per 15 minutes per IP
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: "Too many uploads, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});
