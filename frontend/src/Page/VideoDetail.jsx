import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './Style/videodetail.components.modul.css';

function VideoDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [video, setVideo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        title: '',
        description: ''
    });
    const [watchProgress, setWatchProgress] = useState(0);

    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editingCommentContent, setEditingCommentContent] = useState('');
    const [commentsLoading, setCommentsLoading] = useState(false);
    const [commentsPagination, setCommentsPagination] = useState({
        skip: 0,
        limit: 50,
        hasMore: true
    });

    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        fetchVideo();
        checkCurrentUser();
    }, [id]);

    useEffect(() => {
        if (video) {
            fetchComments();
        }
    }, [video, commentsPagination.skip]);

    const fetchVideo = async () => {
        try {
            const response = await axios.get(`http://localhost:8000/api/video/${id}`);
            setVideo(response.data);
            setEditForm({
                title: response.data.title,
                description: response.data.description || ''
            });
        } catch (err) {
            setError('Video not found');
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchComments = async () => {
        setCommentsLoading(true);
        try {
            const response = await axios.get(
                `http://localhost:8000/api/video/${id}/comments/`,
                {
                    params: {
                        skip: commentsPagination.skip,
                        limit: commentsPagination.limit
                    }
                }
            );

            if (commentsPagination.skip === 0) {
                setComments(response.data);
            } else {
                setComments(prev => [...prev, ...response.data]);
            }

            setCommentsPagination(prev => ({
                ...prev,
                hasMore: response.data.length === prev.limit
            }));
        } catch (err) {
            console.error('Error loading comments:', err);
        } finally {
            setCommentsLoading(false);
        }
    };

    const checkCurrentUser = () => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (token && userData) {
            try {
                setCurrentUser(JSON.parse(userData));
            } catch (e) {
                console.error('Error parsing user data:', e);
            }
        }
    };

    const handleWatchProgress = (e) => {
        if (video) {
            const progress = (e.target.currentTime / video.duration) * 100;
            setWatchProgress(progress);
        }
    };

    const trackWatch = async (completed = false) => {
        if (!currentUser) return;

        try {
            await axios.post(
                `http://localhost:8000/api/video/${id}/watch`,
                {
                    watch_duration: Math.floor((video.duration * watchProgress) / 100),
                    completed: completed || watchProgress > 90
                },
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );
        } catch (err) {
            console.error('Error tracking watch:', err);
        }
    };

    const handleVideoEnd = () => {
        trackWatch(true);
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this video?')) {
            return;
        }

        try {
            await axios.delete(`http://localhost:8000/api/video/${id}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            navigate('/videos');
        } catch (err) {
            setError('Error deleting video');
            console.error('Error:', err);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.put(
                `http://localhost:8000/api/video/update?id=${id}`,
                editForm,
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );
            setVideo(response.data);
            setIsEditing(false);
        } catch (err) {
            setError('Error updating video');
            console.error('Error:', err);
        }
    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        try {
            const response = await axios.post(
                `http://localhost:8000/api/video/${id}/comments/create_comment`,
                { content: newComment },
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            setComments([response.data, ...comments]);
            setNewComment('');
        } catch (err) {
            console.error('Error adding comment:', err);
            alert('Failed to add comment');
        }
    };

    const handleCommentEdit = (comment) => {
        setEditingCommentId(comment.id);
        setEditingCommentContent(comment.content);
    };

    const handleCommentUpdate = async (commentId) => {
        if (!editingCommentContent.trim()) return;

        try {
            const response = await axios.post(
                `http://localhost:8000/api/video/${id}/comments/${commentId}`,
                { content: editingCommentContent },
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            setComments(comments.map(c =>
                c.id === commentId ? response.data : c
            ));
            setEditingCommentId(null);
            setEditingCommentContent('');
        } catch (err) {
            console.error('Error updating comment:', err);
            alert('Failed to update comment');
        }
    };

    const handleCommentDelete = async (commentId) => {
        if (!window.confirm('Are you sure you want to delete this comment?')) return;

        try {
            await axios.delete(
                `http://localhost:8000/api/video/${id}/comments/delete_comment/${commentId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            setComments(comments.filter(c => c.id !== commentId));
        } catch (err) {
            console.error('Error deleting comment:', err);
            alert('Failed to delete comment');
        }
    };

    const handleLoadMoreComments = () => {
        setCommentsPagination(prev => ({
            ...prev,
            skip: prev.skip + prev.limit
        }));
    };

    const formatDuration = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins}:${secs.toString().padStart(2, '0')}`;
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

    if (loading) {
        return (
            <div className="video-detail-container">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Loading video...</p>
                </div>
            </div>
        );
    }

    if (error || !video) {
        return (
            <div className="video-detail-container">
                <div className="video-alert error">
                    {error || 'Video not found'}
                </div>
                <button onClick={() => navigate('/videos')} className="back-button">
                    ← Back to list
                </button>
            </div>
        );
    }

    const isAuthor = currentUser && currentUser.id === video.author_id;

    return (
        <div className="video-detail-container">
            {/* видео */}
            <div className="video-player-wrapper">
                <video
                    src={video.video_url}
                    controls
                    className="video-player"
                    onTimeUpdate={handleWatchProgress}
                    onEnded={handleVideoEnd}
                />

                {isAuthor && (
                    <div className="video-actions">
                        <button
                            onClick={() => setIsEditing(!isEditing)}
                            className="edit-button"
                        >
                            ✏️ Edit
                        </button>
                        <button
                            onClick={handleDelete}
                            className="delete-button"
                        >
                            🗑️ Delete
                        </button>
                    </div>
                )}
            </div>

            {/* инфа */}
            <div className="video-info-section">
                {isEditing ? (
                    <form onSubmit={handleUpdate} className="edit-form">
                        <input
                            type="text"
                            value={editForm.title}
                            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                            className="edit-input"
                            required
                            placeholder="Video title"
                        />
                        <textarea
                            value={editForm.description}
                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                            className="edit-textarea"
                            rows="3"
                            placeholder="Video description"
                        />
                        <div className="edit-buttons">
                            <button type="submit" className="save-button">
                                Save
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsEditing(false)}
                                className="cancel-button"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                ) : (
                    <>
                        <h1 className="video-detail-title">{video.title}</h1>

                        <div className="video-meta-info">
                            <div className="video-author-info">
                                <span className="video-author-name">
                                    {video.author_name}
                                </span>
                                <span className="video-publish-date">
                                    {formatDate(video.created_at)}
                                </span>
                            </div>

                            <div className="video-stats-info">
                                <span className="video-views-count">
                                    👁 {video.views_count} views
                                </span>
                                <span className="video-likes-count">
                                    ❤️ {video.likes_count} likes
                                </span>
                                <span className="video-duration-info">
                                    ⏱️ {formatDuration(video.duration)}
                                </span>
                            </div>
                        </div>

                        {video.description && (
                            <div className="video-description">
                                <h3>Description</h3>
                                <p>{video.description}</p>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* комментарии */}
            <div className="comments-section">
                <h3 className="comments-title">
                    Comments ({comments.length})
                </h3>

                {currentUser ? (
                    <form onSubmit={handleCommentSubmit} className="comment-form">
                        <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Write a comment..."
                            className="comment-input"
                            rows="3"
                            maxLength="1000"
                        />
                        <button type="submit" className="comment-submit">
                            Post Comment
                        </button>
                    </form>
                ) : (
                    <p className="login-to-comment">
                        <Link to="/login">Sign in</Link> to leave a comment
                    </p>
                )}

                <div className="comments-list">
                    {comments.length === 0 ? (
                        <p className="no-comments">No comments yet. Be the first to comment!</p>
                    ) : (
                        <>
                            {comments.map(comment => (
                                <div key={comment.id} className="comment-item">
                                    {editingCommentId === comment.id ? (
                                        <div className="comment-edit-form">
                                            <textarea
                                                value={editingCommentContent}
                                                onChange={(e) => setEditingCommentContent(e.target.value)}
                                                className="comment-edit-input"
                                                rows="2"
                                            />
                                            <div className="comment-edit-actions">
                                                <button
                                                    onClick={() => handleCommentUpdate(comment.id)}
                                                    className="comment-save-btn"
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    onClick={() => setEditingCommentId(null)}
                                                    className="comment-cancel-btn"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="comment-header">
                                                <span className="comment-author">
                                                    {comment.author_name}
                                                </span>
                                                <span className="comment-date">
                                                    {formatDate(comment.created_at)}
                                                </span>
                                                {currentUser && currentUser.id === comment.author_id && (
                                                    <div className="comment-actions">
                                                        <button
                                                            onClick={() => handleCommentEdit(comment)}
                                                            className="comment-edit-btn"
                                                            title="Edit comment"
                                                        >
                                                            ✏️
                                                        </button>
                                                        <button
                                                            onClick={() => handleCommentDelete(comment.id)}
                                                            className="comment-delete-btn"
                                                            title="Delete comment"
                                                        >
                                                            🗑️
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                            <p className="comment-content">{comment.content}</p>
                                            {comment.updated_at !== comment.created_at && (
                                                <span className="comment-edited">(edited)</span>
                                            )}
                                        </>
                                    )}
                                </div>
                            ))}

                            {commentsPagination.hasMore && (
                                <button
                                    onClick={handleLoadMoreComments}
                                    className="load-more-comments"
                                    disabled={commentsLoading}
                                >
                                    {commentsLoading ? 'Loading...' : 'Load more comments'}
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* <- */}
            <button onClick={() => navigate('/videos')} className="back-to-list">
                ← Back to video list
            </button>
        </div>
    );
}

export default VideoDetail;