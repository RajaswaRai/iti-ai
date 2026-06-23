import prisma from '../config/prisma.js';

export const logAudit = async (
    userId: string,
    action: string,
    resource?: string | null,
    details?: string | null
): Promise<void> => {
    try {
        await prisma.auditLog.create({
            data: {
                user_id: userId,
                action,
                resource: resource ?? null,
                details: details ?? null
            }
        });
    } catch (error) {
        console.error("Gagal merekam audit log:", error);
    }
};
