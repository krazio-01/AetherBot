import { ReactNode } from "react";

// API_response
export interface IResponseWrapper<T = any> {
    success: boolean;
    status: number;
    message?: string;
    data?: T;
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
    role: 'user' | 'model';
    parts: IMessagePart[];
    image?: string;
    isError?: boolean;
}

export interface IChat {
    _id?: string;
    userId?: string;
    referenceId: string;
    title: string;
    createdAt?: string | Date;
}

// rest of the types
export interface IMenuItem {
    icon?: ReactNode;
    content: ReactNode;
    onClick?: () => void;
}
