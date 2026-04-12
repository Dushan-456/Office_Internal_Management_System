import { Router } from "express";
import { protect } from "../middleware/authMiddleware.mjs";
import { getEnums } from "../controllers/enumController.mjs";

const router = Router();

// All enum routes require authentication
router.use(protect);

router.get("/", getEnums);

export default router;
