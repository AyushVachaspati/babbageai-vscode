export enum Identity {
    userMessage,
    botMessage,
    errorMessage
}

export type Message = {
    identity: Identity,
    message: string,
};