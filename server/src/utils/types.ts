

export interface ChatMessage {
    role: string;
    parts: { text: string }[];
}