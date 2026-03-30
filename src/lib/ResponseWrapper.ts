import { NextResponse } from 'next/server';

export class ErrorWrapper extends Error {
    status: number;

    constructor(statusCode: number, message?: string, stack: string = '') {
        super(message);
        this.status = statusCode;
        this.name = this.constructor.name;

        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export class ResponseWrapper {
    static success(status: number = 200, message?: string) {
        return NextResponse.json(
            {
                success: true,
                status,
                ...(message && { message }),
            },
            { status },
        );
    }

    static successWithData<T>(data: T, status: number = 200, message?: string) {
        return NextResponse.json(
            {
                success: true,
                status,
                data,
                ...(message && { message }),
            },
            { status },
        );
    }

    static error(message?: string, status: number = 400) {
        return NextResponse.json(
            {
                success: false,
                status,
                ...(message && { message }),
            },
            { status },
        );
    }
}
