import { GoogleGenAI } from '@google/genai';
import { GEMINI_API_KEY } from '../utils/env.js';
export const geminiClient = new GoogleGenAI({ apiKey: GEMINI_API_KEY }); // respon chat 
//# sourceMappingURL=geminiAI.js.map