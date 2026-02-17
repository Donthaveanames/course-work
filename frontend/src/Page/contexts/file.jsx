import { createContext } from 'react';

const AuthContext = createContext({
    auth: { loading: true, data: null },
    setAuthData: () => { },
    setTokens: () => { },
    logout: () => { },
    isAuthenticated: () => false,
});

export default AuthContext;