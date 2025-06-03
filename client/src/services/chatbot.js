import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const sendMessageToChatbot = async (messageText) => {
  try {
    const response = await axios.post(`${API_URL}/chatbot/converse`, { message: messageText });
    return response.data; // Expected: { reply: '...' } hoặc kết quả từ function call
  } catch (error) {
    console.error('Error sending message to chatbot API:', error.response?.data || error.message);
    throw error.response?.data || new Error('Failed to communicate with chatbot API');
  }
}; 