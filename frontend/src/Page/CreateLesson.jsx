import { useState } from 'react';
import axios from 'axios';

import '../Style/createlesson.components.modul.css'

function CreateLesson() {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        video_url: '',
        thumbnail_url: '',
        duration: 0
    });

    const [uploadType, setUploadType] = useState('import');
    const [videoFile, setVideoFile] = useState(null);
    const [thumbnailFile, setThumbnailFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleVideoFileChange = (e) => {
        const file = e.target.files[0];
        setVideoFile(file);

        if (file && !formData.title) {
            const fileName = file.name.replace(/\.[^/.]+$/, "");
            setFormData(prev => ({
                ...prev,
                title: fileName
            }));
        }
    };

    const handleThumbnailChange = (e) => {
        setThumbnailFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            let response;

            if (uploadType === 'import') {
                response = await axios.post('http://localhost:8000/video/import', formData, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
            } else {
                const uploadFormData = new FormData();

                uploadFormData.append('video_data', new Blob([JSON.stringify({
                    title: formData.title,
                    description: formData.description,
                    video_url: '',
                    thumbnail_url: '',
                    duration: formData.duration
                })], { type: 'application/json' }));

                if (videoFile) {
                    uploadFormData.append('video_file', videoFile);
                }
                if (thumbnailFile) {
                    uploadFormData.append('thumbnail_file', thumbnailFile);
                }

                response = await axios.post('http://localhost:8000/video/upload', uploadFormData, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'multipart/form-data'
                    }
                });
            }

            setSuccess('Видео успешно загружено!');
            console.log('Ответ сервера:', response.data);

            setFormData({
                title: '',
                description: '',
                video_url: '',
                thumbnail_url: '',
                duration: 0
            });
            setVideoFile(null);
            setThumbnailFile(null);

            document.getElementById('videoFile').value = '';
            document.getElementById('thumbnailFile').value = '';

        } catch (err) {
            setError(err.response?.data?.detail || 'Ошибка при загрузке видео');
            console.error('Ошибка:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="create-lesson-container">
            <h2 className="create-lesson-title">Creating a lesson</h2>
            <p className="create-lesson-subtitle">Fill in the information about your video</p>

            {error && (
                <div className="lesson-alert error">
                    {error}
                </div>
            )}

            {success && (
                <div className="lesson-alert success">
                    {success}
                </div>
            )}

            <div className="upload-type-group">
                <label className="upload-type-label">
                    Download method:
                </label>
                <div className="upload-type-options">
                    <label className="upload-type-option">
                        <input
                            type="radio"
                            value="import"
                            checked={uploadType === 'import'}
                            onChange={(e) => setUploadType(e.target.value)}
                        />
                        <span>Import by link</span>
                    </label>
                    <label className="upload-type-option">
                        <input
                            type="radio"
                            value="upload"
                            checked={uploadType === 'upload'}
                            onChange={(e) => setUploadType(e.target.value)}
                        />
                        <span>Upload a file</span>
                    </label>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                {/* Название видео */}
                <div className="form-group">
                    <label className="form-group-label required">
                        Name of the video
                    </label>
                    <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        required
                        className="form-input"
                        placeholder="Enter video name"
                    />
                </div>

                {/* Описание */}
                <div className="form-group">
                    <label className="form-group-label">
                        Description
                    </label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows="4"
                        className="form-textarea"
                        placeholder="Enter video description"
                    />
                </div>

                {/* Длительность */}
                <div className="form-group">
                    <label className="form-group-label">
                        Time (seconds)
                    </label>
                    <input
                        type="number"
                        name="duration"
                        value={formData.duration}
                        onChange={handleInputChange}
                        min="0"
                        className="form-input"
                        placeholder="Duration in seconds"
                    />
                    <div className="field-hint">
                        Specify the duration of the video in seconds
                    </div>
                </div>

                {/* Поля для импорта */}
                {uploadType === 'import' ? (
                    <>
                        <div className="form-group">
                            <label className="form-group-label required">
                                Video URL
                            </label>
                            <input
                                type="url"
                                name="video_url"
                                value={formData.video_url}
                                onChange={handleInputChange}
                                required
                                className="form-input"
                                placeholder="https://example.com/video.mp4"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-group-label">
                                Thumbnail URL
                            </label>
                            <input
                                type="url"
                                name="thumbnail_url"
                                value={formData.thumbnail_url}
                                onChange={handleInputChange}
                                className="form-input"
                                placeholder="https://example.com/thumbnail.jpg"
                            />
                        </div>
                    </>
                ) : (
                    <>
                        {/* Загрузка видео файла */}
                        <div className="form-group">
                            <label className="form-group-label required">
                                Video file
                            </label>
                            <div className="file-input-wrapper">
                                <input
                                    type="file"
                                    id="videoFile"
                                    accept="video/*"
                                    onChange={handleVideoFileChange}
                                    required
                                    className="file-input"
                                />
                                <label htmlFor="videoFile" className="file-input-label">
                                    Choose video file
                                </label>
                            </div>
                            {videoFile && (
                                <div className="file-info">
                                    Selected: {videoFile.name}
                                </div>
                            )}
                        </div>

                        {/* Загрузка превью */}
                        <div className="form-group">
                            <label className="form-group-label">
                                Thumbnail (image)
                            </label>
                            <div className="file-input-wrapper">
                                <input
                                    type="file"
                                    id="thumbnailFile"
                                    accept="image/*"
                                    onChange={handleThumbnailChange}
                                    className="file-input"
                                />
                                <label htmlFor="thumbnailFile" className="file-input-label">
                                    Choose thumbnail image
                                </label>
                            </div>
                            {thumbnailFile && (
                                <div className="file-info">
                                    Selected: {thumbnailFile.name}
                                </div>
                            )}
                        </div>
                    </>
                )}

                <div className="form-divider"></div>

                {/* Кнопка отправки */}
                <button
                    type="submit"
                    disabled={loading}
                    className={`submit-button ${loading ? 'loading' : ''}`}
                >
                    {loading ? 'Loading...' : uploadType === 'import' ? 'Import Video' : 'Upload Video'}
                </button>
            </form>
        </div>
    );
}

export default CreateLesson;