import { NextRequest, NextResponse } from 'next/server';
import { ResponseWrapper, ErrorWrapper } from '@/lib/ResponseWrapper';

type RouteHandler = (req: NextRequest, ...args: any[]) => Promise<Response | NextResponse> | Response | NextResponse;

export const apiHandler = (handler: RouteHandler) => {
    return async (req: NextRequest, ...args: any[]): Promise<Response | NextResponse> => {
        try {
            return await handler(req, ...args);
        } catch (error) {
            if (error instanceof ErrorWrapper) {
                return ResponseWrapper.error(error.message, error.status);
            }
            console.error('Unhandled API Error:', error);
            return ResponseWrapper.error('Internal server error', 500);
        }
    };
};
