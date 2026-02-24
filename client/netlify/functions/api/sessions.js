const sqlite3 = require('sqlite3').verbose();

// Initialize SQLite database
const db = new sqlite3.Database('./database.sqlite');

exports.handler = async (event, context) => {
  const { httpMethod } = event;
  
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

  if (httpMethod === 'GET') {
    try {
      const sessions = await new Promise((resolve, reject) => {
        db.all(
          'SELECT id, created_at, updated_at FROM sessions ORDER BY updated_at DESC',
          [],
          (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          }
        );
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(sessions)
      };

    } catch (error) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Internal server error' })
      };
    }
  }

  if (httpMethod === 'POST') {
    try {
      // Generate new session ID
      const sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

      await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO sessions (id) VALUES (?)',
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
        body: JSON.stringify({ sessionId })
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
