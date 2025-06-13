// server/index.js
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const jwt = require('jsonwebtoken'); // You need this here to define jwtSecret
// Make sure these paths are correct relative to index.js
const { setupWebSocket, broadcastMessage, getRoomClients } = require('./utils/websocketHandler');
const authRoutes = require('./routes/authRoutes');
const roomRoutes = require('./routes/roomRoutes');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server }); // Attach WebSocket server to the HTTP server

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey'; // DEFINE JWT SECRET HERE

// Middleware
app.use(express.json()); // For parsing JSON request bodies

// Instead of app.set, pass it directly or use a global constant
// app.set('wss', wss); // Not strictly needed to pass WSS around like this
app.set('jwtSecret', JWT_SECRET); // Still good to have for REST routes

// Setup WebSocket connection handling, passing wss and JWT_SECRET
setupWebSocket(wss, JWT_SECRET); // <--- MODIFIED HERE: Pass JWT_SECRET

// REST API Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);

// Serve static files (for the client-side, in a real app, this would be a separate frontend server)
app.use(express.static('../client'));

// Start the HTTP server
server.listen(PORT, () => {
    console.log(`HTTP Server running on port ${PORT}`);
    console.log(`WebSocket Server also running on the same port ${PORT}`);
});

// Basic error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});