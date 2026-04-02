import { IChat, IMessage } from ".";

export interface IFetchMessagesRequest {
    chatId: string;
}

export interface IFetchMessagesResponse {
    messages: IMessage[];
}

export interface IUploadImageResponse {
    imgUrl: string;
}

export interface ICreateChatResponse {
    modelMessage: string;
    referenceId: string;
}

export interface IChatResponse {
    chats: IChat[];
}
