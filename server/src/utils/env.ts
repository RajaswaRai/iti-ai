    import dotenv from 'dotenv';

    dotenv.config();

    export const PORT: number = Number(process.env.PORT) || 5000;
    export const GEMINI_API_KEY: string = process.env.GEMINI_API_KEY || "";
    export const GEMINI_MODEL: string = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    export const GEMINI_EMBEDDING_MODEL: string = process.env.GEMINI_EMBEDDING_MODEL|| "gemini-embedding-001";
    export const GEMINI_TEMPERATURE: number = Number(process.env.GEMINI_TEMPERATURE) || 0.5;
    export const GEMINI_TOPP: number = Number(process.env.GEMINI_TOPP) || 0.9;
    export const GEMINI_MAX_RES: number = Number(process.env.GEMINI_MAX_RES) || 300;
    export const GEMINI_INSTRUCT: string = process.env.GEMINI_INSTRUCT || "";
    export const AI_PROVIDER: string = process.env.AI_PROVIDER || "gemini";
    export const JWT_ACCESS_SECRET: string = process.env.JWT_ACCESS_SECRET || "default_access_secret";
    export const JWT_REFRESH_SECRET: string = process.env.JWT_REFRESH_SECRET || "default_refresh_secret";

    export const PINECONE_API_KEY = process.env.PINECONE_API_KEY || '';
    export const PINECONE_INDEX = process.env.PINECONE_INDEX || 'iti-knowledge';

    if (!PINECONE_API_KEY) {
        console.error("PINECONE_API_KEY belum diatur");
        process.exit(1);
    }