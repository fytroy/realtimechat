// netlify/functions/rooms-list.js
const jwt = require('jsonwebtoken');
const storage = require('./shared/storage');

const JWT_SECRET = process.env.JWT_SECRET || 'your_very_strong_and_secret_jwt_key_here';

exports.handler = async (event, context) => {
    // Handle CORS
    const headers = {
        'Access-Control-Allow-Origin': 'https://realtimechattt.netlify.app',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Credentials': 'true',
    };

    // Handle preflight OPTIONS request
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: '',
        };
    }

    // Only allow GET method
    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ message: 'Method not allowed' }),
        };
    }

    try {
        // Verify JWT token
        const authHeader = event.headers.authorization || event.headers.Authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ message: 'Authorization token required' }),
            };
        }

        const token = authHeader.substring(7);
        
        try {
            jwt.verify(token, JWT_SECRET);
        } catch (jwtError) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ message: 'Invalid or expired token' }),
            };
        }

        // Get all rooms
        const rooms = storage.getAllRooms();

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(rooms),
        };

    } catch (error) {
        console.error('Rooms list error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ message: 'Internal server error' }),
        };
    }
};

