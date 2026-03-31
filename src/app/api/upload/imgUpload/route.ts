import { NextRequest } from 'next/server';
import cloudinary from '@/utils/cloudinaryConfig';
import { ResponseWrapper, ErrorWrapper } from '@/lib/ResponseWrapper';
import { apiHandler } from '@/lib/apiHandler';

interface CloudinaryUploadResult {
    secure_url: string;
    [key: string]: any;
}

export const POST = apiHandler(async (request: NextRequest) => {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) throw new ErrorWrapper(400, 'No file provided');

    const buffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(buffer);

    const result = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
        cloudinary.uploader
            .upload_stream(
                {
                    resource_type: 'auto',
                    folder: `AetherBot`,
                    upload_preset: 'AetherBot',
                    quality: 70,
                },
                (error, result) => {
                    if (error) reject(error);
                    else if (result) resolve(result as CloudinaryUploadResult);
                },
            )
            .end(fileBuffer);
    });

    return ResponseWrapper.successWithData({ imgUrl: result.secure_url }, 200);
});
