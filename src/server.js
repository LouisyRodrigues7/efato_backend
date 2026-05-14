/*
=========================================================
server.js
=========================================================

Arquivo principal do backend Express.

Responsável por:
- Inicializar servidor
- Configurar middlewares
- Habilitar CORS
- Registrar rotas
- Definir porta da aplicação

Ponto de entrada do sistema.

=========================================================
*/
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import analyzeRoutes from "./routes/analyze.routes.js";

dotenv.config();

const app = express();

//
// CORS (FIX para deploy Netlify + Render)
//
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://127.0.0.1:5500",
      "https://efato-front.onrender.com"
    ],
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

app.use(express.json());

//
// ROTAS
//
app.use("/api", analyzeRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});