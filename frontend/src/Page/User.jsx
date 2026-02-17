import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import AuthContext from "./contexts/file";
import '../Style/userprofile.components.modul.css';

function UserProfile() {
    const navigate = useNavigate();
    const { auth, setAuthData } = useContext(AuthContext);

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('profile');
    const [watchHistory, setWatchHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyPagination, setHistoryPagination] = useState({
        skip: 0,
        limit: 20,
        hasMore: true
    });


    useEffect(() => {
        if (auth?.data) {
            fetchUserProfile();
        } else {
            navigate('/login');
        }
    }, [auth]);

    useEffect(() => {
        if (activeTab === 'history' && user) {
            fetchWatchHistory();
        }
    }, [activeTab, historyPagination.skip, user]);

    const fetchUserProfile = async () => {
        try {
            const response = await axios.get('http://localhost:8000/api/users/auth/me', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            setUser(response.data);
        } catch (err) {
            setError('Failed to load profile');
            console.error('Error loading profile:', err);

            if (err.response?.status === 401) {
                handleLogout();
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchWatchHistory = async () => {
        if (!user) return;

        setHistoryLoading(true);
        try {
            const response = await axios.get(
                `http://localhost:8000/api/users/${user.id}/history`,
                {
                    params: {
                        skip: historyPagination.skip,
                        limit: historyPagination.limit
                    },
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            if (historyPagination.skip === 0) {
                setWatchHistory(response.data);
            } else {
                setWatchHistory(prev => [...prev, ...response.data]);
            }

            setHistoryPagination(prev => ({
                ...prev,
                hasMore: response.data.length === prev.limit
            }));
        } catch (err) {
            console.error('Error loading watch history:', err);
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleLogout = async () => {
        const refreshToken = localStorage.getItem('refresh_token');

        try {
            if (refreshToken) {
                await axios.post('http://localhost:8000/api/users/auth/logout', {
                    refresh_token: refreshToken
                });
            }
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            localStorage.removeItem('token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user');

            setAuthData(null);

            navigate('/login');
        }
    };

    const loadMoreHistory = () => {
        setHistoryPagination(prev => ({
            ...prev,
            skip: prev.skip + prev.limit
        }));
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <div className="profile-container">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Loading profile...</p>
                </div>
            </div>
        );
    }

    if (error || !user) {
        return (
            <div className="profile-container">
                <div className="profile-alert error">
                    {error || 'User not found'}
                </div>
                <button onClick={() => navigate('/')} className="back-button">
                    ← Go to home
                </button>
            </div>
        );
    }

    return (
        <div className="profile-container">
            {/* Профиль */}
            <div className="profile-header">
                <div className="profile-avatar">
                    <div className="avatar-large">
                        {user.username.charAt(0).toUpperCase()}
                    </div>
                </div>
                <div className="profile-title">
                    <h1 className="profile-username">
                        Hello, {user.username}!
                        {auth?.data && <span className="profile-greeting"> 👋</span>}
                    </h1>
                    <p className="profile-email">{user.email}</p>
                    <p className="profile-joined">
                        Joined {formatDate(user.created_at)}
                    </p>
                </div>
                <button onClick={handleLogout} className="logout-button">
                    🚪 Logout
                </button>
            </div>

            {/* Инфа */}
            <div className="profile-tabs">
                <button
                    className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
                    onClick={() => setActiveTab('profile')}
                >
                    👤 Profile
                </button>
                <button
                    className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
                    onClick={() => setActiveTab('history')}
                >
                    📜 Watch History
                </button>
            </div>

            <div className="profile-content">
                {activeTab === 'profile' && (
                    <div className="profile-info">
                        <div className="info-section">
                            <h3 className="section-title">About</h3>
                            <div className="info-grid">
                                <div className="info-item">
                                    <span className="info-label">Username</span>
                                    <span className="info-value">{user.username}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Email</span>
                                    <span className="info-value">{user.email}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">User ID</span>
                                    <span className="info-value">#{user.id}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Account status</span>
                                    <span className="info-value status-active">
                                        {user.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="info-section">
                            <h3 className="section-title">Statistics</h3>
                            <div className="stats-grid">
                                <div className="stat-card">
                                    <span className="stat-value">{watchHistory.length}</span>
                                    <span className="stat-label">Videos watched</span>
                                </div>
                                <div className="stat-card">
                                    <span className="stat-value">0</span>
                                    <span className="stat-label">Comments</span>
                                </div>
                                <div className="stat-card">
                                    <span className="stat-value">0</span>
                                    <span className="stat-label">Likes given</span>
                                </div>
                                <div className="stat-card">
                                    <span className="stat-value">
                                        {Math.floor((new Date() - new Date(user.created_at)) / (1000 * 60 * 60 * 24))}
                                    </span>
                                    <span className="stat-label">Days active</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* История */}
                {activeTab === 'history' && (
                    <div className="watch-history">
                        <h3 className="section-title">Watch History</h3>

                        {watchHistory.length === 0 ? (
                            <div className="empty-history">
                                <p>No watch history yet</p>
                                <Link to="/videos" className="browse-videos-link">
                                    Browse videos
                                </Link>
                            </div>
                        ) : (
                            <>
                                <div className="history-list">
                                    {watchHistory.map(item => (
                                        <Link
                                            to={`/video/${item.video_id}`}
                                            key={item.id}
                                            className="history-item"
                                        >
                                            <div className="history-thumbnail">
                                                {item.video?.thumbnail_url ? (
                                                    <img
                                                        src={item.video.thumbnail_url}
                                                        alt={item.video?.title}
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.src = 'https://via.placeholder.com/120x68?text=No+Image';
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="history-no-thumb">
                                                        No thumbnail
                                                    </div>
                                                )}
                                            </div>
                                            <div className="history-info">
                                                <h4 className="history-title">
                                                    {item.video?.title || 'Unknown video'}
                                                </h4>
                                                <p className="history-meta">
                                                    Watched {formatDate(item.watched_at)}
                                                </p>
                                                <div className="history-progress">
                                                    <div className="progress-bar">
                                                        <div
                                                            className="progress-fill"
                                                            style={{
                                                                width: `${(item.watch_duration / item.video?.duration) * 100}%`
                                                            }}
                                                        ></div>
                                                    </div>
                                                    <span className="progress-text">
                                                        {formatDuration(item.watch_duration)} / {formatDuration(item.video?.duration || 0)}
                                                    </span>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>

                                {historyPagination.hasMore && (
                                    <button
                                        onClick={loadMoreHistory}
                                        className="load-more-button"
                                        disabled={historyLoading}
                                    >
                                        {historyLoading ? 'Loading...' : 'Load more'}
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
}

export default UserProfile;