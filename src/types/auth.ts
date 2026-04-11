export interface ISignupRequest {
    name: string;
    email: string;
    password: string;
    avatar: string;
}

export interface ILoginRequest {
    identifier: string;
    password: string;
}

export interface IPasswordResetRequest {
    email: string;
}

export interface IPasswordChangeRequest {
    token: string;
    newPassword: string;
}

export enum AUTH_STATES {
    UNAUTHENTICATED = "unauthenticated",
    AUTHENTICATED = "authenticated",
    LOADING = "loading"
}
