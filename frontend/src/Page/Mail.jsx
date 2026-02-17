import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../Style/mail.components.modul.css';

function ChatList() {
    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [unreadTotal, setUnreadTotal] = useState(0);
    const [pagination, setPagination] = useState({
        skip: 0,
        limit: 50,
        hasMore: true
    });

    const navigate = useNavigate();
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        fetchChats();
        fetchUnreadCount();

        const interval = setInterval(fetchUnreadCount, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (pagination.skip > 0) {
            fetchChats();
        }
    }, [pagination.skip]);

    const fetchChats = async () => {
        try {
            const response = await axios.get('http://localhost:8000/api/chats/my', {
                params: {
                    skip: pagination.skip,
                    limit: pagination.limit
                },
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (pagination.skip === 0) {
                setChats(response.data);
            } else {
                setChats(prev => [...prev, ...response.data]);
            }

            setPagination(prev => ({
                ...prev,
                hasMore: response.data.length === prev.limit
            }));
        } catch (err) {
            setError('Failed to load chats');
            console.error('Error loading chats:', err);

            if (err.response?.status === 401) {
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchUnreadCount = async () => {
        try {
            const response = await axios.get('http://localhost:8000/api/chats/unread/count', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            setUnreadTotal(response.data);
        } catch (err) {
            console.error('Error fetching unread count:', err);
        }
    };

    const handleChatClick = (chatId) => {
        navigate(`/chat/${chatId}`);
    };

    const handleNewChat = () => {
        navigate('/users/search');
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min ago`;
        if (diffHours < 24) return `${diffHours} hours ago`;
        if (diffDays < 7) return `${diffDays} days ago`;

        return date.toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const getOtherUser = (chat) => {
        return chat.user1.id === currentUser.id ? chat.user2 : chat.user1;
    };

    const truncateText = (text, maxLength = 50) => {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    };

    if (loading && chats.length === 0) {
        return (
            <div className="chat-list-container">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Loading chats...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="chat-list-container">
            <div className="chat-list-header">
                <div className="header-left">
                    <h1 className="chat-list-title">Messages</h1>
                    {unreadTotal > 0 && (
                        <span className="unread-total-badge">
                            {unreadTotal} unread
                        </span>
                    )}
                </div>
                <button onClick={handleNewChat} className="new-chat-button">
                    + New Chat
                </button>
            </div>

            {error && (
                <div className="chat-alert error">
                    {error}
                </div>
            )}

            {chats.length === 0 ? (
                <div className="no-chats">
                    <div className="no-chats-icon">💬</div>
                    <p className="no-chats-text">No chats yet</p>
                    <p className="no-chats-subtext">
                        Start a conversation with other users
                    </p>
                    <button onClick={handleNewChat} className="start-chat-button">
                        Start a chat
                    </button>
                </div>
            ) : (
                <>
                    <div className="chats-list">
                        {chats.map(chat => {
                            const otherUser = getOtherUser(chat);
                            const isUnread = chat.unread_count > 0;

                            return (
                                <div
                                    key={chat.id}
                                    className={`chat-item ${isUnread ? 'unread' : ''}`}
                                    onClick={() => handleChatClick(chat.id)}
                                >
                                    <div className="chat-avatar">
                                        {otherUser.avatar_url ? (
                                            <img
                                                src={otherUser.avatar_url}
                                                alt={otherUser.username}
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = 'https://via.placeholder.com/50x50?text=User';
                                                }}
                                            />
                                        ) : (
                                            <div className="avatar-placeholder">
                                                {otherUser.username.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>

                                    <div className="chat-info">
                                        <div className="chat-header">
                                            <span className="chat-name">
                                                {otherUser.username}
                                            </span>
                                            <span className="chat-time">
                                                {formatDate(chat.updated_at)}
                                            </span>
                                        </div>

                                        <div className="chat-preview">
                                            {chat.last_letter ? (
                                                <>
                                                    <span className="message-sender">
                                                        {chat.last_letter.author_id === currentUser.id ? 'You: ' : ''}
                                                    </span>
                                                    <span className="message-preview">
                                                        {truncateText(chat.last_letter.content)}
                                                    </span>
                                                </>
                                            ) : (
                                                <span className="no-messages">
                                                    No messages yet
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {isUnread && (
                                        <div className="unread-badge">
                                            {chat.unread_count}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {pagination.hasMore && (
                        <button
                            onClick={() => setPagination(prev => ({
                                ...prev,
                                skip: prev.skip + prev.limit
                            }))}
                            className="load-more-button"
                            disabled={loading}
                        >
                            {loading ? 'Loading...' : 'Load more chats'}
                        </button>
                    )}
                </>
            )}
        </div>
    );
}

export default ChatList;