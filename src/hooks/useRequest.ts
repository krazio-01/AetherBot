import { useState, useCallback, useRef, useEffect } from 'react';
import axios, { AxiosRequestConfig, AxiosInstance } from 'axios';
import { IResponseWrapper, IErrorWrapper } from '@/types';

const axiosInstance: AxiosInstance = axios.create({ baseURL: '/api' });

export const useRequest = () => {
    const [isPending, setIsPending] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const abortControllerRef = useRef<AbortController | null>(null);

    const cancel = useCallback(() => {
        if (abortControllerRef.current) abortControllerRef.current.abort();
    }, []);

    useEffect(() => {
        return () => {
            if (abortControllerRef.current) abortControllerRef.current.abort();
        };
    }, []);

    const request = useCallback(async <T>(config: AxiosRequestConfig): Promise<IResponseWrapper<T>> => {
        setIsPending(true);
        setError(null);

        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
            const response = await axiosInstance.request<IResponseWrapper<T>>({
                ...config,
                signal: config.signal || controller.signal,
            });

            return response.data;
        } catch (err: any) {
            if (axios.isCancel(err) || err.name === 'AbortError') throw err;

            let errorMessage = 'An unexpected error occurred';
            if (axios.isAxiosError<IErrorWrapper>(err)) errorMessage = err.response?.data?.message || err.message;
            else if (err instanceof Error) errorMessage = err.message;

            setError(errorMessage);
            throw errorMessage;
        } finally {
            setIsPending(false);
        }
    }, []);

    const getRequest = useCallback(
        <T>(url: string, config?: AxiosRequestConfig) => request<T>({ ...config, method: 'GET', url }),
        [request],
    );

    const postRequest = useCallback(
        <T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig) =>
            request<T>({ ...config, method: 'POST', url, data }),
        [request],
    );

    const putRequest = useCallback(
        <T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig) =>
            request<T>({ ...config, method: 'PUT', url, data }),
        [request],
    );

    const deleteRequest = useCallback(
        <T>(url: string, config?: AxiosRequestConfig) => request<T>({ ...config, method: 'DELETE', url }),
        [request],
    );

    return {
        isPending,
        error,
        cancel,
        getRequest,
        postRequest,
        putRequest,
        deleteRequest,
    };
};
