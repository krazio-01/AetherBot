import cloudinary from '@/utils/cloudinaryConfig';
import { ErrorWrapper } from '@/lib/ResponseWrapper';

interface CloudinaryUploadResult {
    secure_url: string;
    [key: string]: any;
}

export const fileService = {
    async uploadFile(file: File): Promise<string> {
        try {
            const buffer = await file.arrayBuffer();
            const fileBuffer = Buffer.from(buffer);

            const isImage = file.type.startsWith('image/');
            const subFolder = isImage ? 'Images' : 'PDFs';
            const targetFolder = `AetherBot/${subFolder}`;

            const result = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
                cloudinary.uploader
                    .upload_stream(
                        {
                            resource_type: 'auto',
                            folder: targetFolder,
                            upload_preset: 'AetherBot',
                            ...(isImage && { quality: 70 }),
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
            throw new ErrorWrapper(500, 'Failed to upload file to Cloudinary');
        }
    },

    async deleteFileByUrl(fileUrl: string): Promise<void> {
        const urlParts = fileUrl.split('/');

        const rootFolderIndex = urlParts.findIndex((part) => part === 'AetherBot');

        if (rootFolderIndex === -1) throw new ErrorWrapper(400, 'Invalid file URL: Missing root folder');

        const pathParts = urlParts.slice(rootFolderIndex);
        const fileNameWithExt = pathParts.pop();

        const id = fileNameWithExt?.split('.')[0];
        const ext = fileNameWithExt?.split('.').pop()?.toLowerCase();

        const folderPath = pathParts.join('/');

        if (!id) throw new ErrorWrapper(400, 'Invalid file URL format');

        const publicId = `${folderPath}/${id}`;

        const resourceType = ext && !['jpg', 'jpeg', 'png', 'webp', 'gif', 'pdf'].includes(ext) ? 'raw' : 'image';

        try {
            await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
        } catch (error) {
            console.error('Cloudinary Delete Error:', error);
            throw new ErrorWrapper(500, 'Failed to delete file from Cloudinary');
        }
    },
};
