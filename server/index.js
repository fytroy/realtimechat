// server/index.js
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path'); // Import the 'path' module for handling file paths

// Import your custom modules
const { setupWebSocket, broadcastMessage, getRoomClients } = require('./utils/websocketHandler');
const authRoutes = require('./routes/authRoutes');
const roomRoutes = require('./routes/roomRoutes');

const app = express();
// Use process.env.PORT for deployment, fallback to 3000 for local development
const PORT = process.env.PORT || 3000;
// Use process.env.JWT_SECRET for deployment, fallback to a default for local development
// IMPORTANT: In production, always set JWT_SECRET as an environment variable in Railway/Render!
const JWT_SECRET = process.env.JWT_SECRET || 'your_very_strong_and_secret_jwt_key_here'; // Replace with a strong, random key in production env var

// Create HTTP server instance
const server = http.createServer(app);
// Create WebSocket server instance, attached to the HTTP server
const wss = new WebSocket.Server({ server });

// Middleware setup
app.use(express.json()); // Enable JSON body parsing for API requests

// CORS configuration - explicitly allow Netlify and localhost
const corsOptions = {
    origin: [
        'https://realtimechattt.netlify.app',  // Your Netlify deployment
        'http://localhost:8000',               // Local development
        'http://localhost:3000',               // Local development
        'http://127.0.0.1:8000',              // Local development
        'http://127.0.0.1:3000'               // Local development
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// Set JWT_SECRET as an app setting so it can be accessed by routes
app.set('jwtSecret', JWT_SECRET);

// Setup WebSocket handling
setupWebSocket(wss, JWT_SECRET);

// Mount REST API Routes
app.use('/api/auth', authRoutes); // Authentication routes (register, login)
app.use('/api/rooms', roomRoutes); // Room management routes (create, list)

// Serve static files (your frontend HTML, CSS, JS)
// This is the crucial part for serving your client-side application.
// `__dirname` is the absolute path to the directory where this index.js file resides (e.g., /opt/render/project/src/server)
// `../client` goes one directory up from 'server' to the root of your project, then into the 'client' folder.
app.use(express.static(path.join(__dirname, '../client')));

// Fallback for any other route - serve the main index.html file
// This ensures that deep links or direct navigation to app paths will still load your SPA.
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client', 'index.html'));
});


// Basic Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack); // Log the error stack for debugging
    // Send a generic error response to the client
    res.status(500).send('Something broke on the server!');
});

// Start the HTTP and WebSocket server
server.listen(PORT, () => {
    console.log(`HTTP Server running on port ${PORT}`);
    console.log(`WebSocket Server also running on the same port ${PORT}`);
});