import { Router } from "express";


// Create the main root router
const rootRouter = Router();

// Health check endpoint (to test if API is running)
rootRouter.get("/", (req, res) => res.sendStatus(200));

// Mount feature routers
// rootRouter.use("/users", userRoutes);           // User-related routes
// rootRouter.use("/categories", categoryRoutes);  // Category-related routes


// Handle undefined routes (404 Not Found)
rootRouter.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
  });
});

export default rootRouter;
