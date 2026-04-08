import cloudinary from '@/utils/cloudinaryConfig';
import { ErrorWrapper } from '@/lib/ResponseWrapper';

interface CloudinaryUploadResult {
    secure_url: string;
    [key: string]: any;
}

export const imageService = {
    async uploadImage(file: File): Promise<string> {
        try {
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

            return result.secure_url;
        } catch (error) {
            console.error('Cloudinary Upload Error:', error);
            throw new ErrorWrapper(500, 'Failed to upload image to Cloudinary');
        }
    },

    async deleteImageByUrl(imgUrl: string): Promise<void> {
        const id = imgUrl.split('/').pop()?.split('.')[0];

        if (!id) throw new ErrorWrapper(400, 'Invalid image URL format');

        const publicId = `AetherBot/${id}`;

        try {
            await cloudinary.uploader.destroy(publicId);
        } catch (error) {
            console.error('Cloudinary Delete Error:', error);
            throw new ErrorWrapper(500, 'Failed to delete image from Cloudinary');
        }
    },
};
