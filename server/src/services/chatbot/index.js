const axios = require('axios');
const dotenv = require('dotenv');
const { Category } = require('../../models');
const transactionService = require('../transactions');
const categoryService = require('../categories');

dotenv.config();

const apiKey = process.env.OPENROUTER_API_KEY;
if (!apiKey) throw new Error('OPENROUTER_API_KEY is not defined');

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const CONVERSATION_EXPIRY = 30 * 60 * 1000; // 30 minutes

// Store conversation history
const userConversations = new Map();

// Helper to format transactions
function formatTransactions(transactions, limit = 5) {
  if (!transactions?.length) return 'Không tìm thấy giao dịch nào.';
  
  const toShow = transactions;
  const formatted = toShow.map((t, idx) => {
    const date = new Date(t.date).toLocaleDateString('vi-VN');
    const amount = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(t.amount);
    const categoryName = t.category?.name || (t.category ? t.category.name : 'Không có danh mục');
    const type = t.type === 'income' ? 'Thu nhập' : 'Chi tiêu';
    const note = t.note ? ` (${t.note})` : '';
    const id = t.transactionId || t.id; // Handle both id formats
    return `${idx + 1}. ${date}: ${type} ${amount} - ${categoryName}${note} [ID: ${id}]`;
  }).join('\n');
  
  return formatted
}

// Helper to get categories for context
async function getCategoriesContext() {
  try {
    const categories = await Category.findAll();
    return categories.map(cat => ({ id: cat.id, name: cat.name }));
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

// Helper to manage conversation
function getConversation(userId) {
  if (userConversations.has(userId) && 
      Date.now() - userConversations.get(userId).lastUpdated < CONVERSATION_EXPIRY) {
    return userConversations.get(userId);
  }
  
  const conversation = { history: [], lastUpdated: Date.now(), pendingAction: null };
  userConversations.set(userId, conversation);
  return conversation;
}

// Helper to handle errors
function handleError(error, userId, message, conversation) {
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);
  const userMessage = 'Xin lỗi, đã xảy ra lỗi. Vui lòng thử lại sau.';
  conversation.history.push(
    { role: 'user', content: message },
    { role: 'assistant', content: userMessage }
  );
  return { reply: userMessage, error: error.message };
}

// Helper to clean and parse AI response
function cleanAndParseResponse(rawResponse) {
  try {
    // If rawResponse is not a string, convert it
    const responseString = typeof rawResponse === 'string' ? rawResponse : JSON.stringify(rawResponse);
    
    // Check if response is empty
    if (!responseString || responseString.trim() === '') {
      console.error('Empty API response');
      return {
        intent: 'general_chat',
        response: 'Xin lỗi, tôi đang gặp khó khăn trong việc xử lý. Vui lòng thử lại.',
        data: {}
      };
    }
    
    // Remove any reasoning output that sometimes appears in responses
    let cleaned = responseString;
    
    // First detect if this is a JSON object in a string
    if (cleaned.includes('"intent":') && cleaned.includes('"response":')) {
      // Remove markdown code blocks or leading/trailing whitespace
      cleaned = cleaned.replace(/```json\n|\n```/g, '').trim();
      
      // Remove any unexpected characters before/after JSON
      cleaned = cleaned.replace(/^[^\{]*\{/, '{').replace(/\}[^\}]*$/, '}');
      
      // Remove any "reasoning" field that might be in the JSON
      cleaned = cleaned.replace(/"reasoning":"[^"]*",?/, '');
      cleaned = cleaned.replace(/,"reasoning":"[^"]*"/, '');
    } else {
      // Not a JSON object, just return a general chat response
      return {
        intent: 'general_chat',
        response: cleaned.substring(0, 500), // Limit response length
        data: {}
      };
    }
    
    // Attempt to parse JSON
    return JSON.parse(cleaned);
  } catch (error) {
    console.error('JSON parsing error:', error.message);
    console.error('Raw response:', rawResponse);
    // Fallback: Treat as general chat response
    return {
      intent: 'general_chat',
      response: typeof rawResponse === 'string' && rawResponse.length > 0 
        ? rawResponse.substring(0, 500) // Limit response length 
        : 'Xin lỗi, tôi không hiểu yêu cầu. Bạn có thể nói rõ hơn không?',
      data: {}
    };
  }
}

// Main chat processing function
async function processChat(userId, message) {
  try {
    console.log(`Processing chat for user ${userId}: ${message}`);
    
    const conversation = getConversation(userId);
    const categories = await getCategoriesContext();
    
    // Handle common patterns directly without API call when possible
    const lowerCaseMessage = message.toLowerCase().trim();
    

    // Prepare system prompt
    const systemPrompt = `
Bạn là trợ lý AI quản lý tài chính, hỗ trợ người dùng bằng tiếng Việt. Nhiệm vụ của bạn là hiểu ngôn ngữ tự nhiên và thực hiện các tác vụ như tạo, tìm kiếm, cập nhật hoặc xóa giao dịch tài chính.

**QUAN TRỌNG**: Trả về phản hồi DƯỚI DẠNG JSON SẠCH, KHÔNG bao gồm dấu backtick (\`\`\`), markdown, hoặc bất kỳ định dạng nào khác ngoài JSON. Ví dụ:
{
  "intent": "create_transaction",
  "response": "Tạo giao dịch thành công",
  "data": { "amount": 500000, "categoryId": 1, "type": "expense", "date": "03-06-2025", "note": "Ăn trưa" }
}

**THÔNG TIN HIỆN TẠI**:
- Thời gian: ${new Date().toLocaleString('vi-VN')}
- Danh mục: ${JSON.stringify(categories)}
- Tháng hiện tại: ${new Date().getMonth() + 1}/${new Date().getFullYear()}

**HƯỚNG DẪN**:
1. Hiểu ngôn ngữ tự nhiên: ví dụ, "chi 500k ăn trưa hôm nay" → tạo giao dịch chi tiêu 500,000 VND, danh mục "ăn uống", ngày hiện tại.
2. Xử lý số tiền: "500k" = 500,000 VND, "1tr5" = 1,500,000 VND.
3. Xử lý thời gian: "hôm nay" = ngày hiện tại, "tháng này" = tháng hiện tại.
4. Nếu không rõ loại giao dịch, mặc định là "expense".
5. Chọn danh mục phù hợp từ danh sách hoặc chọn danh mục đầu tiên nếu không tìm thấy.
6. Định dạng số tiền theo kiểu Việt Nam (1.000.000 ₫).
7. Đối với "giao dịch tháng ..." (không rõ chi tiêu hay thu nhập), trả về:
   {
     "intent": "general_chat",
     "response": "Bạn muốn xem chi tiêu hay thu nhập cho tháng đó?",
     "data": {}
   }
8. Đối với "xin chào", trả về:
   {
     "intent": "general_chat",
     "response": "Chào bạn! Có gì thú vị hôm nay không?",
     "data": {}
   }
9. Đối với "chi tiêu tháng này" hoặc "giao dịch tháng này", trả về:
   {
     "intent": "search_transactions",
     "response": "Danh sách giao dịch tháng này:",
     "data": {
       "type": "expense",
       "startDate": "01-${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${new Date().getFullYear()}",
       "endDate": "${new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${new Date().getFullYear()}"
     }
   }
10. Đối với bất kỳ lỗi nào, trả về intent "general_chat" với phản hồi thân thiện.

**KHÔNG BAO GIỜ** trả về suy nghĩ, lập luận hay phân tích của bạn. Chỉ trả về JSON trực tiếp.

**CÁC INTENT HỖ TRỢ**:
- create_transaction: Tạo giao dịch (data: { amount, categoryId, type, date, note })
- search_transactions: Tìm giao dịch (data: { type, startDate, endDate, categoryId? })
- update_transaction: Cập nhật giao dịch (data: { transactionId, updates })
- delete_transaction: Xóa giao dịch (data: { transactionId })
- create_category: Tạo danh mục (data: { name })
- general_chat: Phản hồi thông thường
`;

    // Prepare messages
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversation.history.slice(-5), // Keep last 5 messages
      { role: 'user', content: message }
    ];

    // Make API call
    console.log('Sending API request to OpenRouter...');
    try {
      const response = await axios.post(
        OPENROUTER_API_URL,
        {
          model: 'deepseek/deepseek-r1:free',
          messages,
          temperature: 0.7,
          max_tokens: 500,
          response_format: { type: 'json_object' }
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://viettel-finance-app.com',
            'X-Title': 'Viettel Finance Assistant'
          },
          timeout: 30000
        }
      );

      // Log full response for debugging
      console.log('Full API response:', JSON.stringify(response.data, null, 2));
      
      // Validate response structure
      if (!response.data?.choices?.[0]?.message?.content) {
        console.error('Invalid API response structure:', response.data);
        return {
          reply: 'Xin lỗi, tôi đang gặp khó khăn trong việc xử lý. Vui lòng thử lại.'
        };
      }

      const aiResponse = response.data.choices[0].message.content;
      console.log('Raw AI response:', aiResponse);
      const parsedResponse = cleanAndParseResponse(aiResponse);

      // Process intent
      const result = await processIntent(userId, parsedResponse, conversation);
      
      conversation.history.push(
        { role: 'user', content: message },
        { role: 'assistant', content: parsedResponse.response }
      );
      
      // Trim history
      if (conversation.history.length > 10) {
        conversation.history = conversation.history.slice(-10);
      }
      
      conversation.lastUpdated = Date.now();
      return result;
    } catch (error) {
      console.error('API call error:', error.message);
      
      // Handle rate limit (429) errors specifically
      if (error.response && error.response.status === 429) {
        console.log('Rate limit exceeded, attempting to process common patterns directly');
        
        // Try to extract intent from message based on common patterns
        let result;
        
        // Pattern for monthly expense report
        if (lowerCaseMessage === 'chi tiêu tháng này' || lowerCaseMessage === 'giao dịch tháng này') {
          console.log('Using direct pattern match for common query:', lowerCaseMessage);
          // Get current month data
          const today = new Date();
          const startDate = `01-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getFullYear()}`;
          const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
          const endDate = `${lastDay}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getFullYear()}`;
          
          try {
            // Use search transactions intent directly
            result = await processIntent(userId, {
              intent: "search_transactions",
              response: "Danh sách giao dịch tháng này:",
              data: {
                type: "expense",
                startDate,
                endDate
              }
            }, conversation);
            
            // Add to conversation history
            conversation.history.push(
              { role: 'user', content: message },
              { role: 'assistant', content: "Danh sách giao dịch tháng này:" }
            );
            
            conversation.lastUpdated = Date.now();
            return result;
          } catch (processError) {
            console.error('Error processing search pattern:', processError);
          }
        }
        
        // Pattern for expense creation
        else if (/^chi (\d+)[kK]/.test(lowerCaseMessage)) {
          // Example: "chi 25k" - try to extract amount and map to a category
          const match = lowerCaseMessage.match(/^chi (\d+)[kK]/);
          if (match && match[1]) {
            const amount = parseInt(match[1], 10) * 1000;
            const defaultCategory = categories[0]?.id || '619c4ad6-00c1-4cfb-8ac6-ac57568ec375'; // Default to Food & Dining if available
            let categoryId = defaultCategory;
            
            // Look for category indicators in the message
            for (const category of categories) {
              if (lowerCaseMessage.includes(category.name.toLowerCase())) {
                categoryId = category.id;
                break;
              }
            }
            
            // Extract any note after the amount
            let note = lowerCaseMessage.replace(/^chi (\d+)[kK]/, '').trim();
            if (!note) note = 'Chi tiêu';
            
            try {
              result = await processIntent(userId, {
                intent: "create_transaction",
                response: "Tạo giao dịch thành công",
                data: {
                  amount: amount,
                  categoryId: categoryId,
                  type: "expense",
                  date: `${(new Date().getDate()).toString().padStart(2, '0')}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${new Date().getFullYear()}`,
                  note: note
                }
              }, conversation);
              
              // Add to conversation history
              conversation.history.push(
                { role: 'user', content: message },
                { role: 'assistant', content: "Tạo giao dịch thành công" }
              );
              
              conversation.lastUpdated = Date.now();
              return result;
            } catch (processError) {
              console.error('Error processing create transaction pattern:', processError);
            }
          }
        }
        
        // Fall back to generic message if no specific pattern matched
        return {
          reply: 'Xin lỗi, hệ thống đang bận. Vui lòng thử lại sau một lúc.',
          toast: {
            type: 'error',
            message: 'Hệ thống đang quá tải. Vui lòng thử lại sau.'
          }
        };
      }
      
      console.error('Error in processChat:', error);
      return handleError(error, userId, message, getConversation(userId));
    }
  } catch (error) {
    console.error('Error in processChat:', error);
    return handleError(error, userId, message, getConversation(userId));
  }
}

// Process AI-detected intent
async function processIntent(userId, aiResponse, conversation) {
  const { intent, response, data } = aiResponse;

  switch (intent) {
    case 'create_transaction': {
      const { amount, categoryId, type, date, note } = data;
      if (!amount || !categoryId) {
        return { reply: 'Thiếu thông tin để tạo giao dịch. Vui lòng cung cấp thêm chi tiết.' };
      }
      
      // Execute transaction creation immediately without confirmation
      try {
        const result = await transactionService.create(
          userId,
          categoryId,
          type,
          amount,
          date,
          note || ''
        );
        
        return {
          reply: result ? 
            `✅ Đã tạo ${type === 'income' ? 'thu nhập' : 'chi tiêu'} ${amount.toLocaleString('vi-VN')} ₫ thành công.` :
            `❌ Lỗi: Không thể tạo giao dịch`,
          toast: result ? {
            type: 'success',
            message: `Đã tạo ${type === 'income' ? 'thu nhập' : 'chi tiêu'} ${amount.toLocaleString('vi-VN')} ₫`
          } : null,
          refreshData: result ? true : false
        };
      } catch (error) {
        console.error('Create transaction error:', error);
        return { 
          reply: `❌ Lỗi: ${error.message || 'Không thể tạo giao dịch'}`,
          toast: {
            type: 'error',
            message: `Lỗi: ${error.message || 'Không thể tạo giao dịch'}`
          }
        };
      }
    }

    case 'search_transactions': {
      try {
        // Ensure we have valid date formats for searchTransactions
        if (data.startDate) {
          try {
            // Validate date format (DD-MM-YYYY)
            const dateRegex = /^(\d{1,2})-(\d{1,2})-(\d{4})$/;
            if (!dateRegex.test(data.startDate)) {
              const today = new Date();
              data.startDate = `01-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getFullYear()}`;
              console.log('Fixed startDate format:', data.startDate);
            }
          } catch (err) {
            console.error('Error parsing startDate:', err);
          }
        }
        
        if (data.endDate) {
          try {
            // Validate date format (DD-MM-YYYY)
            const dateRegex = /^(\d{1,2})-(\d{1,2})-(\d{4})$/;
            if (!dateRegex.test(data.endDate)) {
              const today = new Date();
              const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
              data.endDate = `${lastDay}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getFullYear()}`;
              console.log('Fixed endDate format:', data.endDate);
            }
          } catch (err) {
            console.error('Error parsing endDate:', err);
          }
        }

        const result = await transactionService.searchTransactions(userId, data);
        if (!result || !result.data || result.data.length === 0) {
          return { reply: 'Không tìm thấy giao dịch nào phù hợp với điều kiện tìm kiếm.' };
        }
        const summary = data.type === 'expense' && data.startDate?.includes(`-${new Date().getMonth() + 1}-`)
          ? `Tổng chi tiêu: ${result.data.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0).toLocaleString('vi-VN')} ₫\n`
          : '';
        return {
          reply: `${summary}${formatTransactions(result.data)}`
        };
      } catch (error) {
        console.error('Search transaction error:', error);
        return { reply: 'Không tìm thấy giao dịch nào phù hợp với điều kiện tìm kiếm.' };
      }
    }

    case 'update_transaction': {
      try {
        const result = await transactionService.updateTransaction(data.transactionId, userId, data.updates);
        return { 
          reply: result ? 'Cập nhật giao dịch thành công.' : 'Không thể cập nhật giao dịch.',
          toast: result ? {
            type: 'success',
            message: 'Cập nhật giao dịch thành công'
          } : null,
          refreshData: result ? true : false
        };
      } catch (error) {
        console.error('Update transaction error:', error);
        return { 
          reply: 'Không thể cập nhật giao dịch: ' + error.message,
          toast: {
            type: 'error',
            message: 'Không thể cập nhật giao dịch: ' + error.message
          }
        };
      }
    }

    case 'delete_transaction': {
      try {
        // Execute deletion immediately without confirmation
        const result = await transactionService.deleteTransaction(data.transactionId);
        return { 
          reply: result && result.message ? 'Xóa giao dịch thành công.' : 'Không thể xóa giao dịch.',
          toast: result && result.message ? {
            type: 'success',
            message: 'Xóa giao dịch thành công'
          } : null,
          refreshData: result && result.message ? true : false
        };
      } catch (error) {
        console.error('Delete transaction error:', error);
        return { 
          reply: 'Không thể xóa giao dịch: ' + error.message,
          toast: {
            type: 'error',
            message: 'Không thể xóa giao dịch: ' + error.message
          }
        };
      }
    }

    case 'create_category': {
      const result = await categoryService.create(data.name);
      return { 
        reply: result.success ? `Tạo danh mục "${data.name}" thành công.` : result.message,
        toast: result.success ? {
          type: 'success',
          message: `Tạo danh mục "${data.name}" thành công.`
        } : null,
        refreshData: result.success ? true : false
      };
    }

    default:
      return { reply: response }; // General chat response
  }
}

module.exports = { processChat };