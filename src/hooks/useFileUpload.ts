import { useState, ChangeEvent } from 'react';
import { toast } from 'sonner';
import { useRequest } from '@/hooks/useRequest';
import { IUploadFileResponse, MediaType } from '@/types/chat';

export interface IUploadState {
    loading: boolean;
    attachment: {
        file: File;
        url: string;
        type: MediaType;
        name: string;
    } | null;
}

const initialState: IUploadState = {
    loading: false,
    attachment: null,
};

export const useFileUpload = (isAuthenticated: boolean) => {
    const { postRequest, deleteRequest, cancel } = useRequest();
    const [uploadState, setUploadState] = useState<IUploadState>(initialState);

    const processFile = async (file: File) => {
        if (uploadState.attachment) handleCancelFile();

        const isImage = file.type.startsWith('image/');
        const fileType = isImage ? MediaType.IMAGE : MediaType.PDF;

        const localUrl = isImage ? URL.createObjectURL(file) : '';

        setUploadState({
            loading: isAuthenticated,
            attachment: { file, url: localUrl, type: fileType, name: file.name },
        });

        if (!isAuthenticated) return;

        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await postRequest<IUploadFileResponse, FormData>('/files', formData);

            if (res.success && res.data) {
                setUploadState((prev) => ({
                    loading: false,
                    attachment: prev.attachment ? { ...prev.attachment, url: res.data!.url } : null,
                }));
            }
        } catch (error: unknown) {
            if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('canceled'))) return;
            toast.error(error instanceof Error ? error.message : 'File upload failed');
            setUploadState(initialState);
        }
    };

    const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        await processFile(file);

        e.target.value = '';
    };

    const handleCancelFile = () => {
        cancel();

        const currentUrl = uploadState.attachment?.url || '';
        const isCloudinaryUrl = currentUrl.startsWith('http');

        if (currentUrl.startsWith('blob:')) URL.revokeObjectURL(currentUrl);

        setUploadState(initialState);

        if (isCloudinaryUrl) {
            deleteRequest<void>('/files', { params: { url: currentUrl } }).catch((error) =>
                console.error('Failed to delete file on server', error),
            );
        }
    };

    const resetUploadState = () => {
        setUploadState(initialState);
    };

    return { uploadState, handleFileChange, handleCancelFile, resetUploadState, processFile };
};
