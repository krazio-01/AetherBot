import { NextRequest } from 'next/server';
import { ResponseWrapper, ErrorWrapper } from '@/lib/ResponseWrapper';
import { apiHandler } from '@/lib/apiHandler';
import { imageService } from '@/services/imageService';

export const POST = apiHandler(async (request: NextRequest) => {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) throw new ErrorWrapper(400, 'No file provided');

    const imgUrl = await imageService.uploadImage(file);

    return ResponseWrapper.successWithData({ imgUrl });
});

export const DELETE = apiHandler(async (request: NextRequest) => {
    const { searchParams } = request.nextUrl;
    const imgUrl = searchParams.get('imgUrl');

    if (!imgUrl) throw new ErrorWrapper(400, 'Image URL is required');

    await imageService.deleteImageByUrl(imgUrl);

    return ResponseWrapper.success(200, 'Image deleted successfully');
});
