// netlify/functions/auth-login.js
const bcrypt = require('bcryptjs');
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
        const { email, password } = JSON.parse(event.body);

        if (!email || !password) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ message: 'Email and password are required.' }),
            };
        }

        // Find user by email
        const user = storage.findUserByEmail(email);
        
        if (!user) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ message: 'Invalid credentials.' }),
            };
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ message: 'Invalid credentials.' }),
            };
        }

        // Create JWT token
        const accessToken = jwt.sign(
            { id: user.id, email: user.email, username: user.username }, 
            JWT_SECRET, 
            { expiresIn: '1h' }
        );

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ accessToken }),
        };

    } catch (error) {
        console.error('Login error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ message: 'Internal server error' }),
        };
    }
};

