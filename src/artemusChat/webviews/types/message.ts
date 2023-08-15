export enum Identity {
    userMessage,
    botMessage
}

export type Message = {
    identity: Identity,
    message: string
}