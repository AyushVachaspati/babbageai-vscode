export enum Identity {
    User,
    Bot
}

export type Message = {
    identity: Identity,
    message: string
}