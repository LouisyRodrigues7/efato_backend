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

import analyzeRoutes
  from "./routes/analyze.routes.js";

dotenv.config();

const app = express();

app.use(cors());

app.use(express.json());

//
// ROTAS
//
app.use("/api", analyzeRoutes);

const PORT =
  process.env.PORT || 3000;

app.listen(PORT, () => {

  console.log(
    `Servidor rodando na porta ${PORT}`
  );
});