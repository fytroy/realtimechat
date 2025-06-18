// netlify/functions/shared/storage.js

// Simple in-memory storage solution
// Note: In production, you should use a database like Firebase, Supabase, or FaunaDB

class SimpleStorage {
    constructor() {
        // These will reset on each deployment, but work for demo purposes
        this.users = [];
        this.rooms = [];
        this.messages = {};
    }

    // User methods
    addUser(user) {
        this.users.push(user);
        return user;
    }

    findUserByEmail(email) {
        return this.users.find(u => u.email === email);
    }

    findUserById(id) {
        return this.users.find(u => u.id === id);
    }

    getAllUsers() {
        return this.users;
    }

    // Room methods
    addRoom(room) {
        this.rooms.push(room);
        this.messages[room.id] = []; // Initialize empty message array for room
        return room;
    }

    getAllRooms() {
        return this.rooms;
    }

    findRoomById(id) {
        return this.rooms.find(r => r.id === id);
    }

    // Message methods
    addMessage(roomId, message) {
        if (!this.messages[roomId]) {
            this.messages[roomId] = [];
        }
        this.messages[roomId].push(message);
        
        // Keep only last 100 messages per room
        if (this.messages[roomId].length > 100) {
            this.messages[roomId] = this.messages[roomId].slice(-100);
        }
        
        return message;
    }

    getRoomMessages(roomId) {
        return this.messages[roomId] || [];
    }

    // Initialize with some demo data
    initializeDemoData() {
        // Add a demo room
        if (this.rooms.length === 0) {
            this.addRoom({
                id: 'demo-room-1',
                name: 'General Chat',
                creator: 'system',
                createdAt: Date.now()
            });
        }
    }
}

// Create a singleton instance
const storage = new SimpleStorage();
storage.initializeDemoData();

module.exports = storage;

