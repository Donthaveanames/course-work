import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import AuthContext from './file';

const PrivateRoute = ({ children }) => {
    const { auth } = useContext(AuthContext);

    if (auth.loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading...</p>
            </div>
        );
    }

    const token = localStorage.getItem('access_token');

    return token ? children : <Navigate to="/login" />;
};

export default PrivateRoute;