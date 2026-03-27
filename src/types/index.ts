import { ReactNode } from "react";

// API_response
export interface IApiResponse<T = any> {
    success: boolean;
    message: string;
    data: T | null;
    status: number;
    error?: string | null;
}

export interface IApiError {
    success: false;
    message: string;
    status: number;
    error: string;
}

// Auth types
export interface IAuthField {
    name: string;
    label: string;
    type: string;
    icon?: ReactNode;
}

// Chat types
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

// rest of the types
export interface IMenuItem {
    icon?: ReactNode;
    content: ReactNode;
    onClick?: () => void;
}
