import { create } from 'zustand';
import { User } from '../types';

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    setAuth: (user: User, token: string) => void;
    logout: () => void;
    initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    token: null,
    isAuthenticated: false,

    setAuth: (user, token) => {
        localStorage.setItem('access_token', token);
        localStorage.setItem('auth_user', JSON.stringify(user));
        set({
            user,
            token,
            isAuthenticated: true
        });
    },

    logout: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('auth_user');
        set({
            user: null,
            token: null,
            isAuthenticated: false
        });
        window.location.href = '/login';
    },

    initialize: () => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('access_token');
            const userStr = localStorage.getItem('auth_user');
            if(token && userStr) {
                try {
                    const user = JSON.parse(userStr);
                    set({
                        user,
                        token,
                        isAuthenticated: true
                    });
                } catch {
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('auth_user');
                }
            }
        }
    }
}))