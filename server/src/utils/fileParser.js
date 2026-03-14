import fs from 'fs';
import path from 'path';
export const parseFile = async (filePath) => {
    const extension = path.extname(filePath).toLowerCase().replace('.', '');
    try {
        // TXT, MD
        if (extension === 'txt' || extension === 'md') {
            return fs.readFileSync(filePath, 'utf-8');
        }
        // PDF
        if (extension === 'pdf') {
            // @ts-expect-error: pdf-parse/lib/pdf-parse.js lacks type definitions
            const pdf = await import('pdf-parse/lib/pdf-parse.js').then(m => m.default);
            const dataBuffer = fs.readFileSync(filePath);
            const data = await pdf(dataBuffer);
            return data.text;
        }
        // EXCEL & CSV
        if (['xlsx', 'xls', 'csv'].includes(extension)) {
            const xlsx = await import('xlsx');
            const workbook = xlsx.readFile(filePath);
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
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Gagal mengekstrak teks dari file ${filePath}:`, errorMessage);
        return "";
    }
};
//# sourceMappingURL=fileParser.js.map