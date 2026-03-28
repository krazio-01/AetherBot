import { NextResponse } from 'next/server';

export class ErrorWrapper extends Error {
    status: number;

    constructor(statusCode: number, message: string = 'Something went wrong', stack: string = '') {
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
    static success<T>(data: T, status: number = 200, message: string = 'Success') {
        return NextResponse.json({ success: true, status, message, data }, { status });
    }

    static error(message: string, status: number = 400) {
        return NextResponse.json({ success: false, status, message }, { status });
    }
}
