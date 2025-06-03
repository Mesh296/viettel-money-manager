const chatbotService = require('../../services/chatbot');

const converse = async (req, res) => {
    try {
        console.log('======== CHATBOT REQUEST RECEIVED ========');
        console.log('Request body:', req.body);
        console.log('Auth user:', req.user);
        
        if (!req.user || !req.user.id) {
            console.log('Authentication failed: Missing user ID');
            return res.status(401).json({ error: 'Authentication required. Please log in again.' });
        }
        
        const userId = req.user.id;
        const { message } = req.body;

        if (!message) {
            console.log('Bad request: Message is missing');
            return res.status(400).json({ error: 'Message is required' });
        }

        console.log(`Processing chat for user ${userId} with message: ${message}`);
        
        // Gọi service để xử lý chat với Gemini
        const response = await chatbotService.processChat(userId, message);
        
        // Trả về phản hồi của chatbot
        console.log('======== CHATBOT RESPONSE SENT ========');
        res.status(200).json(response);
    } catch (error) {
        console.error('======== CHATBOT ERROR ========');
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        console.error('======== END CHATBOT ERROR ========');
        
        // Send a more specific error message to the client
        const statusCode = error.message.includes('Gemini API') ? 503 : 500;
        const errorMessage = {
            error: error.message || 'Error processing chatbot request',
            type: error.message.includes('Gemini API') ? 'AI_SERVICE_ERROR' : 'INTERNAL_SERVER_ERROR',
            timestamp: new Date().toISOString(),
        };
        
        // Include stack trace in development environment
        if (process.env.NODE_ENV === 'development') {
            errorMessage.stack = error.stack;
        }
        
        res.status(statusCode).json(errorMessage);
    }
};

module.exports = {
    converse,
}; 