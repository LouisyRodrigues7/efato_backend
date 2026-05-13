/*
=========================================================
analyze.routes.js
=========================================================

Define as rotas HTTP da API.

Exemplo:
POST /api/analyze

Responsável por conectar:
rota -> controller

=========================================================
*/
import { Router } from "express";
import { analyzeText } from "../controllers/analyze.controller.js";

const router = Router();

router.post("/analyze", analyzeText);

export default router;