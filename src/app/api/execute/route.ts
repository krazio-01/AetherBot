import { NextRequest } from 'next/server';
import { apiHandler } from '@/lib/apiHandler';
import { ResponseWrapper, ErrorWrapper } from '@/lib/ResponseWrapper';
import { executeCode } from '@/services/server/compilerService';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/options';

export const POST = apiHandler(async (request: NextRequest) => {
    const session = await getServerSession(authOptions);
    if (!session) throw new ErrorWrapper(401, 'Please sign in to run your code.');

    const { language, content } = await request.json();

    const data = await executeCode(language, content);

    return ResponseWrapper.successWithData(data);
});
