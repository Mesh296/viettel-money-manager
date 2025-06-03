import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Send a message to the chatbot and get a response
 * @param {string} messageText The message text to send to the chatbot
 * @returns {Promise<Object>} The chatbot response
 */
export const sendMessageToChatbot = async (messageText) => {
  try {
    console.log(`Sending message to chatbot: "${messageText}"`);
    const response = await axios.post(`${API_URL}/chatbot/converse`, { message: messageText }, {
      timeout: 20000 // 20 seconds timeout
    });
    return response.data; // Expected: { reply: '...' } hoặc kết quả từ function call
  } catch (error) {
    console.error('Error sending message to chatbot API:', 
      error.response?.data || error.message);
    
    // Add more information to error object
    if (error.response) {
      // Server responded with non-2xx status
      error.isServerError = true;
      error.statusCode = error.response.status;
    } else if (error.request) {
      // Request was made but no response received
      error.isNetworkError = true;
    }
    
    throw error;
  }
}; 