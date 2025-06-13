// server/controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { users } = require('../data/users'); // In-memory user store

const register = async (req, res) => {
    const { email, username, password } = req.body; // Added email and username

    if (!email || !username || !password) {
        return res.status(400).json({ message: 'Email, username, and password are required.' });
    }

    // Email must be unique
    if (users.find(u => u.email === email)) {
        return res.status(409).json({ message: 'Email address already registered.' });
    }

    // Optional: Username can also be unique or allow duplicates (depending on preference)
    // For simplicity, we'll allow duplicate usernames but unique emails.
    // if (users.find(u => u.username === username)) {
    //     return res.status(409).json({ message: 'Username already exists.' });
    // }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { id: Date.now().toString(), email, username, password: hashedPassword }; // Store email
    users.push(newUser);
    res.status(201).json({ message: 'User registered successfully!' });
};

const login = async (req, res) => {
    const { email, password } = req.body; // Login with email

    const user = users.find(u => u.email === email); // Find by email
    if (!user) {
        return res.status(400).json({ message: 'Invalid credentials.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials.' });
    }

    // Token now contains id, email, and username
    const accessToken = jwt.sign({ id: user.id, email: user.email, username: user.username }, req.app.get('jwtSecret'), { expiresIn: '1h' });
    res.json({ accessToken });
};

module.exports = {
    register,
    login
};