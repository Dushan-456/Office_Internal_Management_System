import { Router } from "express";


// Create the main root router
const rootRouter = Router();

// Health check endpoint (to test if API is running)
rootRouter.get("/", (req, res) => res.sendStatus(200));

import authRoutes from "./authRoutes.mjs";
import userRoutes from "./userRoutes.mjs";

// Mount feature routers
rootRouter.use("/auth", authRoutes);
rootRouter.use("/users", userRoutes);

// Handle undefined routes (404 Not Found)
rootRouter.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
  });
});

export default rootRouter;
