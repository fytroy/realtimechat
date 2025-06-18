// netlify/functions/rooms-create.js
const jwt = require('jsonwebtoken');
const storage = require('./shared/storage');

const JWT_SECRET = process.env.JWT_SECRET || 'your_very_strong_and_secret_jwt_key_here';

exports.handler = async (event, context) => {
    // Handle CORS
    const headers = {
        'Access-Control-Allow-Origin': 'https://realtimechattt.netlify.app',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

    // Only allow POST method
    if (event.httpMethod !== 'POST') {
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
        let decodedToken;
        
        try {
            decodedToken = jwt.verify(token, JWT_SECRET);
        } catch (jwtError) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ message: 'Invalid or expired token' }),
            };
        }

        // Parse request body
        const { name } = JSON.parse(event.body);

        if (!name || !name.trim()) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ message: 'Room name is required' }),
            };
        }

        // Create new room
        const newRoom = {
            id: `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: name.trim(),
            creator: decodedToken.username,
            createdAt: Date.now()
        };

        storage.addRoom(newRoom);

        return {
            statusCode: 201,
            headers,
            body: JSON.stringify({ 
                message: 'Room created successfully!',
                room: newRoom
            }),
        };

    } catch (error) {
        console.error('Room creation error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ message: 'Internal server error' }),
        };
    }
};

