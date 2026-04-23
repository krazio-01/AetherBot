import { ReactNode } from "react";
import { ChatRole, MediaType } from "./chat";

// API_response
export interface IResponseWrapper<T = any> {
    success: boolean;
    status: number;
    message?: string;
    data?: T;
}

export interface IErrorWrapper {
    success: boolean;
    status: number;
    message?: string;
}

// Auth types
export interface IAuthField {
    name: string;
    label: string;
    type: string;
    icon?: ReactNode;
}

export interface ISessionUser {
    _id: string;
    name?: string | null;
    email?: string | null;
    avatar?: string | null;
}

// Chat types
export interface IMessagePart {
    text: string;
}

export interface IMessage {
    client_id?: string;
    role: ChatRole;
    parts: IMessagePart[];
    attachment?: {
        url: string;
        type: MediaType;
        name: string;
    };
    isError?: boolean;
    isStreaming?: boolean;
}

export interface IChat {
    _id?: string;
    userId?: string;
    referenceId: string;
    title: string;
    createdAt?: string | Date;
    updatedAt?: Date;
}

// rest of the types
export interface IMenuItem {
    icon?: ReactNode;
    content: ReactNode;
    onClick?: () => void;
}
