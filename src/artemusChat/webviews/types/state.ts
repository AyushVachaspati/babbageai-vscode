import type { Message } from "./message";

export type ChatContext = {
    chatId: string,
    chat: Message[]
};