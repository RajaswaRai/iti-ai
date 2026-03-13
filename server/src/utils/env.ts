import dotenv from 'dotenv';

dotenv.config();

export const PORT: number = Number(process.env.PORT) || 5000;
export const GEMINI_API_KEY: string = process.env.GEMINI_API_KEY || "";
export const GEMINI_MODEL: string = process.env.GEMINI_MODEL || "gemini-2.5-flash";
export const GEMINI_TEMPERATURE: number = Number(process.env.GEMINI_TEMPERATUR) || 0.5;
export const GEMINI_TOPP: number = Number(process.env.GEMINI_TOPP) || 0.9;
export const GEMINI_MAX_RES: number = Number(process.env.GEMINI_MAX_RES) || 600;
export const GEMINI_INSTRUCT: string = process.env.GEMINI_INSTRUCT || "";