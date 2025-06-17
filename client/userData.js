// client/userData.js

/**
 * User Data Management Module
 * Handles local storage and management of user data for the real-time chat application
 */

class UserData {
    constructor() {
        this.storagePrefix = 'realtimechat_';
        this.init();
    }

    /**
     * Initialize user data from localStorage
     */
    init() {
        this.loadUserData();
    }

    /**
     * Load user data from localStorage
     */
    loadUserData() {
        this.accessToken = localStorage.getItem(`${this.storagePrefix}accessToken`);
        this.currentUser = localStorage.getItem(`${this.storagePrefix}currentUser`);
        this.currentUserEmail = localStorage.getItem(`${this.storagePrefix}currentUserEmail`);
        this.userId = localStorage.getItem(`${this.storagePrefix}userId`);
        this.userPreferences = this.loadUserPreferences();
        this.chatHistory = this.loadChatHistory();
    }

    /**
     * Save authentication data
     * @param {string} token - JWT access token
     * @param {string} username - User's username
     * @param {string} email - User's email
     * @param {string} userId - User's unique ID
     */
    saveAuthData(token, username, email, userId = null) {
        this.accessToken = token;
        this.currentUser = username;
        this.currentUserEmail = email;
        this.userId = userId;

        localStorage.setItem(`${this.storagePrefix}accessToken`, token);
        localStorage.setItem(`${this.storagePrefix}currentUser`, username);
        localStorage.setItem(`${this.storagePrefix}currentUserEmail`, email);
        if (userId) {
            localStorage.setItem(`${this.storagePrefix}userId`, userId);
        }
    }

    /**
     * Clear all user authentication data
     */
    clearAuthData() {
        this.accessToken = null;
        this.currentUser = null;
        this.currentUserEmail = null;
        this.userId = null;

        localStorage.removeItem(`${this.storagePrefix}accessToken`);
        localStorage.removeItem(`${this.storagePrefix}currentUser`);
        localStorage.removeItem(`${this.storagePrefix}currentUserEmail`);
        localStorage.removeItem(`${this.storagePrefix}userId`);
    }

    /**
     * Check if user is authenticated
     * @returns {boolean} - True if user has valid auth data
     */
    isAuthenticated() {
        return !!(this.accessToken && this.currentUser && this.currentUserEmail);
    }

    /**
     * Get user authentication data
     * @returns {Object} - User auth data object
     */
    getAuthData() {
        return {
            accessToken: this.accessToken,
            currentUser: this.currentUser,
            currentUserEmail: this.currentUserEmail,
            userId: this.userId
        };
    }

    /**
     * Load user preferences from localStorage
     * @returns {Object} - User preferences object
     */
    loadUserPreferences() {
        const savedPrefs = localStorage.getItem(`${this.storagePrefix}preferences`);
        const defaultPreferences = {
            theme: 'light',
            notifications: true,
            soundEnabled: true,
            autoConnect: true,
            messageLimit: 100,
            fontSize: 'medium'
        };

        if (savedPrefs) {
            try {
                return { ...defaultPreferences, ...JSON.parse(savedPrefs) };
            } catch (error) {
                console.error('Error loading user preferences:', error);
                return defaultPreferences;
            }
        }
        return defaultPreferences;
    }

    /**
     * Save user preferences
     * @param {Object} preferences - User preferences object
     */
    saveUserPreferences(preferences) {
        this.userPreferences = { ...this.userPreferences, ...preferences };
        localStorage.setItem(`${this.storagePrefix}preferences`, JSON.stringify(this.userPreferences));
    }

    /**
     * Get user preferences
     * @returns {Object} - User preferences object
     */
    getUserPreferences() {
        return this.userPreferences;
    }

    /**
     * Load chat history from localStorage
     * @returns {Array} - Array of recent chat messages
     */
    loadChatHistory() {
        const savedHistory = localStorage.getItem(`${this.storagePrefix}chatHistory`);
        if (savedHistory) {
            try {
                return JSON.parse(savedHistory);
            } catch (error) {
                console.error('Error loading chat history:', error);
                return [];
            }
        }
        return [];
    }

    /**
     * Add message to chat history
     * @param {Object} message - Message object
     */
    addToChatHistory(message) {
        this.chatHistory.push({
            ...message,
            timestamp: message.timestamp || Date.now(),
            id: message.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        });

        // Keep only the last 100 messages to prevent localStorage from growing too large
        const maxHistory = this.userPreferences.messageLimit || 100;
        if (this.chatHistory.length > maxHistory) {
            this.chatHistory = this.chatHistory.slice(-maxHistory);
        }

        this.saveChatHistory();
    }

    /**
     * Save chat history to localStorage
     */
    saveChatHistory() {
        localStorage.setItem(`${this.storagePrefix}chatHistory`, JSON.stringify(this.chatHistory));
    }

    /**
     * Clear chat history
     */
    clearChatHistory() {
        this.chatHistory = [];
        localStorage.removeItem(`${this.storagePrefix}chatHistory`);
    }

    /**
     * Get recent chat history
     * @param {number} limit - Number of recent messages to return
     * @returns {Array} - Array of recent chat messages
     */
    getRecentChatHistory(limit = 50) {
        return this.chatHistory.slice(-limit);
    }

    /**
     * Save room join history
     * @param {string} roomId - Room ID
     * @param {string} roomName - Room name
     */
    addToRoomHistory(roomId, roomName) {
        const roomHistory = this.getRoomHistory();
        const existingIndex = roomHistory.findIndex(room => room.id === roomId);
        
        const roomData = {
            id: roomId,
            name: roomName,
            lastJoined: Date.now()
        };

        if (existingIndex >= 0) {
            roomHistory[existingIndex] = roomData;
        } else {
            roomHistory.push(roomData);
        }

        // Keep only the last 10 rooms
        const maxRooms = 10;
        if (roomHistory.length > maxRooms) {
            roomHistory.sort((a, b) => b.lastJoined - a.lastJoined);
            roomHistory.splice(maxRooms);
        }

        localStorage.setItem(`${this.storagePrefix}roomHistory`, JSON.stringify(roomHistory));
    }

    /**
     * Get room join history
     * @returns {Array} - Array of recently joined rooms
     */
    getRoomHistory() {
        const savedRooms = localStorage.getItem(`${this.storagePrefix}roomHistory`);
        if (savedRooms) {
            try {
                return JSON.parse(savedRooms);
            } catch (error) {
                console.error('Error loading room history:', error);
                return [];
            }
        }
        return [];
    }

    /**
     * Clear all user data
     */
    clearAllData() {
        // Clear auth data
        this.clearAuthData();
        
        // Clear other data
        this.chatHistory = [];
        this.userPreferences = this.loadUserPreferences(); // Reset to defaults
        
        // Remove from localStorage
        localStorage.removeItem(`${this.storagePrefix}preferences`);
        localStorage.removeItem(`${this.storagePrefix}chatHistory`);
        localStorage.removeItem(`${this.storagePrefix}roomHistory`);
    }

    /**
     * Export user data (for backup purposes)
     * @returns {Object} - Complete user data object
     */
    exportUserData() {
        return {
            authData: this.getAuthData(),
            preferences: this.userPreferences,
            chatHistory: this.chatHistory,
            roomHistory: this.getRoomHistory(),
            exportDate: new Date().toISOString()
        };
    }

    /**
     * Import user data (for restore purposes)
     * @param {Object} userData - User data object to import
     */
    importUserData(userData) {
        try {
            if (userData.authData) {
                const { accessToken, currentUser, currentUserEmail, userId } = userData.authData;
                if (accessToken && currentUser && currentUserEmail) {
                    this.saveAuthData(accessToken, currentUser, currentUserEmail, userId);
                }
            }

            if (userData.preferences) {
                this.saveUserPreferences(userData.preferences);
            }

            if (userData.chatHistory && Array.isArray(userData.chatHistory)) {
                this.chatHistory = userData.chatHistory;
                this.saveChatHistory();
            }

            if (userData.roomHistory && Array.isArray(userData.roomHistory)) {
                localStorage.setItem(`${this.storagePrefix}roomHistory`, JSON.stringify(userData.roomHistory));
            }

            console.log('User data imported successfully');
        } catch (error) {
            console.error('Error importing user data:', error);
            throw new Error('Failed to import user data');
        }
    }
}

// Create and export a singleton instance
const userData = new UserData();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = userData;
}

