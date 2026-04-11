import { AUTH_STATES } from '@/types/auth';
import { useSession, signIn, signOut } from 'next-auth/react';

export const useAuth = () => {
    const { data: session, status } = useSession();

    return {
        user: session?.user,
        isAuthenticated: status === AUTH_STATES.AUTHENTICATED,
        isGuest: status === AUTH_STATES.UNAUTHENTICATED,
        isLoading: status === AUTH_STATES.LOADING,
        signIn,
        signOut,
    };
};
