import { Router } from "express";
import { analyzeText } from "../controllers/analyze.controller.js";

const router = Router();

router.post("/analyze", analyzeText);

export default router;