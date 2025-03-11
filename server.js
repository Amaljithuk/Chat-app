const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Allow all origins (update in production)
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Routes
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ username, password: hashedPassword });
  await user.save();
  res.status(201).send('User registered');
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  console.log
  (

    "jj"
  );
  if (user && await bcrypt.compare(password, user.password)) {
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
    res.json({ token, username });
  } else {
    res.status(400).send('Invalid credentials');
  }
});

// Track online users
const userSocketMap = {};
// Function to send the list of online users to all clients
const updateOnlineUsers = () => {
  const onlineUsers = Object.keys(userSocketMap);
  io.emit('updateOnlineUsers', onlineUsers);
};
// Socket.io
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Listen for user registration (after login)
  socket.on('registerUser', (username) => {
    userSocketMap[username] = socket.id; // Map username to socket.id
    console.log(`User ${username} registered with socket ID: ${socket.id}`);
    updateOnlineUsers();
  });

  // Listen for private messages
  socket.on('sendPrivateMessage', ({ recipient, message, sender }) => {
    const recipientSocketId = userSocketMap[recipient]; // Get recipient's socket ID
    if (recipientSocketId) {
      // Send the message to the recipient
      io.to(recipientSocketId).emit('receivePrivateMessage', {
        sender,
        message,
      });
      // Send the message back to the sender
      io.to(socket.id).emit('receivePrivateMessage', {
        sender: 'You',
        message,
      });
      console.log(`Message sent to ${recipient}: ${message}`);
    } else {
      console.log(`User ${recipient} is offline`);
    }
  });
  

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
    // Remove user from the online list
    for (const [username, id] of Object.entries(userSocketMap)) {
      if (id === socket.id) {
        delete userSocketMap[username];
        console.log(`User ${username} removed from online list`);
        break;
      }
    }
    updateOnlineUsers();
  });
});
app.get('/users', async (req, res) => {
  const users = await User.find({}, 'username');
  res.json(users);
});


// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});