import dotenv from 'dotenv';
dotenv.config();
export const PORT = Number(process.env.PORT) || 5000;
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
export const GEMINI_EMBEDDING_MODEL = process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-001";
export const GEMINI_TEMPERATURE = Number(process.env.GEMINI_TEMPERATURE) || 0.5;
export const GEMINI_TOPP = Number(process.env.GEMINI_TOPP) || 0.9;
// export const GEMINI_MAX_RES: number = Number(process.env.GEMINI_MAX_RES) || 300;
export const GEMINI_INSTRUCT = process.env.GEMINI_INSTRUCT || "";
export const PINECONE_API_KEY = process.env.PINECONE_API_KEY || '';
export const PINECONE_INDEX = process.env.PINECONE_INDEX || 'iti-knowledge';
if (!PINECONE_API_KEY) {
    console.error("PINECONE_API_KEY belum diatur");
    process.exit(1);
}
//# sourceMappingURL=env.js.map