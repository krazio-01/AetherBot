import { NextRequest } from 'next/server';
import { apiHandler } from '@/lib/apiHandler';
import { ResponseWrapper } from '@/lib/ResponseWrapper';
import { executeCode } from '@/services/compilerService';

export const POST = apiHandler(async (request: NextRequest) => {
    const { language, content } = await request.json();

    const data = await executeCode(language, content);

    return ResponseWrapper.successWithData(data);
});
