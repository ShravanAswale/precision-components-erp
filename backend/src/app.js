import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import routes from "./routes/index.js";
import errorMiddleware from "./middleware/errorMiddleware.js";

dotenv.config();

const app = express();

// CORS Configuration
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://precision-components-erp.onrender.com",
    ],
    credentials: true,
  })
);

// Body Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Precision Components ERP API is running",
  });
});

// API Routes
app.use("/api/v1", routes);

// Global Error Handler (Keep Last)
app.use(errorMiddleware);

export default app;