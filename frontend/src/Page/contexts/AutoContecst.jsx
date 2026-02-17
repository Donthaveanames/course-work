
import React, { useState, useEffect, createContext } from 'react';
import axiosInstance from '../../services/axiosConfig.jsx';


const AuthContext = createContext({
    auth: { loading: true, data: null },
    setAuthData: () => { },
    setTokens: () => { },
    logout: () => { },
    isAuthenticated: () => false,
});

export const AuthProvider = ({ children }) => {
    const [auth, setAuth] = useState({ loading: true, data: null });

    const isAuthenticated = () => {
        return !!localStorage.getItem('access_token');
    };

    const setTokens = (accessToken, refreshToken, user) => {
        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('refresh_token', refreshToken);
        localStorage.setItem('user', JSON.stringify(user));
        setAuth({ loading: false, data: user.username });
    };

    const setAuthData = (data) => {
        setAuth(prev => ({ ...prev, data }));
    };

    const logout = async () => {
        const refreshToken = localStorage.getItem('refresh_token');

        if (refreshToken) {
            try {
                await axiosInstance.post('/api/users/auth/logout', {
                    refresh_token: refreshToken
                });
            } catch (error) {
                console.error('Logout error:', error);
            }
        }

        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        setAuth({ loading: false, data: null });
    };

    useEffect(() => {
        const initializeAuth = async () => {
            const token = localStorage.getItem('access_token');
            const userData = localStorage.getItem('user');

            if (token && userData) {
                try {
                    const response = await axiosInstance.get('/api/users/auth/me');
                    setAuth({ loading: false, data: response.data.username });
                } catch (error) {
                    console.error('Auth initialization error:', error);
                    await logout();
                }
            } else {
                setAuth({ loading: false, data: null });
            }
        };

        initializeAuth();
    }, []);

    return (
        <AuthContext.Provider value={{
            auth,
            setAuthData,
            setTokens,
            logout,
            isAuthenticated
        }}>
            {children}
        </AuthContext.Provider>
    );
};
export default AuthProvider;