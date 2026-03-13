import fs from 'fs';
import path from 'path';

export const parseFile = async (filePath: string): Promise<string> => {
    const extension = filePath.split('.').pop()?.toLowerCase();

    if (extension === 'txt') {
        return fs.readFileSync(filePath, 'utf-8');
    } 

    if (extension === 'pdf') {
        // @ts-ignore
        const pdf = await import('pdf-parse/lib/pdf-parse.js').then(m => m.default);
        
        const dataBuffer = fs.readFileSync(filePath);
        try {
            const data = await pdf(dataBuffer);
            return data.text;
        } catch (error) {
            console.error(`Gagal mengekstrak PDF: ${path.basename(filePath)}`, error);
            return "";
        }
    }

    throw new Error(`Format file .${extension} belum didukung.`);
};