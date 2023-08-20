import type { Timestamp } from "@grpc/grpc-js/build/src/generated/google/protobuf/Timestamp";
import type { Message } from "./message";

export type ChatHistory = {
    chatItems: ChatHistoryItem[]  
};

export type ChatHistoryItem = {
    dateTime: Date,
    chatContext: ChatContext;
};

export type ChatContext = {
    chatId: string,
    chat: Message[]
};