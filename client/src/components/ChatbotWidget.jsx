import { useState, useEffect, useRef } from 'react';
import { sendMessageToChatbot } from '../services/chatbot'; 
import { toast } from 'react-toastify';

// Basic styling, can be improved later with Tailwind/StyledComponents
const widgetStyles = {
  position: 'fixed',
  bottom: '20px',
  right: '20px',
  width: '350px',
  maxHeight: '500px',
  backgroundColor: 'white',
  borderRadius: '8px',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  display: 'flex',
  flexDirection: 'column',
  zIndex: 1000, // Ensure it's above other elements
  transition: 'all 0.3s ease-in-out',
};

const headerStyles = {
  backgroundColor: '#5A67D8', // Example color, match with your theme
  color: 'white',
  padding: '10px 15px',
  borderTopLeftRadius: '8px',
  borderTopRightRadius: '8px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  cursor: 'pointer',
};

const messagesContainerStyles = {
  flexGrow: 1,
  padding: '15px',
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
};

const inputAreaStyles = {
  display: 'flex',
  padding: '10px',
  borderTop: '1px solid #eee',
};

const inputStyles = {
  flexGrow: 1,
  padding: '8px 12px',
  border: '1px solid #ddd',
  borderRadius: '4px',
  marginRight: '8px',
  fontSize: '14px',
};

const buttonStyles = {
  padding: '8px 15px',
  backgroundColor: '#5A67D8',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '14px',
};

const messageBubbleStyles = (isUser) => ({
  alignSelf: isUser ? 'flex-end' : 'flex-start',
  backgroundColor: isUser ? '#EBF4FF' : '#F0F0F0',
  color: isUser ? '#2C5282' : '#333',
  padding: '8px 12px',
  borderRadius: '12px',
  maxWidth: '80%',
  wordWrap: 'break-word',
  fontSize: '14px',
  whiteSpace: 'pre-wrap',
  lineHeight: '1.5',
});

const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: 'Xin chào! Tôi có thể giúp gì cho bạn về quản lý giao dịch?', sender: 'bot' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleSendMessage = async () => {
    if (inputValue.trim() === '' || isLoading) return;

    const newMessage = { text: inputValue, sender: 'user' };
    setMessages(prevMessages => [...prevMessages, newMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await sendMessageToChatbot(newMessage.text);
      
      // Xử lý phản hồi từ server
      if (response) {
        // Thêm phản hồi từ bot vào danh sách tin nhắn
        const botReply = { text: response.reply, sender: 'bot' };
        setMessages(prevMessages => [...prevMessages, botReply]);
        
        // Handle toast notifications if included in the response
        if (response.toast) {
          const { type, message } = response.toast;
          if (type === 'success') {
            toast.success(message);
          } else if (type === 'error') {
            toast.error(message);
          } else if (type === 'info') {
            toast.info(message);
          } else if (type === 'warning') {
            toast.warning(message);
          }
        }
        
        // Handle data refresh signal
        if (response.refreshData) {
          console.log('Refreshing transaction data...');
          
          // Use CustomEvent instead of Event for better compatibility
          const transactionsEvent = new CustomEvent('transactionsUpdated');
          window.dispatchEvent(transactionsEvent);
          
          // If we created a category, also refresh categories
          if (response.refreshCategories || 
            (response.toast && response.toast.message && 
             response.toast.message.includes('danh mục'))) {
            const categoriesEvent = new CustomEvent('categoriesUpdated');
            window.dispatchEvent(categoriesEvent);
          }
        }
        
        // Nếu có function call, hiển thị kết quả (legacy handling)
        if (response.functionCall) {
          const { name, result } = response.functionCall;
          
          // Thông báo kết quả của hành động
          if (result) {
            // Xử lý dựa trên loại function
            switch (name) {
              case 'createTransaction':
                if (result.success) {
                  toast.success(result.message || 'Đã tạo giao dịch thành công');
                  // Trigger cho các component khác cập nhật
                  const transactionsEvent = new CustomEvent('transactionsUpdated');
                  window.dispatchEvent(transactionsEvent);
                } else {
                  toast.error(result.message || 'Không thể tạo giao dịch');
                }
                break;
              
              case 'updateTransaction':
                if (result.success) {
                  toast.success(result.message || 'Đã cập nhật giao dịch thành công');
                  const transactionsEvent = new CustomEvent('transactionsUpdated');
                  window.dispatchEvent(transactionsEvent);
                } else {
                  toast.error(result.message || 'Không thể cập nhật giao dịch');
                }
                break;
              
              case 'deleteTransaction':
                if (result.success) {
                  toast.success(result.message || 'Đã xóa giao dịch thành công');
                  const transactionsEvent = new CustomEvent('transactionsUpdated');
                  window.dispatchEvent(transactionsEvent);
                } else {
                  toast.error(result.message || 'Không thể xóa giao dịch');
                }
                break;
              
              case 'createCategory':
                if (result.success) {
                  toast.success(result.message || 'Đã tạo danh mục thành công');
                  const categoriesEvent = new CustomEvent('categoriesUpdated');
                  window.dispatchEvent(categoriesEvent);
                } else {
                  toast.error(result.message || 'Không thể tạo danh mục');
                }
                break;
              
              case 'searchTransactions':
                // Kiểm tra xem có kết quả được định dạng sẵn không
                if (result.success && result.formattedTransactions) {
                  // Hiển thị kết quả đã được định dạng trong một tin nhắn riêng
                  const resultsMessage = { 
                    text: result.formattedTransactions, 
                    sender: 'bot' 
                  };
                  setMessages(prevMessages => [...prevMessages, resultsMessage]);
                }
                break;
            }
          }
        }
      } else {
        throw new Error('Phản hồi không hợp lệ từ bot');
      }
    } catch (error) {
      console.error("Error sending message to chatbot:", error);
      
      // Hiển thị tin nhắn lỗi thân thiện hơn cho người dùng
      let errorMessage = 'Xin lỗi, tôi không thể xử lý yêu cầu của bạn lúc này.';
      
      if (error.response?.data) {
        // Kiểm tra xem có phải lỗi Gemini API không
        if (error.response.data.type === 'AI_SERVICE_ERROR') {
          errorMessage = 'Dịch vụ AI đang gặp sự cố. Vui lòng thử lại sau ít phút.';
        } else if (error.response.status === 401) {
          errorMessage = 'Phiên làm việc của bạn đã hết hạn. Vui lòng đăng nhập lại.';
        }
      }
      
      toast.error('Có lỗi xảy ra khi gửi tin nhắn.');
      setMessages(prevMessages => [...prevMessages, { text: errorMessage, sender: 'bot' }]);
    }
    setIsLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={toggleOpen} 
        style={{ ...widgetStyles, width: 'auto', height: 'auto', padding: '12px 18px', bottom: '20px', right: '20px' }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '24px', height: '24px', color: '#5A67D8'}}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.294 48.294 0 0 0 5.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
        </svg>
      </button>
    );
  }

  return (
    <div style={widgetStyles}>
      <div style={headerStyles} onClick={toggleOpen}>
        <span>AI Assistant</span>
        <button style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '18px' }}>
          {/* Simple dash for minimize, real minimize is handled by toggleOpen */}
          _
        </button>
      </div>
      <div style={messagesContainerStyles}>
        {messages.map((msg, index) => (
          <div key={index} style={messageBubbleStyles(msg.sender === 'user')}>
            {msg.text}
          </div>
        ))}
        {isLoading && (
            <div style={messageBubbleStyles('bot')}>
                <em>Đang xử lý...</em>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div style={inputAreaStyles}>
        <input
          type="text"
          style={inputStyles}
          value={inputValue}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder="Nhập tin nhắn..."
          disabled={isLoading}
        />
        <button style={buttonStyles} onClick={handleSendMessage} disabled={isLoading}>
          {isLoading ? '...' : 'Gửi'}
        </button>
      </div>
    </div>
  );
};

export default ChatbotWidget; 