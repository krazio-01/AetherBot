import { NextRequest, NextResponse } from 'next/server';
import cloudinary from '@/utils/cloudinaryConfig';

export async function DELETE(request: NextRequest): Promise<NextResponse> {
    const { searchParams } = request.nextUrl;
    const imgUrl = searchParams.get('imgUrl');

    if (!imgUrl) return NextResponse.json({ message: 'Image URL is required' }, { status: 400 });

    try {
        const id = imgUrl.split('/').pop()?.split('.')[0];

        if (!id) return NextResponse.json({ message: 'Invalid image URL format' }, { status: 400 });

        const publicId = `AetherBot/${id}`;
        await cloudinary.uploader.destroy(publicId);

        return NextResponse.json({ message: 'Image deleted' }, { status: 200 });
    } catch (error) {
        console.error('Delete image error:', error);
        return NextResponse.json(
            { message: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 },
        );
    }
}
