export interface IMessagePart {
    text: string;
}

export interface IMessage {
    _id?: string;
    chatId?: string;
    role: 'user' | 'model';
    parts: IMessagePart[];
    image?: string;
}

export interface IChat {
    _id?: string;
    userId?: string;
    referenceId: string;
    title: string;
    createdAt?: string | Date;
}
