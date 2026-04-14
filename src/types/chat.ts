import { IChat, IMessage } from ".";

export enum ChatRole {
    USER = 'user',
    MODEL = 'model',
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

export interface ITTsResponse {
    audio: string;
}
