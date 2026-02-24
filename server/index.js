require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { initializeDatabase } = require('./database');
const LLMService = require('./llmService');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize LLM service
const llmService = new LLMService();

// Middleware
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});

app.use('/api/', limiter);

// Serve static files from React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '..', 'client', 'build')));
}

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
};

// API Routes

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { sessionId, message } = req.body;

    if (!sessionId || !message) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'sessionId and message are required'
      });
    }

    // Get conversation history for context
    const history = await getConversationHistory(sessionId);
    
    // Generate AI response
    const { reply, tokensUsed } = await llmService.generateResponse(message, history);

    // Store user message
    await storeMessage(sessionId, 'user', message);
    
    // Store assistant response
    await storeMessage(sessionId, 'assistant', reply);

    // Update session timestamp
    await updateSessionTimestamp(sessionId);

    res.json({
      reply,
      tokensUsed
    });

  } catch (error) {
    console.error('Chat endpoint error:', error);
    res.status(500).json({
      error: 'Failed to process chat message',
      message: error.message
    });
  }
});

// Get conversation history
app.get('/api/conversations/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({
        error: 'Missing sessionId',
        message: 'sessionId is required'
      });
    }

    const messages = await getConversationHistory(sessionId);
    res.json({ messages });

  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      error: 'Failed to fetch conversation',
      message: error.message
    });
  }
});

// List all sessions
app.get('/api/sessions', async (req, res) => {
  try {
    const sessions = await getAllSessions();
    res.json({ sessions });

  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({
      error: 'Failed to fetch sessions',
      message: error.message
    });
  }
});

// Database helper functions
const getConversationHistory = (sessionId) => {
  return new Promise((resolve, reject) => {
    const { db } = require('./database');
    
    db.all(
      'SELECT role, content, created_at FROM messages WHERE session_id = ? ORDER BY created_at ASC',
      [sessionId],
      (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      }
    );
  });
};

const storeMessage = (sessionId, role, content) => {
  return new Promise((resolve, reject) => {
    const { db } = require('./database');
    
    db.run(
      'INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)',
      [sessionId, role, content],
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      }
    );
  });
};

const updateSessionTimestamp = (sessionId) => {
  return new Promise((resolve, reject) => {
    const { db } = require('./database');
    
    db.run(
      'INSERT OR IGNORE INTO sessions (id) VALUES (?)',
      [sessionId],
      function(err) {
        if (err) {
          reject(err);
          return;
        }
        
        // Update timestamp
        db.run(
          'UPDATE sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [sessionId],
          function(err) {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          }
        );
      }
    );
  });
};

const getAllSessions = () => {
  return new Promise((resolve, reject) => {
    const { db } = require('./database');
    
    db.all(
      'SELECT id, created_at, updated_at FROM sessions ORDER BY updated_at DESC',
      [],
      (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      }
    );
  });
};

// Serve React app for any unmatched routes in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'client', 'build', 'index.html'));
  });
}

// Error handling middleware
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
