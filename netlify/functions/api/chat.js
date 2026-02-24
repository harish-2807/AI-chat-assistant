const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();

// Initialize SQLite database
const db = new sqlite3.Database('./database.sqlite');

// Initialize database tables
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT,
    role TEXT,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES sessions (id)
  )`);
});

// Load documentation
const fs = require('fs');
const path = require('path');
const docsPath = path.join(__dirname, '../../docs.json');
let documentation = [];

try {
  const docsContent = fs.readFileSync(docsPath, 'utf8');
  documentation = JSON.parse(docsContent);
} catch (error) {
  console.error('Error loading documentation:', error);
}

// Demo mode responses
function generateDemoResponse(userMessage) {
  const lowerMessage = userMessage.toLowerCase();
  
  if (lowerMessage.includes('password') && (lowerMessage.includes('reset') || lowerMessage.includes('change'))) {
    const passwordDoc = documentation.find(doc => 
      doc.title.toLowerCase().includes('password') || doc.title.toLowerCase().includes('reset')
    );
    if (passwordDoc) {
      return {
        reply: passwordDoc.content,
        tokensUsed: 45
      };
    }
  }

  if (lowerMessage.includes('refund') || lowerMessage.includes('money back')) {
    const refundDoc = documentation.find(doc => 
      doc.title.toLowerCase().includes('refund')
    );
    if (refundDoc) {
      return {
        reply: refundDoc.content,
        tokensUsed: 38
      };
    }
  }

  if (lowerMessage.includes('subscription') || lowerMessage.includes('plan') || lowerMessage.includes('pricing')) {
    const planDoc = documentation.find(doc => 
      doc.title.toLowerCase().includes('subscription')
    );
    if (planDoc) {
      return {
        reply: planDoc.content,
        tokensUsed: 52
      };
    }
  }

  return {
    reply: "Sorry, I don't have information about that.",
    tokensUsed: 12
  };
}

exports.handler = async (event, context) => {
  const { httpMethod, body } = event;
  
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (httpMethod === 'POST') {
    try {
      const { sessionId, message } = JSON.parse(body);
      
      if (!sessionId || !message) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'sessionId and message are required' })
        };
      }

      // Store user message
      await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)',
          [sessionId, 'user', message],
          function(err) {
            if (err) reject(err);
            else resolve();
          }
        );
      });

      // Get recent conversation history
      const history = await new Promise((resolve, reject) => {
        db.all(
          'SELECT role, content FROM messages WHERE session_id = ? ORDER BY created_at DESC LIMIT 10',
          [sessionId],
          (err, rows) => {
            if (err) reject(err);
            else resolve(rows.reverse());
          }
        );
      });

      // Generate response (demo mode)
      const response = generateDemoResponse(message);

      // Store assistant response
      await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)',
          [sessionId, 'assistant', response.reply],
          function(err) {
            if (err) reject(err);
            else resolve();
          }
        );
      });

      // Update session timestamp
      await new Promise((resolve, reject) => {
        db.run(
          'UPDATE sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [sessionId],
          function(err) {
            if (err) reject(err);
            else resolve();
          }
        );
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(response)
      };

    } catch (error) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Internal server error' })
      };
    }
  }

  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({ error: 'Method not allowed' })
  };
};
