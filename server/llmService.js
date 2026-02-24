const axios = require('axios');
const fs = require('fs');
const path = require('path');

class LLMService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
    this.baseURL = 'https://api.openai.com/v1';
    
    // Load documentation
    this.docsPath = path.join(__dirname, '..', 'docs.json');
    this.documentation = this.loadDocumentation();
  }

  loadDocumentation() {
    try {
      const docsContent = fs.readFileSync(this.docsPath, 'utf8');
      return JSON.parse(docsContent);
    } catch (error) {
      console.error('Error loading documentation:', error);
      return [];
    }
  }

  async generateResponse(userMessage, conversationHistory) {
    // Demo mode - simulate AI responses based on documentation
    const demoMode = !this.apiKey || this.apiKey.includes('REPLACE') || this.apiKey.includes('AbCdEf');
    
    if (demoMode) {
      return this.generateDemoResponse(userMessage);
    }

    try {
      // Construct the system prompt with documentation
      const docsContent = this.documentation
        .map(doc => `${doc.title}: ${doc.content}`)
        .join('\n\n');

      const systemPrompt = `You are a helpful support assistant. You must answer questions ONLY using the following documentation. If the answer is not found in the documentation, respond with exactly: "Sorry, I don't have information about that."

Documentation:
${docsContent}

Rules:
1. Only use information from the provided documentation
2. If information is not in the docs, say "Sorry, I don't have information about that."
3. Be helpful and concise
4. Do not make up or guess any information`;

      // Build messages array with conversation history
      const messages = [
        { role: 'system', content: systemPrompt }
      ];

      // Add last 5 message pairs from conversation history
      const recentHistory = conversationHistory.slice(-10); // Last 10 messages (5 pairs)
      recentHistory.forEach(msg => {
        messages.push({
          role: msg.role,
          content: msg.content
        });
      });

      // Add current user message
      messages.push({
        role: 'user',
        content: userMessage
      });

      const response = await axios.post(`${this.baseURL}/chat/completions`, {
        model: this.model,
        messages: messages,
        max_tokens: 500,
        temperature: 0.7
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const reply = response.data.choices[0].message.content;
      const tokensUsed = response.data.usage.total_tokens;

      return {
        reply,
        tokensUsed
      };

    } catch (error) {
      console.error('Error generating LLM response:', error.response?.data || error.message);
      
      // Return fallback response if LLM fails
      return {
        reply: "Sorry, I'm experiencing technical difficulties. Please try again later.",
        tokensUsed: 0
      };
    }
  }

  generateDemoResponse(userMessage) {
    const lowerMessage = userMessage.toLowerCase();
    
    // Check for password reset
    if (lowerMessage.includes('password') && (lowerMessage.includes('reset') || lowerMessage.includes('change'))) {
      const passwordDoc = this.documentation.find(doc => 
        doc.title.toLowerCase().includes('password') || doc.title.toLowerCase().includes('reset')
      );
      if (passwordDoc) {
        return {
          reply: passwordDoc.content,
          tokensUsed: 45
        };
      }
    }

    // Check for refund policy
    if (lowerMessage.includes('refund') || lowerMessage.includes('money back')) {
      const refundDoc = this.documentation.find(doc => 
        doc.title.toLowerCase().includes('refund')
      );
      if (refundDoc) {
        return {
          reply: refundDoc.content,
          tokensUsed: 38
        };
      }
    }

    // Check for subscription plans
    if (lowerMessage.includes('subscription') || lowerMessage.includes('plan') || lowerMessage.includes('pricing')) {
      const planDoc = this.documentation.find(doc => 
        doc.title.toLowerCase().includes('subscription')
      );
      if (planDoc) {
        return {
          reply: planDoc.content,
          tokensUsed: 52
        };
      }
    }

    // Check for account setup
    if (lowerMessage.includes('account') && (lowerMessage.includes('setup') || lowerMessage.includes('create') || lowerMessage.includes('register'))) {
      const accountDoc = this.documentation.find(doc => 
        doc.title.toLowerCase().includes('account')
      );
      if (accountDoc) {
        return {
          reply: accountDoc.content,
          tokensUsed: 41
        };
      }
    }

    // Check for payment methods
    if (lowerMessage.includes('payment') || lowerMessage.includes('pay') || lowerMessage.includes('credit card')) {
      const paymentDoc = this.documentation.find(doc => 
        doc.title.toLowerCase().includes('payment')
      );
      if (paymentDoc) {
        return {
          reply: paymentDoc.content,
          tokensUsed: 44
        };
      }
    }

    // Check for API integration
    if (lowerMessage.includes('api') || lowerMessage.includes('integration') || lowerMessage.includes('develop')) {
      const apiDoc = this.documentation.find(doc => 
        doc.title.toLowerCase().includes('api')
      );
      if (apiDoc) {
        return {
          reply: apiDoc.content,
          tokensUsed: 48
        };
      }
    }

    // Default fallback for unknown questions
    return {
      reply: "Sorry, I don't have information about that.",
      tokensUsed: 12
    };
  }
}

module.exports = LLMService;
