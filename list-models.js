/*
=========================================================
list-models.js
=========================================================

Script utilitário para listar modelos
disponíveis da API Gemini.

Utilizado para:
- debug
- testes
- validação de modelos

=========================================================
*/
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;

async function listModels() {
  try {
    const res = await axios.get(
      `https://generativelanguage.googleapis.com/v1/models?key=${API_KEY}`
    );

    console.log(JSON.stringify(res.data, null, 2));
  } catch (error) {
    console.error("ERRO:", error.response?.data || error.message);
  }
}

listModels();