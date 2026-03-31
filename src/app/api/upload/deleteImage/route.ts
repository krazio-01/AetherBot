import { NextRequest } from 'next/server';
import cloudinary from '@/utils/cloudinaryConfig';
import { ResponseWrapper, ErrorWrapper } from '@/lib/ResponseWrapper';
import { apiHandler } from '@/lib/apiHandler';

export const DELETE = apiHandler(async (request: NextRequest) => {
    const { searchParams } = request.nextUrl;
    const imgUrl = searchParams.get('imgUrl');

    if (!imgUrl) throw new ErrorWrapper(400, 'Image URL is required');

    const id = imgUrl.split('/').pop()?.split('.')[0];

    if (!id) throw new ErrorWrapper(400, 'Invalid image URL format');

    const publicId = `AetherBot/${id}`;
    await cloudinary.uploader.destroy(publicId);

    return ResponseWrapper.success(200, 'Image deleted');
});
