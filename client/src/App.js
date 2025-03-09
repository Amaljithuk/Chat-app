import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import EmojiPicker from 'emoji-picker-react'; // Import the emoji picker
import './App.css';

const socket = io('http://localhost:5000'); // Backend URL

function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [recipient, setRecipient] = useState('');
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false); // State for emoji picker

  useEffect(() => {
    // Listen for private messages
    socket.on('receivePrivateMessage', ({ sender, message }) => {
      setMessages((prev) => [...prev, { sender, message }]);
    });

    // Listen for updates to the list of online users
    socket.on('updateOnlineUsers', (onlineUsers) => {
      setOnlineUsers(onlineUsers);
    });

    // Cleanup: Remove listeners when the component unmounts
    return () => {
      socket.off('receivePrivateMessage');
      socket.off('updateOnlineUsers');
    };
  }, []);

  const handleRegister = async () => {
    await axios.post('http://localhost:5000/register', { username, password });
    alert('User registered');
  };

  const handleLogin = async () => {
    const res = await axios.post('http://localhost:5000/login', { username, password });
    localStorage.setItem('token', res.data.token);
    setLoggedIn(true);

    // Register user with the server
    socket.emit('registerUser', res.data.username);

    // Fetch the list of registered users
    const usersRes = await axios.get('http://localhost:5000/users');
    setRegisteredUsers(usersRes.data);
  };

  const sendPrivateMessage = () => {
    if (recipient && message) {
      // Send the message to the server
      socket.emit('sendPrivateMessage', { recipient, message, sender: username });
      setMessage(''); // Clear the input field
    }
  };

  // Function to handle emoji selection
  const handleEmojiClick = (emojiObject) => {
    setMessage((prevMessage) => prevMessage + emojiObject.emoji);
    setShowEmojiPicker(false); // Hide the emoji picker after selection
  };

  return (
    <div className="container">
      {!loggedIn ? (
        <div className="auth-form">
          <h2>Chat App</h2>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button onClick={handleRegister}>Register</button>
          <button onClick={handleLogin}>Login</button>
        </div>
      ) : (
        <div className="chat-container">
          <h2>Welcome, {username}!</h2>

          {/* List of Registered Users */}
          <div className="user-list">
            <h3>Registered Users</h3>
            <ul>
              {registeredUsers.map((user) => (
                <li
                  key={user.username}
                  className={`user ${onlineUsers.includes(user.username) ? 'online' : 'offline'}`}
                  onClick={() => {
                    if (onlineUsers.includes(user.username)) {
                      setRecipient(user.username);
                    }
                  }}
                >
                  {user.username} {onlineUsers.includes(user.username) ? '🟢' : '🔴'}
                </li>
              ))}
            </ul>
          </div>

          {/* Chat Interface */}
          <div className="messages">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`message ${msg.sender === 'You' ? 'sender' : 'recipient'}`}
              >
                <strong>{msg.sender}:</strong> {msg.message}
              </div>
            ))}
          </div>

          {/* Message Input Area */}
          {recipient && (
            <div className="message-input">
              <input
                type="text"
                placeholder="Type a message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') sendPrivateMessage();
                }}
              />
              <button onClick={() => setShowEmojiPicker(!showEmojiPicker)}>😀</button>
              <button onClick={sendPrivateMessage}>Send</button>
              {showEmojiPicker && (
                <div className="emoji-picker">
                  <EmojiPicker onEmojiClick={handleEmojiClick} />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;