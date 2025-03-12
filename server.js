// server.js

// Import necessary modules
const express = require('express'); // Express web framework
const bodyParser = require('body-parser'); // Middleware to parse request bodies
const fs = require('fs'); // File system module to work with files

const app = express(); // Create an Express application
const port = 3000; // Define the port the server will listen on (you can change this)

const usersFilePath = 'users.json'; // Path to the JSON file storing user data

// Middleware to parse URL-encoded and JSON request bodies
app.use(bodyParser.urlencoded({ extended: false })); // for parsing application/x-www-form-urlencoded
app.use(bodyParser.json()); // for parsing application/json

// Serve static files from the 'public' directory
app.use(express.static('public'));

// --- Signup Endpoint ---
app.post('/signup', (req, res) => {
    const { email, password } = req.body; // Extract email and password from the request body

    if (!email || !password) {
        return res.status(400).send('Email and password are required.'); // Respond with an error if email or password is missing
    }

    // --- IMPORTANT SECURITY NOTE ---
    // In a real application, you MUST hash and salt passwords before storing them.
    // Storing passwords in plain text (as done here for simplicity) is a HUGE security risk.
    // For demonstration, we will store the password as is, but DO NOT do this in production.

    const newUser = {
        email: email,
        password: password, // In real app, store a HASH of the password
        timestamp: new Date().toISOString() // Add a timestamp for when the user signed up
    };

    fs.readFile(usersFilePath, 'utf8', (err, data) => {
        let users = [];
        if (!err) {
            try {
                users = JSON.parse(data); // Try to parse existing user data
            } catch (parseError) {
                console.error('Error parsing users.json:', parseError);
                users = []; // If parsing fails, start with an empty array
            }
        } else if (err.code === 'ENOENT') {
            // File doesn't exist, it's okay for the first signup
            console.log('users.json not found, creating new file.');
        } else {
            console.error('Error reading users.json:', err);
            return res.status(500).send('Failed to read user data.'); // Respond with server error if file read fails (other than file not found)
        }

        users.push(newUser); // Add the new user to the array

        fs.writeFile(usersFilePath, JSON.stringify(users, null, 2), (writeErr) => {
            if (writeErr) {
                console.error('Error writing to users.json:', writeErr);
                return res.status(500).send('Signup failed: Could not save user data.'); // Respond with server error if writing to file fails
            }
            console.log('New user signed up:', newUser.email);
            res.send('Signup successful!'); // Respond with success message
        });
    });
});

// --- Login Endpoint ---
app.post('/login', (req, res) => {
    const { email, password } = req.body; // Extract email and password from the request body

    if (!email || !password) {
        return res.status(400).send('Email and password are required.'); // Respond with error if email or password missing
    }

    fs.readFile(usersFilePath, 'utf8', (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                return res.status(401).send('Login failed: No users registered yet.'); // File not found implies no users
            } else {
                console.error('Error reading users.json:', err);
                return res.status(500).send('Login failed: Could not read user data.'); // Server error if file read fails (other than not found)
            }
        }

        let users = [];
        try {
            users = JSON.parse(data); // Parse user data from JSON
        } catch (parseError) {
            console.error('Error parsing users.json:', parseError);
            return res.status(500).send('Login failed: Corrupted user data.'); // Server error if JSON parsing fails
        }

        const user = users.find(u => u.email === email && u.password === password); // Try to find a user with matching email and password

        if (user) {
            console.log('User logged in:', email);
            res.send('Login successful!'); // Respond with success if user found
        } else {
            console.log('Login failed for:', email);
            res.status(401).send('Login failed: Invalid credentials.'); // Respond with error if no matching user found
        }
    });
});

// --- Start the server ---
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`); // Log message when server starts
});
