// server/utils/websocketHandler.js
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const { users } = require('../data/users');
const { rooms, addMessageToRoom, getRoomMessages } = require('../data/rooms');

// Store connected WebSocket clients with their user info and subscribed rooms
const clients = new Map(); // Map: ws -> { userId, email, username, activeRoomId }
const roomClients = new Map(); // Map: roomId -> Set<ws>

// Modify setupWebSocket to accept jwtSecret directly
const setupWebSocket = (wss, jwtSecret) => { // <--- MODIFIED HERE: Accept jwtSecret
    wss.on('connection', (ws, req) => {
        console.log('New WebSocket client connected. Waiting for authentication.');

        ws.on('message', (message) => {
            try {
                const parsedMessage = JSON.parse(message.toString());
                const { type, payload } = parsedMessage;

                switch (type) {
                    case 'authenticate':
                        // Pass jwtSecret directly to handleAuthentication
                        handleAuthentication(ws, payload.token, jwtSecret); // <--- MODIFIED HERE
                        break;
                    case 'joinRoom':
                        handleJoinRoom(ws, payload.roomId);
                        break;
                    case 'chatMessage':
                        handleChatMessage(ws, payload.roomId, payload.message);
                        break;
                    default:
                        console.log('Unknown message type:', type);
                        ws.send(JSON.stringify({ type: 'error', message: 'Unknown message type' }));
                }
            } catch (error) {
                console.error('Failed to parse WebSocket message or handle:', error);
                ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format or server error.' }));
            }
        });

        ws.on('close', () => {
            console.log('WebSocket client disconnected.');
            const clientInfo = clients.get(ws);
            if (clientInfo && clientInfo.activeRoomId) {
                const roomMembers = roomClients.get(clientInfo.activeRoomId);
                if (roomMembers) {
                    roomMembers.delete(ws);
                    if (roomMembers.size === 0) {
                        roomClients.delete(clientInfo.activeRoomId);
                    }
                    broadcastMessage(clientInfo.activeRoomId, {
                        type: 'userLeft',
                        username: clientInfo.username,
                        timestamp: Date.now()
                    });
                }
            }
            clients.delete(ws);
        });

        ws.on('error', (error) => {
            console.error('WebSocket error:', error);
        });
    });
};

// No change to handleAuthentication itself, it already accepts jwtSecret
const handleAuthentication = (ws, token, jwtSecret) => {
    if (!token) {
        ws.send(JSON.stringify({ type: 'authFailed', message: 'Authentication token required.' }));
        ws.close();
        return;
    }

    jwt.verify(token, jwtSecret, (err, user) => {
        if (err) {
            ws.send(JSON.stringify({ type: 'authFailed', message: 'Invalid or expired token.' }));
            ws.close();
        } else {
            const existingUser = users.find(u => u.id === user.id);
            if (existingUser) {
                clients.set(ws, { userId: user.id, email: user.email, username: user.username, activeRoomId: null });
                ws.send(JSON.stringify({ type: 'authenticated', message: 'Successfully authenticated.', user: { username: user.username, email: user.email } }));
                console.log(`Client ${user.username} (${user.email}) authenticated.`);
            } else {
                ws.send(JSON.stringify({ type: 'authFailed', message: 'User not found.' }));
                ws.close();
            }
        }
    });
};

// ... (rest of the file remains the same)
const handleJoinRoom = (ws, roomId) => {
    const clientInfo = clients.get(ws);
    if (!clientInfo || !clientInfo.userId) {
        ws.send(JSON.stringify({ type: 'error', message: 'Not authenticated.' }));
        return;
    }

    const room = rooms.find(r => r.id === roomId);
    if (!room) {
        ws.send(JSON.stringify({ type: 'error', message: 'Room not found.' }));
        return;
    }

    // Leave previous room if any
    if (clientInfo.activeRoomId && clientInfo.activeRoomId !== roomId) {
        const prevRoomMembers = roomClients.get(clientInfo.activeRoomId);
        if (prevRoomMembers) {
            prevRoomMembers.delete(ws);
            if (prevRoomMembers.size === 0) {
                roomClients.delete(clientInfo.activeRoomId);
            }
            broadcastMessage(clientInfo.activeRoomId, {
                type: 'userLeft',
                username: clientInfo.username,
                timestamp: Date.now()
            });
        }
    }

    // Join new room
    if (!roomClients.has(roomId)) {
        roomClients.set(roomId, new Set());
    }
    roomClients.get(roomId).add(ws);
    clientInfo.activeRoomId = roomId;
    clients.set(ws, clientInfo); // Update client info with active room

    ws.send(JSON.stringify({ type: 'joinedRoom', roomId, roomName: room.name, message: `Joined room: ${room.name}` }));
    console.log(`${clientInfo.username} joined room: ${room.name}`);

    // --- Send historical messages to the newly joined user ---
    const historicalMessages = getRoomMessages(roomId);
    if (historicalMessages.length > 0) {
        ws.send(JSON.stringify({ type: 'historicalMessages', messages: historicalMessages }));
    }
    // --- End historical messages ---

    // Notify others in the room
    broadcastMessage(roomId, {
        type: 'userJoined',
        username: clientInfo.username,
        timestamp: Date.now()
    }, ws); // Exclude sender from this notification
};

const handleChatMessage = (ws, roomId, message) => {
    const clientInfo = clients.get(ws);
    if (!clientInfo || clientInfo.activeRoomId !== roomId) {
        ws.send(JSON.stringify({ type: 'error', message: 'Not authenticated or not in this room.' }));
        return;
    }

    if (!message || message.trim() === '') {
        ws.send(JSON.stringify({ type: 'error', message: 'Message cannot be empty.' }));
        return;
    }

    const chatMessage = {
        type: 'chatMessage',
        username: clientInfo.username,
        message: message.trim(),
        timestamp: Date.now(),
        roomId: roomId
    };

    // Store message before broadcasting
    addMessageToRoom(roomId, chatMessage);

    broadcastMessage(roomId, chatMessage);
    console.log(`[Room ${roomId}] ${clientInfo.username}: ${message}`);
};

const broadcastMessage = (roomId, message, excludeWs = null) => {
    const members = roomClients.get(roomId);
    if (members) {
        const messageToSend = JSON.stringify(message);
        members.forEach(client => {
            if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
                client.send(messageToSend);
            }
        });
    }
};

const getRoomClients = (roomId) => {
    return Array.from(roomClients.get(roomId) || []);
};

module.exports = {
    setupWebSocket,
    broadcastMessage,
    getRoomClients
};