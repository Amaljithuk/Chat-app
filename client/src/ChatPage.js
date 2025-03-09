import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import './App.css';

const socket = io('http://localhost:5000'); // Backend URL

function ChatPage() {
  const { recipient } = useParams(); // Get the recipient from the URL
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const username = localStorage.getItem('username'); // Get the logged-in username
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for private messages
    const handleReceiveMessage = ({ sender, message }) => {
      if (sender === recipient) {
        setMessages((prev) => [...prev, { sender, message }]);
      }
    };

    socket.on('receivePrivateMessage', handleReceiveMessage);

    // Cleanup: Remove the listener when the component unmounts
    return () => {
      socket.off('receivePrivateMessage', handleReceiveMessage);
    };
  }, [recipient]);

  const sendPrivateMessage = () => {
    if (message) {
      // Send the message to the server
      socket.emit('sendPrivateMessage', { recipient, message, sender: username });
      setMessage(''); // Clear the input field
    }
  };

  return (
    <div className="chat-container">
      <h2>Chat with {recipient}</h2>
      <button onClick={() => navigate('/')}>Back to Main Page</button>
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
        <button onClick={sendPrivateMessage}>Send</button>
      </div>
    </div>
  );
}

export default ChatPage;