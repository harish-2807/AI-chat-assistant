const sqlite3 = require('sqlite3').verbose();

// Initialize SQLite database
const db = new sqlite3.Database('./database.sqlite');

exports.handler = async (event, context) => {
  const { httpMethod, pathParameters } = event;
  const { sessionId } = pathParameters;
  
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
      if (!sessionId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'sessionId is required' })
        };
      }

      const messages = await new Promise((resolve, reject) => {
        db.all(
          'SELECT role, content, created_at FROM messages WHERE session_id = ? ORDER BY created_at ASC',
          [sessionId],
          (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          }
        );
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(messages)
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
