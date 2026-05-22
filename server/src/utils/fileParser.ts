import fs from 'fs';
import path from 'path';

export const parseFile = async (filePath: string): Promise<string> => {
    const extension = path.extname(filePath).toLowerCase().replace('.', '');

    try {
        // TXT, MD
        if (extension === 'txt' || extension === 'md') {
            return fs.readFileSync(filePath, 'utf-8');
        }

        // PDF
        if (extension === 'pdf') {
            const pdfParse = await import('pdf-parse');
            const pdf = pdfParse.default || pdfParse;
            
            const dataBuffer = fs.readFileSync(filePath);
            
            const data = await (pdf as any)(dataBuffer);
            
            return data.text;
        }

        // EXCEL & CSV
        if (['xlsx', 'xls', 'csv'].includes(extension)) {
            const xlsx = await import('xlsx');
            
            // FIX: Jangan pakai readFile, pakai read buffer agar kompatibel di ES Modules!
            const fileBuffer = fs.readFileSync(filePath);
            const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
            
            let fullText = '';

            // Looping semua sheets
            workbook.SheetNames.forEach(sheetName => {
                const sheet = workbook.Sheets[sheetName];
                if (sheet) { 
                    // convert Table to CSV string
                    const sheetText = xlsx.utils.sheet_to_csv(sheet);
                    fullText += `\n--- Lembar Data: ${sheetName} ---\n${sheetText}\n`;
                }
            });

            return fullText;
        }

        // DOCX
        if (extension === 'docx') {
            const mammoth = await import('mammoth');
            const result = await mammoth.extractRawText({ path: filePath });
            return result.value;
        }

        // Ekstensi tidak dikenal
        console.warn(`Format file tidak didukung: .${extension} (${path.basename(filePath)})`);
        return "";

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Gagal mengekstrak teks dari file ${filePath}:`, errorMessage);
        return "";
    }
};