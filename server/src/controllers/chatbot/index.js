const chatbotService = require('../../services/chatbot');

const converse = async (req, res) => {
    try {
        console.log('Chatbot request received:', req.body);
        console.log('Auth user:', req.user);
        
        if (!req.user || !req.user.id) {
            return res.status(401).json({ error: 'Authentication required. Please log in again.' });
        }
        
        const userId = req.user.id;
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        console.log(`Processing chat for user ${userId} with message: ${message}`);
        
        // Gọi service để xử lý chat với Gemini
        const response = await chatbotService.processChat(userId, message);
        
        // Trả về phản hồi của chatbot
        res.status(200).json(response);
    } catch (error) {
        console.error('Chatbot Error details:', error);
        res.status(500).json({ 
            error: error.message || 'Error processing chatbot request',
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

module.exports = {
    converse,
}; 