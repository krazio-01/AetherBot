import { IChat, IMessage } from ".";

export enum ChatRole {
    USER = 'user',
    MODEL = 'model',
}

export enum MediaType {
    IMAGE = "image",
    PDF = "pdf"
}

export interface IFetchMessagesResponse {
    messages: IMessage[];
}

export interface IUploadFileResponse {
    url: string;
}

export interface ICreateChatResponse {
    modelMessage: string;
    referenceId: string;
}

export interface IChatResponse {
    chats: IChat[];
}

export interface ITTsResponse {
    audio: string;
}
