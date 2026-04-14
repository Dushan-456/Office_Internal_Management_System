import { Router } from "express";

// Create the main root router
const rootRouter = Router();

// Health check endpoint (to test if API is running)
rootRouter.get("/", (req, res) => res.sendStatus(200));

import authRoutes from "./authRoutes.mjs";
import employeeRoutes from "./employeeRoutes.mjs";
import enumRoutes from "./enumRoutes.mjs";
import leaveRoutes from "./leaveRoutes.mjs";
import notificationRoutes from "./notificationRoutes.mjs";
import settingsRoutes from "./settingsRoutes.mjs";

// Mount feature routers
rootRouter.use("/auth", authRoutes);
rootRouter.use("/employees", employeeRoutes);
rootRouter.use("/enums", enumRoutes);
rootRouter.use("/leaves", leaveRoutes);
rootRouter.use("/notifications", notificationRoutes);
rootRouter.use("/settings", settingsRoutes);

// Handle undefined routes (404 Not Found)
rootRouter.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
  });
});

export default rootRouter;
