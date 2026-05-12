import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const URL =
    `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

export const callGemini = async (prompt) => {

    const res = await axios.post(URL, {
        contents: [{
            parts: [{ text: prompt }]
        }]
    });

    return res.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
};