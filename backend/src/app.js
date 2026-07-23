import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import routes from "./routes/index.js";
import errorMiddleware from "./middleware/errorMiddleware.js";

dotenv.config();

const app = express();

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Precision Components ERP API is running",
  });
});

app.use("/api/v1", routes);

// Global Error Middleware (Always Last)
app.use(errorMiddleware);

export default app;