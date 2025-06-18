// netlify/functions/auth-register.js
const bcrypt = require('bcryptjs');
const storage = require('./shared/storage');

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
        const { email, username, password } = JSON.parse(event.body);

        if (!email || !username || !password) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ message: 'Email, username, and password are required.' }),
            };
        }

        // Check if email already exists
        if (storage.findUserByEmail(email)) {
            return {
                statusCode: 409,
                headers,
                body: JSON.stringify({ message: 'Email address already registered.' }),
            };
        }

        // Hash password and create user
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = { 
            id: Date.now().toString(), 
            email, 
            username, 
            password: hashedPassword 
        };
        
        storage.addUser(newUser);

        return {
            statusCode: 201,
            headers,
            body: JSON.stringify({ message: 'User registered successfully!' }),
        };

    } catch (error) {
        console.error('Registration error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ message: 'Internal server error' }),
        };
    }
};

