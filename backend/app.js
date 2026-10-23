import express from "express";
import helmet from "helmet";
import hpp from "hpp";
import cors from "cors";
import cookieParser from "cookie-parser";

import createTables from "./utils/createTables.js";
import { errorMiddleware } from "./middlewares/errorMiddleware.js";
import { globalLimiter } from "./middlewares/rateLimit.js";

import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import productReviewRoutes from "./routes/productReviewRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import couponRoutes from "./routes/couponRoutes.js";
import addressRoutes from "./routes/addressRoutes.js";


const app = express();


// Security Middlewares
app.use(helmet());
app.use(hpp());


// HTTPS Enforcement
if (process.env.NODE_ENV === "production") {

    app.use((req, res, next) => {

        if (req.headers["x-forwarded-proto"] !== "https") {
            return res.redirect(
                301,
                `https://${req.headers.host}${req.url}`
            );
        }

        next();
    });
}


// CORS
const allowedOrigins = [
    "http://localhost:5173",
    "https://shoprivo.vercel.app",
];


app.use(
    cors({
        origin: allowedOrigins,
        credentials: true,
    })
);


// Stripe Webhook
// Must be before express.json()
app.use(
    "/api/payment",
    paymentRoutes
);


// Body Parsers
app.use(
    express.json({
        limit: "1mb",
    })
);

app.use(
    express.urlencoded({
        extended: true,
        limit: "1mb",
    })
);

app.use(cookieParser());


// Disable ETag
app.set("etag", false);


app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    uptime: process.uptime(),
  });
});

// Global Rate Limiter
app.use("/api", globalLimiter);


// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/product", productRoutes);
app.use("/api/product", productReviewRoutes);
app.use("/api/category", categoryRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/order", orderRoutes);
app.use("/api/coupon", couponRoutes);
app.use("/api/address", addressRoutes);


// Create Database Tables
createTables();


// Global Error Handler
app.use(errorMiddleware);


export default app;