// client/config.js

/**
 * Configuration file for the real-time chat application
 * Handles environment-specific settings and backend URLs
 */

const Config = {
    // Backend URL Configuration
    // You can set different URLs for different environments
    BACKEND_URLS: {
        // Production backend URL - Currently using Render until Netlify backend is deployed
        production: 'https://realtimechat-v2t1.onrender.com',
        
        // Development backend URL
        development: 'http://localhost:3000',
        
        // Staging backend URL (if you have one)
        staging: 'https://realtimechat-staging.onrender.com'
    },

    // Current environment - change this based on your deployment
    // Options: 'development', 'staging', 'production'
    ENVIRONMENT: 'production',

    // WebSocket configuration
    WS_CONFIG: {
        // Auto-reconnect settings
        autoReconnect: true,
        reconnectInterval: 3000, // 3 seconds
        maxReconnectAttempts: 10,
        
        // Connection timeout
        connectionTimeout: 10000, // 10 seconds
    },

    // API configuration
    API_CONFIG: {
        timeout: 10000, // 10 seconds
        retries: 3,
        retryDelay: 1000 // 1 second
    },

    // Application settings
    APP_CONFIG: {
        // Maximum number of messages to keep in chat history
        maxChatHistory: 100,
        
        // Maximum number of rooms to keep in room history
        maxRoomHistory: 10,
        
        // Default user preferences
        defaultPreferences: {
            theme: 'light',
            notifications: true,
            soundEnabled: true,
            autoConnect: true,
            messageLimit: 100,
            fontSize: 'medium'
        },

        // Chat settings
        maxMessageLength: 1000,
        typingIndicatorTimeout: 3000,
        
        // UI settings
        animationsEnabled: true,
        compactMode: false
    },

    // Feature flags
    FEATURES: {
        fileUpload: false,
        voiceMessages: false,
        videoChat: false,
        screenShare: false,
        privateMessages: true,
        roomSearch: true,
        userProfiles: true
    },

    /**
     * Get the current backend URL based on environment
     * @returns {string} - Backend URL
     */
    getBackendUrl() {
        return this.BACKEND_URLS[this.ENVIRONMENT] || this.BACKEND_URLS.production;
    },

    /**
     * Get the API URL
     * @returns {string} - API base URL
     */
    getApiUrl() {
        return `${this.getBackendUrl()}/api`;
    },

    /**
     * Get the WebSocket URL
     * @returns {string} - WebSocket URL
     */
    getWebSocketUrl() {
        const backendUrl = this.getBackendUrl();
        // Convert HTTPS to WSS and HTTP to WS
        return backendUrl.replace('https://', 'wss://').replace('http://', 'ws://');
    },

    /**
     * Check if we're running in development mode
     * @returns {boolean}
     */
    isDevelopment() {
        return this.ENVIRONMENT === 'development';
    },

    /**
     * Check if we're running in production mode
     * @returns {boolean}
     */
    isProduction() {
        return this.ENVIRONMENT === 'production';
    },

    /**
     * Get feature flag status
     * @param {string} feature - Feature name
     * @returns {boolean} - Whether feature is enabled
     */
    isFeatureEnabled(feature) {
        return this.FEATURES[feature] || false;
    },

    /**
     * Override configuration for specific deployment
     * This function can be called to update config at runtime
     * @param {Object} overrides - Configuration overrides
     */
    override(overrides) {
        // Deep merge the overrides
        if (overrides.BACKEND_URLS) {
            Object.assign(this.BACKEND_URLS, overrides.BACKEND_URLS);
        }
        if (overrides.ENVIRONMENT) {
            this.ENVIRONMENT = overrides.ENVIRONMENT;
        }
        if (overrides.WS_CONFIG) {
            Object.assign(this.WS_CONFIG, overrides.WS_CONFIG);
        }
        if (overrides.API_CONFIG) {
            Object.assign(this.API_CONFIG, overrides.API_CONFIG);
        }
        if (overrides.APP_CONFIG) {
            Object.assign(this.APP_CONFIG, overrides.APP_CONFIG);
        }
        if (overrides.FEATURES) {
            Object.assign(this.FEATURES, overrides.FEATURES);
        }

        console.log('Configuration updated:', {
            environment: this.ENVIRONMENT,
            backendUrl: this.getBackendUrl(),
            apiUrl: this.getApiUrl(),
            wsUrl: this.getWebSocketUrl()
        });
    }
};

// Auto-detect environment based on hostname (for Netlify deployment)
if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        Config.ENVIRONMENT = 'development';
    } else if (hostname.includes('netlify.app') || hostname.includes('netlify.com')) {
        // This is a Netlify deployment
        Config.ENVIRONMENT = 'production';
    } else if (hostname.includes('staging') || hostname.includes('dev')) {
        Config.ENVIRONMENT = 'staging';
    }
}

// Log current configuration in development
if (Config.isDevelopment()) {
    console.log('Chat App Configuration:', {
        environment: Config.ENVIRONMENT,
        backendUrl: Config.getBackendUrl(),
        apiUrl: Config.getApiUrl(),
        wsUrl: Config.getWebSocketUrl(),
        features: Config.FEATURES
    });
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Config;
}

