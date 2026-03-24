import { NextRequest, NextResponse } from 'next/server';
import cloudinary from '@/utils/cloudinaryConfig';

interface CloudinaryUploadResult {
    secure_url: string;
    [key: string]: any;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) return NextResponse.json({ message: 'No file provided' }, { status: 400 });

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

        return NextResponse.json({ imgUrl: result.secure_url }, { status: 200 });
    } catch (error) {
        console.error('Image upload error:', error);
        return NextResponse.json(
            { message: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 },
        );
    }
}
