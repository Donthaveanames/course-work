import React, { useState, useContext, useEffect } from 'react';
import AuthContext from './contexts/file';
import { useNavigate } from 'react-router-dom';
import '../Style/login.components.modul.css';
import axiosInstance from '../services/axiosConfig';

const Auth = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [serverError, setServerError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [loginForm, setLoginForm] = useState({
        email: '',
        password: ''
    });

    const [registerForm, setRegisterForm] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    const [errors, setErrors] = useState({});

    const { setTokens, isAuthenticated } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthenticated()) {
            navigate('/personal_account');
        }
    }, [isAuthenticated, navigate]);

    const handleLoginChange = (e) => {
        const { name, value } = e.target;
        setLoginForm(prev => ({
            ...prev,
            [name]: value
        }));

        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
        if (serverError) setServerError('');
    };

    const handleRegisterChange = (e) => {
        const { name, value } = e.target;
        setRegisterForm(prev => ({
            ...prev,
            [name]: value
        }));

        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
        if (serverError) setServerError('');
        if (successMessage) setSuccessMessage('');
    };

    const validateLoginForm = () => {
        const newErrors = {};

        if (!loginForm.email) {
            newErrors.email = 'Email is required';
        } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(loginForm.email)) {
            newErrors.email = 'Please enter a valid email address';
        } else if (!loginForm.email.endsWith('@dvfu.ru') && !loginForm.email.endsWith('@students.dvfu.ru')) {
            newErrors.email = 'Please use your dvfu.ru email address';
        }

        if (!loginForm.password) {
            newErrors.password = 'Password is required';
        }

        return newErrors;
    };

    const validateRegisterForm = () => {
        const newErrors = {};

        if (!registerForm.username) {
            newErrors.username = 'Username is required';
        } else if (registerForm.username.length < 3) {
            newErrors.username = 'Username must be at least 3 characters';
        } else if (registerForm.username.length > 30) {
            newErrors.username = 'Username must be less than 30 characters';
        }

        if (!registerForm.email) {
            newErrors.email = 'Email is required';
        } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(registerForm.email)) {
            newErrors.email = 'Please enter a valid email address';
        } else if (!registerForm.email.endsWith('@dvfu.ru') && !registerForm.email.endsWith('@students.dvfu.ru')) {
            newErrors.email = 'Please use your dvfu.ru email address';
        }

        if (!registerForm.password) {
            newErrors.password = 'Password is required';
        } else if (registerForm.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        if (!registerForm.confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (registerForm.password !== registerForm.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        return newErrors;
    };

    const handleLogin = async (e) => {
        e.preventDefault();

        const validationErrors = validateLoginForm();

        if (Object.keys(validationErrors).length === 0) {
            setLoading(true);
            setServerError('');

            try {
                const response = await axiosInstance.post('/api/users/auth/login', {
                    email: loginForm.email,
                    password: loginForm.password
                });

                const { access_token, refresh_token } = response.data;

                const userResponse = await axiosInstance.get('/api/users/auth/me');

                setTokens(access_token, refresh_token, userResponse.data);

                setLoginForm({ email: '', password: '' });
                navigate('/personal_account', { replace: true });

            } catch (err) {
                if (err.response?.status === 401) {
                    setServerError('Incorrect email or password');
                } else if (err.response?.data?.detail) {
                    setServerError(err.response.data.detail);
                } else {
                    setServerError('Login failed. Please try again later.');
                }
                console.error('Login error:', err);
            } finally {
                setLoading(false);
            }
        } else {
            setErrors(validationErrors);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();

        const validationErrors = validateRegisterForm();

        if (Object.keys(validationErrors).length === 0) {
            setLoading(true);
            setServerError('');
            setSuccessMessage('');

            try {
                await axiosInstance.post('/api/users/register', {
                    username: registerForm.username,
                    email: registerForm.email,
                    password: registerForm.password
                });

                setSuccessMessage('Registration successful! You can now log in.');

                setRegisterForm({
                    username: '',
                    email: '',
                    password: '',
                    confirmPassword: ''
                });

                setTimeout(() => {
                    setIsLogin(true);
                    setSuccessMessage('');
                }, 2000);

            } catch (err) {
                if (err.response?.data?.detail === "Email already registered") {
                    setServerError('This email is already registered. Please use a different email or log in.');
                } else if (err.response?.data?.detail === "Username already taken") {
                    setServerError('This username is already taken. Please choose another one.');
                } else {
                    setServerError(err.response?.data?.detail || 'Registration failed. Please try again.');
                }
                console.error('Registration error:', err);
            } finally {
                setLoading(false);
            }
        } else {
            setErrors(validationErrors);
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const toggleConfirmPasswordVisibility = () => {
        setShowConfirmPassword(!showConfirmPassword);
    };

    const switchMode = () => {
        setIsLogin(!isLogin);
        setErrors({});
        setServerError('');
        setSuccessMessage('');
        setLoginForm({ email: '', password: '' });
        setRegisterForm({
            username: '',
            email: '',
            password: '',
            confirmPassword: ''
        });
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <h2>{isLogin ? 'Welcome Back!' : 'Create Account'}</h2>
                    <p>
                        {isLogin
                            ? 'Please login to your account'
                            : 'Sign up to start learning'}
                    </p>
                </div>

                {serverError && (
                    <div className="auth-message error">
                        {serverError}
                    </div>
                )}
                {successMessage && (
                    <div className="auth-message success">
                        {successMessage}
                    </div>
                )}

                {isLogin ? (
                    <form onSubmit={handleLogin} className="auth-form">
                        <div className="form-group">
                            <label htmlFor="login-email">
                                Email <span className="required">*</span>
                            </label>
                            <input
                                type="email"
                                id="login-email"
                                name="email"
                                value={loginForm.email}
                                onChange={handleLoginChange}
                                placeholder="username@dvfu.ru"
                                className={errors.email ? 'error' : ''}
                                disabled={loading}
                            />
                            {errors.email && (
                                <span className="error-message">{errors.email}</span>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="login-password">
                                Password <span className="required">*</span>
                            </label>
                            <div className="password-input-wrapper">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="login-password"
                                    name="password"
                                    value={loginForm.password}
                                    onChange={handleLoginChange}
                                    placeholder="Enter your password"
                                    className={errors.password ? 'error' : ''}
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={togglePasswordVisibility}
                                    tabIndex="-1"
                                >
                                    {showPassword ? '👁️' : '👁️‍🗨️'}
                                </button>
                            </div>
                            {errors.password && (
                                <span className="error-message">{errors.password}</span>
                            )}
                        </div>

                        <button
                            type="submit"
                            className={`auth-button ${loading ? 'loading' : ''}`}
                            disabled={loading}
                        >
                            {loading ? 'Logging in...' : 'Sign In'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleRegister} className="auth-form">
                        <div className="form-group">
                            <label htmlFor="register-username">
                                Username <span className="required">*</span>
                            </label>
                            <input
                                type="text"
                                id="register-username"
                                name="username"
                                value={registerForm.username}
                                onChange={handleRegisterChange}
                                placeholder="Choose a username"
                                className={errors.username ? 'error' : ''}
                                disabled={loading}
                            />
                            {errors.username && (
                                <span className="error-message">{errors.username}</span>
                            )}
                            <small className="input-hint">
                                Minimum 3 characters
                            </small>
                        </div>

                        <div className="form-group">
                            <label htmlFor="register-email">
                                Email <span className="required">*</span>
                            </label>
                            <input
                                type="email"
                                id="register-email"
                                name="email"
                                value={registerForm.email}
                                onChange={handleRegisterChange}
                                placeholder="username@dvfu.ru"
                                className={errors.email ? 'error' : ''}
                                disabled={loading}
                            />
                            {errors.email && (
                                <span className="error-message">{errors.email}</span>
                            )}
                            <small className="input-hint">
                                Use your dvfu.ru email address
                            </small>
                        </div>

                        <div className="form-group">
                            <label htmlFor="register-password">
                                Password <span className="required">*</span>
                            </label>
                            <div className="password-input-wrapper">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="register-password"
                                    name="password"
                                    value={registerForm.password}
                                    onChange={handleRegisterChange}
                                    placeholder="Create a password"
                                    className={errors.password ? 'error' : ''}
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={togglePasswordVisibility}
                                    tabIndex="-1"
                                >
                                    {showPassword ? '👁️' : '👁️‍🗨️'}
                                </button>
                            </div>
                            {errors.password && (
                                <span className="error-message">{errors.password}</span>
                            )}
                            <small className="input-hint">
                                Minimum 6 characters
                            </small>
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirm-password">
                                Confirm Password <span className="required">*</span>
                            </label>
                            <div className="password-input-wrapper">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    id="confirm-password"
                                    name="confirmPassword"
                                    value={registerForm.confirmPassword}
                                    onChange={handleRegisterChange}
                                    placeholder="Confirm your password"
                                    className={errors.confirmPassword ? 'error' : ''}
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={toggleConfirmPasswordVisibility}
                                    tabIndex="-1"
                                >
                                    {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                                </button>
                            </div>
                            {errors.confirmPassword && (
                                <span className="error-message">{errors.confirmPassword}</span>
                            )}
                        </div>

                        <button
                            type="submit"
                            className={`auth-button ${loading ? 'loading' : ''}`}
                            disabled={loading}
                        >
                            {loading ? 'Creating account...' : 'Sign Up'}
                        </button>
                    </form>
                )}

                <div className="auth-footer">
                    <p>
                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                        <button
                            onClick={switchMode}
                            className="switch-button"
                            disabled={loading}
                        >
                            {isLogin ? 'Sign Up' : 'Sign In'}
                        </button>
                    </p>
                </div>

                <div className="email-info">
                    <p>
                        <strong>Note:</strong> Only dvfu.ru email addresses are allowed.
                        <br />
                        Examples: username@dvfu.ru or username@students.dvfu.ru
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Auth;