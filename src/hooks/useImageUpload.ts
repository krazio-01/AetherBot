import { useState, ChangeEvent } from 'react';
import { toast } from 'sonner';
import { useRequest } from '@/hooks/useRequest';
import { IUploadImageResponse } from '@/types/chat';

export interface IUploadState {
    imageLoading: boolean;
    file: File | null;
    previewUrl: string | null;
    imageUrl: string;
}

export const useImageUpload = (isGuest: boolean) => {
    const { postRequest, deleteRequest, cancel } = useRequest();
    const [uploadState, setUploadState] = useState<IUploadState>({
        imageLoading: false,
        file: null,
        previewUrl: null,
        imageUrl: '',
    });

    const handleImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (uploadState.previewUrl) URL.revokeObjectURL(uploadState.previewUrl);
        const localImageUrl = URL.createObjectURL(file);

        setUploadState((prev) => ({
            ...prev,
            previewUrl: localImageUrl,
            file,
            imageLoading: !isGuest,
        }));

        if (isGuest) {
            e.target.value = '';
            return;
        }

        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await postRequest<IUploadImageResponse, FormData>('/images', formData);

            if (res.success && res.data) {
                setUploadState((prev) => ({ ...prev, imageUrl: res.data!.imgUrl }));
            }
        } catch (error: unknown) {
            if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('canceled'))) return;
            toast.error(error instanceof Error ? error.message : 'Image upload failed');
        } finally {
            e.target.value = '';
            setUploadState((prev) => ({ ...prev, imageLoading: false }));
        }
    };

    const handleCancelImage = () => {
        cancel();
        const urlToDelete = uploadState.imageUrl;

        if (uploadState.previewUrl) URL.revokeObjectURL(uploadState.previewUrl);
        setUploadState({ imageLoading: false, file: null, previewUrl: null, imageUrl: '' });

        if (urlToDelete) {
            deleteRequest<void>('/images', { params: { imgUrl: urlToDelete } }).catch((error) =>
                console.error('Failed to delete image on server', error),
            );
        }
    };

    const resetUploadState = () => {
        setUploadState((prev) => ({ ...prev, previewUrl: null, file: null, imageUrl: '' }));
    };

    return { uploadState, handleImageChange, handleCancelImage, resetUploadState };
};
