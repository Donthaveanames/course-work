const API_BASE_URL = 'http://localhost:8000';

export const API_ENDPOINTS = {
    // Аутентификация
    LOGIN: `${API_BASE_URL}/api/users/auth/login`,
    REGISTER: `${API_BASE_URL}/api/users/register`,
    LOGOUT: `${API_BASE_URL}/api/users/auth/logout`,
    REFRESH: `${API_BASE_URL}/api/users/auth/refresh`,
    ME: `${API_BASE_URL}/api/users/auth/me`,

    // Пользователи
    USERS: `${API_BASE_URL}/api/users`,
    USER: (id) => `${API_BASE_URL}/api/users/${id}`,
    USER_HISTORY: (id) => `${API_BASE_URL}/api/users/${id}/history`,

    // Видео
    VIDEOS: `${API_BASE_URL}/api/video`,
    VIDEO: (id) => `${API_BASE_URL}/api/video/${id}`,
    VIDEO_IMPORT: `${API_BASE_URL}/api/video/import`,
    VIDEO_UPLOAD: `${API_BASE_URL}/api/video/upload`,
    VIDEO_UPDATE: `${API_BASE_URL}/api/video/update`,
    VIDEO_WATCH: (id) => `${API_BASE_URL}/api/video/${id}/watch`,

    // Чаты
    CHATS: `${API_BASE_URL}/api/chats/my`,
    CHAT_WITH: (userId) => `${API_BASE_URL}/api/chats/with/${userId}`,
    CHAT: (chatId) => `${API_BASE_URL}/api/chats/${chatId}`,
    UNREAD_COUNT: `${API_BASE_URL}/api/chats/unread/count`,

    // Сообщения
    LETTERS: (chatId) => `${API_BASE_URL}/api/chats/${chatId}/letters`,
    LETTER: (chatId, letterId) => `${API_BASE_URL}/api/chats/${chatId}/letters/${letterId}`,
    LETTER_READ: (chatId, letterId) => `${API_BASE_URL}/api/chats/${chatId}/letters/${letterId}/read`,

    // Комментарии
    COMMENTS: (videoId) => `${API_BASE_URL}/api/video/${videoId}/comments`,
    COMMENT: (videoId, commentId) => `${API_BASE_URL}/api/video/${videoId}/comments/${commentId}`,
    CREATE_COMMENT: (videoId) => `${API_BASE_URL}/api/video/${videoId}/comments/create_comment`,
    DELETE_COMMENT: (videoId, commentId) => `${API_BASE_URL}/api/video/${videoId}/comments/delete_comment/${commentId}`,
};

export default API_BASE_URL;