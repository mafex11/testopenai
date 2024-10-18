"use client";

import { useState } from 'react';

export default function Chatbot() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!input || input.trim() === '') {
      console.error('Input is empty or undefined');
      return;
    }

    const userMessage = { text: input, sender: 'user', timestamp: new Date() };
    setMessages((prevMessages) => [...prevMessages, userMessage]);

    // Call OpenAI API via the backend with the user query
    try {
      const response = await fetch('/api/openai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: input }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch response from OpenAI');
      }

      const data = await response.json();

      // Log data to debug
      console.log('Response from OpenAI:', data);

      const botMessage = { text: data.completion || 'No response from OpenAI', sender: 'bot', timestamp: new Date() };
      setMessages((prevMessages) => [...prevMessages, botMessage]);
    } catch (error) {
      console.error('Error fetching from OpenAI: ', error);
      const botMessage = { text: 'There was an error processing your request.', sender: 'bot', timestamp: new Date() };
      setMessages((prevMessages) => [...prevMessages, botMessage]);
    }

    setInput('');  // Clear input after sending
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '1rem', border: '1px solid #ddd' }}>
      <h2>Chatbot</h2>

      <div style={{ height: '300px', overflowY: 'scroll', border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}>
        {messages.map((message, index) => (
          <div
            key={index}
            style={{
              backgroundColor: message.sender === 'user' ? '#e0f7fa' : '#ffebee',
              padding: '10px',
              margin: '5px 0',
              borderRadius: '5px',
              textAlign: message.sender === 'user' ? 'right' : 'left',
            }}
          >
            {message.text}
          </div>
        ))}
      </div>

      <form onSubmit={handleSendMessage} style={{ display: 'flex' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message"
          style={{ flex: '1', padding: '10px'}}
        />
        <button type="submit" style={{ padding: '10px' }}>Send</button>
      </form>
    </div>
  );
}
