import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../Style/videolist.components.modul.css';

function VideoList() {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [pagination, setPagination] = useState({
        skip: 0,
        limit: 20,
        sortBy: 'created_at',
        order: 'desc'
    });
    const [search, setSearch] = useState('');
    const [totalVideos, setTotalVideos] = useState(0);

    useEffect(() => {
        fetchVideos();
    }, [pagination.skip, pagination.limit, pagination.sortBy, pagination.order, search]);

    const fetchVideos = async () => {
        setLoading(true);
        try {
            const response = await axios.get('http://localhost:8000/api/video/', {
                params: {
                    skip: pagination.skip,
                    limit: pagination.limit,
                    sort_by: pagination.sortBy,
                    order: pagination.order,
                    search: search || undefined
                }
            });
            setVideos(response.data);
            setTotalVideos(response.data.length);
        } catch (err) {
            setError('Error loading videos');
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setPagination(prev => ({ ...prev, skip: 0 }));
        fetchVideos();
    };

    const handleSortChange = (e) => {
        setPagination(prev => ({
            ...prev,
            sortBy: e.target.value,
            skip: 0
        }));
    };

    const handleOrderChange = (e) => {
        setPagination(prev => ({
            ...prev,
            order: e.target.value,
            skip: 0
        }));
    };

    const handleNextPage = () => {
        setPagination(prev => ({
            ...prev,
            skip: prev.skip + prev.limit
        }));
    };

    const handlePrevPage = () => {
        setPagination(prev => ({
            ...prev,
            skip: Math.max(0, prev.skip - prev.limit)
        }));
    };

    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    if (loading && videos.length === 0) {
        return (
            <div className="video-list-container">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Loading videos...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="video-list-container">
            <div className="video-list-header">
                <h1 className="video-list-title">Video Lessons</h1>
            </div>

            {error && (
                <div className="video-alert error">
                    {error}
                </div>
            )}

            {/* фильтрация поиск */}
            <div className="video-filters">
                <form onSubmit={handleSearch} className="search-form">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search videos..."
                        className="search-input"
                    />
                    <button type="submit" className="search-button">
                        Search
                    </button>
                </form>

                <div className="sort-controls">
                    <select
                        value={pagination.sortBy}
                        onChange={handleSortChange}
                        className="sort-select"
                    >
                        <option value="created_at">By date</option>
                        <option value="title">By title</option>
                        <option value="views_count">By views</option>
                    </select>

                    <select
                        value={pagination.order}
                        onChange={handleOrderChange}
                        className="sort-select"
                    >
                        <option value="desc">Descending</option>
                        <option value="asc">Ascending</option>
                    </select>
                </div>
            </div>

            {/* оформление */}
            {videos.length === 0 ? (
                <div className="no-videos">
                    <p>No videos found</p>
                </div>
            ) : (
                <>
                    <div className="video-grid">
                        {videos.map(video => (
                            <Link to={`/video_lesson/${video.id}`} key={video.id} className="video-card">
                                <div className="video-thumbnail">
                                    {video.thumbnail_url ? (
                                        <img
                                            src={video.thumbnail_url}
                                            alt={video.title}
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = 'https://via.placeholder.com/320x180?text=No+Image';
                                            }}
                                        />
                                    ) : (
                                        <div className="no-thumbnail">
                                            <span>No thumbnail</span>
                                        </div>
                                    )}
                                    <span className="video-duration">
                                        {formatDuration(video.duration)}
                                    </span>
                                </div>

                                <div className="video-info">
                                    <h3 className="video-title">{video.title}</h3>

                                    <div className="video-meta">
                                        <span className="video-author">
                                            {video.author_name}
                                        </span>
                                        <span className="video-date">
                                            {formatDate(video.created_at)}
                                        </span>
                                    </div>

                                    <div className="video-stats">
                                        <span className="video-views">
                                            👁 {video.views_count} views
                                        </span>
                                        <span className="video-comments">
                                            💬 {video.comments_count} comments
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>

                    {/* Пг */}
                    <div className="pagination">
                        <button
                            onClick={handlePrevPage}
                            disabled={pagination.skip === 0}
                            className="pagination-button"
                        >
                            ← Previous
                        </button>
                        <span className="pagination-info">
                            Page {Math.floor(pagination.skip / pagination.limit) + 1}
                        </span>
                        <button
                            onClick={handleNextPage}
                            disabled={videos.length < pagination.limit}
                            className="pagination-button"
                        >
                            Next →
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

export default VideoList;