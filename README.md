# AI-Powered Support Assistant

A full-stack AI-powered support assistant built with React.js frontend and Node.js backend, featuring SQLite database storage and LLM integration.

## 🚀 Features

- **Real-time Chat Interface**: Modern React-based chat UI with message history
- **Session Management**: Persistent conversations with unique session IDs
- **Document-based AI**: Assistant answers only using provided documentation
- **SQLite Storage**: All conversations and sessions stored in SQLite database
- **Rate Limiting**: Built-in rate limiting to prevent abuse
- **Error Handling**: Comprehensive error handling and user feedback
- **Responsive Design**: Mobile-friendly interface

## 🛠️ Tech Stack

### Frontend
- **React.js** - UI framework
- **CSS3** - Styling with modern design
- **LocalStorage** - Session persistence

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **SQLite** - Database for storage
- **OpenAI API** - LLM integration (configurable)

## 📋 Prerequisites

- Node.js 14+ installed
- OpenAI API key (or compatible LLM provider)
- Git for cloning

## 🛠️ Installation & Setup

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd ai-support-assistant

# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### 2. Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your configuration
```

Required environment variables:
```
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-3.5-turbo
PORT=5000
NODE_ENV=development
```

### 3. Start the Application

#### Development Mode

```bash
# Start backend server
npm run dev

# In a new terminal, start frontend
cd client
npm start
```

#### Production Mode

```bash
# Build frontend
npm run build-client

# Start production server
npm start
```

## 📁 Project Structure

```
ai-support-assistant/
├── server/
│   ├── index.js          # Main server file
│   ├── database.js        # SQLite database setup
│   └── llmService.js     # LLM integration service
├── client/
│   ├── src/
│   │   ├── App.js        # Main React component
│   │   └── App.css       # Application styles
│   └── public/           # Static assets
├── docs.json             # Product documentation
├── package.json          # Backend dependencies
└── README.md            # This file
```

## 🔧 API Endpoints

### POST /api/chat
Send a message to the AI assistant.

**Request:**
```json
{
  "sessionId": "session_123",
  "message": "How can I reset my password?"
}
```

**Response:**
```json
{
  "reply": "Users can reset password from Settings > Security...",
  "tokensUsed": 123
}
```

### GET /api/conversations/:sessionId
Retrieve all messages for a specific session.

**Response:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Hello",
      "created_at": "2024-01-01T12:00:00Z"
    },
    {
      "role": "assistant", 
      "content": "Hi! How can I help you?",
      "created_at": "2024-01-01T12:00:01Z"
    }
  ]
}
```

### GET /api/sessions
List all chat sessions.

**Response:**
```json
{
  "sessions": [
    {
      "id": "session_123",
      "created_at": "2024-01-01T12:00:00Z",
      "updated_at": "2024-01-01T12:30:00Z"
    }
  ]
}
```

## 📚 Documentation Format

The AI assistant uses `docs.json` for knowledge base. Each document should have:

```json
[
  {
    "title": "Reset Password",
    "content": "Users can reset password from Settings > Security..."
  }
]
```

## 🔒 Security Features

- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Input Validation**: All inputs validated and sanitized
- **Error Handling**: Graceful error responses without sensitive information
- **CORS**: Configured for secure cross-origin requests

## 🧠 AI Behavior Rules

The assistant follows strict rules:

1. **Document-only responses**: Only uses information from `docs.json`
2. **Fallback response**: Returns "Sorry, I don't have information about that." for unknown queries
3. **Context awareness**: Maintains last 5 message pairs for context
4. **No hallucination**: Never makes up information

## 🎯 Usage Examples

### Supported Questions
- "How do I reset my password?"
- "What's your refund policy?"
- "What subscription plans do you offer?"
- "How do I integrate your API?"

### Unsupported Questions
- "What's the weather today?"
- "Tell me a joke"
- "Who won the last World Cup?"

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Ensure SQLite3 is properly installed
   - Check file permissions for database directory

2. **OpenAI API Error**
   - Verify API key is correct
   - Check API quota and billing

3. **CORS Issues**
   - Ensure frontend URL is allowed in production
   - Check environment variables

### Debug Mode

Set `NODE_ENV=development` for detailed error messages and debugging information.

## 🚀 Deployment

### Heroku Deployment

```bash
# Add Heroku remote
heroku create your-app-name

# Set environment variables
heroku config:set OPENAI_API_KEY=your_key
heroku config:set NODE_ENV=production

# Deploy
git push heroku main
```

### Docker Deployment

```dockerfile
# Dockerfile example
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build-client
EXPOSE 5000
CMD ["npm", "start"]
```

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For issues and questions:
- Create an issue in the repository
- Check existing documentation
- Review troubleshooting section
