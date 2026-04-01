import { IMessage } from ".";

export interface IFetchMessagesRequest {
    chatId: string;
}

export interface IFetchMessagesResponse {
    messages: IMessage[];
}
