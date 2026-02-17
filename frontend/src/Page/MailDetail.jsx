import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import '../Style/maildetail.components.modul.css';

function ChatDetail() {
    const { chatId } = useParams();
    const navigate = useNavigate();
    const messagesEndRef = useRef(null);
    const [chat, setChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [editingMessage, setEditingMessage] = useState(null);
    const [editContent, setEditContent] = useState('');
    const [pagination, setPagination] = useState({
        skip: 0,
        limit: 50,
        hasMore: true
    });
    const [loadingMore, setLoadingMore] = useState(false);

    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        fetchChat();
        fetchMessages();

        const interval = setInterval(fetchMessages, 10000);
        return () => clearInterval(interval);
    }, [chatId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchChat = async () => {
        try {
            const response = await axios.get(`http://localhost:8000/api/chats/with/${chatId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            setChat(response.data);
        } catch (err) {
            setError('Failed to load chat');
            console.error('Error loading chat:', err);

            if (err.response?.status === 401) {
                navigate('/login');
            }
        }
    };

    const fetchMessages = async () => {
        try {
            const response = await axios.get(`http://localhost:8000/api/chats/${chatId}/letters/`, {
                params: {
                    skip: pagination.skip,
                    limit: pagination.limit
                },
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (pagination.skip === 0) {
                setMessages(response.data);
            } else {
                setMessages(prev => [...prev, ...response.data]);
            }

            setPagination(prev => ({
                ...prev,
                hasMore: response.data.length === prev.limit
            }));
        } catch (err) {
            console.error('Error fetching messages:', err);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const loadMoreMessages = async () => {
        setLoadingMore(true);
        setPagination(prev => ({
            ...prev,
            skip: prev.skip + prev.limit
        }));
        await fetchMessages();
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || sending) return;

        setSending(true);
        try {
            const response = await axios.post(
                `http://localhost:8000/api/chats/${chatId}/letters/`,
                { content: newMessage },
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            setMessages(prev => [response.data, ...prev]);
            setNewMessage('');
            scrollToBottom();
        } catch (err) {
            console.error('Error sending message:', err);
            alert('Failed to send message');
        } finally {
            setSending(false);
        }
    };

    const handleEditMessage = (message) => {
        setEditingMessage(message.id);
        setEditContent(message.content);
    };

    const updateMessage = async (messageId) => {
        if (!editContent.trim()) return;

        try {
            const response = await axios.put(
                `http://localhost:8000/api/chats/${chatId}/letters/${messageId}`,
                { content: editContent },
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            setMessages(messages.map(m =>
                m.id === messageId ? response.data : m
            ));
            setEditingMessage(null);
            setEditContent('');
        } catch (err) {
            console.error('Error updating message:', err);
            alert('Failed to update message');
        }
    };

    const deleteMessage = async (messageId) => {
        if (!window.confirm('Are you sure you want to delete this message?')) return;

        try {
            await axios.delete(
                `http://localhost:8000/api/chats/${chatId}/letters/${messageId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            setMessages(messages.filter(m => m.id !== messageId));
        } catch (err) {
            console.error('Error deleting message:', err);
            alert('Failed to delete message');
        }
    };

    const markAsRead = async (messageId) => {
        try {
            await axios.post(
                `http://localhost:8000/api/chats/${chatId}/letters/${messageId}/read`,
                {},
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );
        } catch (err) {
            console.error('Error marking message as read:', err);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
        }
    };

    const groupMessagesByDate = () => {
        const groups = {};
        messages.forEach(message => {
            const date = formatDate(message.created_at);
            if (!groups[date]) {
                groups[date] = [];
            }
            groups[date].push(message);
        });
        return groups;
    };

    if (loading) {
        return (
            <div className="chat-detail-container">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Loading chat...</p>
                </div>
            </div>
        );
    }

    if (error || !chat) {
        return (
            <div className="chat-detail-container">
                <div className="chat-alert error">
                    {error || 'Chat not found'}
                </div>
                <button onClick={() => navigate('/chats')} className="back-button">
                    ← Back to chats
                </button>
            </div>
        );
    }

    const otherUser = chat.user1.id === currentUser.id ? chat.user2 : chat.user1;
    const messageGroups = groupMessagesByDate();

    return (
        <div className="chat-detail-container">
            {/* Чат */}
            <div className="chat-detail-header">
                <button onClick={() => navigate('/chats')} className="back-to-chats">
                    ←
                </button>

                <div className="chat-user-info">
                    <div className="chat-user-avatar">
                        {otherUser.avatar_url ? (
                            <img src={otherUser.avatar_url} alt={otherUser.username} />
                        ) : (
                            <div className="avatar-placeholder">
                                {otherUser.username.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                    <div className="chat-user-details">
                        <h2 className="chat-user-name">{otherUser.username}</h2>
                        <span className="chat-user-status">Online</span>
                    </div>
                </div>
            </div>

            {/* Поле для ввода сообщений */}
            <div className="messages-container">
                {pagination.hasMore && (
                    <button
                        onClick={loadMoreMessages}
                        className="load-more-messages"
                        disabled={loadingMore}
                    >
                        {loadingMore ? 'Loading...' : 'Load more messages'}
                    </button>
                )}

                {Object.entries(messageGroups).map(([date, groupMessages]) => (
                    <div key={date} className="message-group">
                        <div className="date-separator">
                            <span>{date}</span>
                        </div>

                        {groupMessages.map(message => {
                            const isOwn = message.author_id === currentUser.id;

                            if (!isOwn && !message.is_read) {
                                markAsRead(message.id);
                            }

                            return (
                                <div
                                    key={message.id}
                                    className={`message-wrapper ${isOwn ? 'own' : 'other'}`}
                                >
                                    {editingMessage === message.id ? (
                                        <div className="message-edit-form">
                                            <textarea
                                                value={editContent}
                                                onChange={(e) => setEditContent(e.target.value)}
                                                className="message-edit-input"
                                                rows="2"
                                                autoFocus
                                            />
                                            <div className="message-edit-actions">
                                                <button
                                                    onClick={() => updateMessage(message.id)}
                                                    className="save-edit-btn"
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    onClick={() => setEditingMessage(null)}
                                                    className="cancel-edit-btn"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="message-bubble">
                                            <div className="message-content">
                                                {message.content}
                                            </div>
                                            <div className="message-footer">
                                                <span className="message-time">
                                                    {formatTime(message.created_at)}
                                                </span>
                                                {isOwn && (
                                                    <span className="message-status">
                                                        {message.is_read ? '✓✓' : '✓'}
                                                    </span>
                                                )}
                                            </div>

                                            {isOwn && (
                                                <div className="message-actions">
                                                    <button
                                                        onClick={() => handleEditMessage(message)}
                                                        className="message-action-btn"
                                                        title="Edit"
                                                    >
                                                        ✏️
                                                    </button>
                                                    <button
                                                        onClick={() => deleteMessage(message.id)}
                                                        className="message-action-btn"
                                                        title="Delete"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Отправка */}
            <form onSubmit={sendMessage} className="message-input-form">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="message-input"
                    disabled={sending}
                />
                <button
                    type="submit"
                    className="send-button"
                    disabled={!newMessage.trim() || sending}
                >
                    {sending ? '...' : 'Send'}
                </button>
            </form>
        </div>
    );
}

export default ChatDetail;