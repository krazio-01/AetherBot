import { NextRequest } from 'next/server';
import { ResponseWrapper, ErrorWrapper } from '@/lib/ResponseWrapper';
import { apiHandler } from '@/lib/apiHandler';
import { fileService } from '@/services/server/fileService';
import { authOptions } from '../auth/[...nextauth]/options';
import { getServerSession } from 'next-auth';

export const POST = apiHandler(async (request: NextRequest) => {
    const session = await getServerSession(authOptions);
    if (!session?.user?._id) throw new ErrorWrapper(401, 'Unauthorized');

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) throw new ErrorWrapper(400, 'No file provided');

    if (file.size > 10 * 1024 * 1024) throw new ErrorWrapper(400, 'File size exceeds 10MB limit');

    const fileUrl = await fileService.uploadFile(file);

    return ResponseWrapper.successWithData({ url: fileUrl });
});

export const DELETE = apiHandler(async (request: NextRequest) => {
    const session = await getServerSession(authOptions);
    if (!session?.user?._id) throw new ErrorWrapper(401, 'Unauthorized');

    const { searchParams } = request.nextUrl;
    const fileUrl = searchParams.get('url');

    if (!fileUrl) throw new ErrorWrapper(400, 'File URL is required for deletion');

    await fileService.deleteFileByUrl(fileUrl);

    return ResponseWrapper.success(200, 'File deleted successfully');
});
