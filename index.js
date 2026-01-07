import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import connectDB from "./utils/db.js";
import userRoute from "./routes/user.route.js";
import companyRoute from "./routes/company.route.js";
import jobRoute from "./routes/job.route.js";
import applicationRoute from "./routes/application.route.js";
import reviewRoute from "./routes/review.route.js";
import paymentRoute from "./routes/payment.route.js";
import { fileURLToPath } from "url";

dotenv.config({
    path: "./.env",
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static files from the 'public' directory
app.use("/public", express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 8000;
const NODE_ENV = process.env.NODE_ENV || "development";

const corsOrigin = process.env.FRONTEND_URL || "http://localhost:5173";
const corsOptions = {
    origin: corsOrigin,
    credentials: true,
};

app.use(cors(corsOptions));

// api's
app.use("/api/v1/user", userRoute);
app.use("/api/v1/company", companyRoute);
app.use("/api/v1/job", jobRoute);
app.use("/api/v1/application", applicationRoute);
app.use("/api/v1/review", reviewRoute);
app.use("/api/v1/payment", paymentRoute);

// Serve frontend static files (dist folder from build)
const frontendDistPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendDistPath));

// SPA fallback: Serve index.html for all non-API routes (enables client-side routing)
app.get('*', (req, res) => {
    res.sendFile(path.resolve(frontendDistPath, 'index.html'));
});

app.listen(PORT, () => {
    connectDB();
    console.log(`Server running in ${NODE_ENV} mode at port ${PORT}`);
});