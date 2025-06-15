const axios = require('axios');
const dotenv = require('dotenv');
const { Category, Budget, UserCategory, Transaction } = require('../../models');
const { Op } = require('sequelize');
const transactionService = require('../transactions');
const categoryService = require('../categories');
const { getCache, setCache, deleteCache } = require('../../providers/redis');


dotenv.config();

const apiKey = process.env.OPENROUTER_API_KEY;
if (!apiKey) throw new Error('OPENROUTER_API_KEY is not defined');

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const CONVERSATION_EXPIRY = 30 * 60; // 30 phút (trong Redis sẽ dùng seconds)

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
    // const id = t.transactionId || t.id; // Handle both id formats
    return `${idx + 1}. ${date}: ${type} ${amount} - ${categoryName}${note}`;
  }).join('\n');
  
  return formatted
}

// Helper to get categories for context
async function getCategoriesContext() {
  // Thử lấy từ cache trước
  const cachedCategories = await getCache('cache:chatbot:categories');
  if (cachedCategories) {
    return cachedCategories;
  }

  try {
    const categories = await Category.findAll();
    const formattedCategories = categories.map(cat => ({ id: cat.id, name: cat.name }));
    
    // Cache lại với thời hạn 30 phút
    await setCache('cache:chatbot:categories', formattedCategories, CONVERSATION_EXPIRY);
    
    return formattedCategories;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

// Helper to manage conversation in Redis
async function getConversation(userId) {
  const redisKey = `cache:chatbot:conversation:${userId}`;
  
  try {
    // Lấy lịch sử hội thoại từ Redis
    const conversation = await getCache(redisKey);
    
    if (conversation) {
      // Đặt lại TTL thêm 30 phút
      await setCache(redisKey, conversation, CONVERSATION_EXPIRY);
      return conversation;
    }
    
    // Khởi tạo hội thoại mới
    const newConversation = { history: [], pendingAction: null };
    await setCache(redisKey, newConversation, CONVERSATION_EXPIRY);
    return newConversation;
  } catch (error) {
    console.error('Redis conversation error:', error);
    // Fallback nếu Redis lỗi
    return { history: [], pendingAction: null };
  }
}

// Helper to handle errors
async function handleError(error, userId, message, conversation) {
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);
  const userMessage = 'Xin lỗi, đã xảy ra lỗi. Vui lòng thử lại sau.';
  
  // Thêm vào lịch sử hội thoại
  conversation.history.push(
    { role: 'user', content: message },
    { role: 'assistant', content: userMessage }
  );
  
  // Lưu lại vào Redis
  const redisKey = `cache:chatbot:conversation:${userId}`;
  await setCache(redisKey, conversation, CONVERSATION_EXPIRY);
  
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
    
    const conversation = await getConversation(userId);
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
      
      // Lưu lịch sử hội thoại
      conversation.history.push(
        { role: 'user', content: message },
        { role: 'assistant', content: parsedResponse.response }
      );
      
      // Trim history
      if (conversation.history.length > 10) {
        conversation.history = conversation.history.slice(-10);
      }
      
      // Cập nhật vào Redis
      const redisKey = `cache:chatbot:conversation:${userId}`;
      await setCache(redisKey, conversation, CONVERSATION_EXPIRY);
      
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
              
              // The processIntent function now handles the conversation history update
              
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
      return handleError(error, userId, message, await getConversation(userId));
    }
  } catch (error) {
    console.error('Error in processChat:', error);
    return handleError(error, userId, message, await getConversation(userId));
  }
}

// Process AI-detected intent
async function processIntent(userId, aiResponse, conversation) {
  const { intent, response, data } = aiResponse;

  // Log conversation history
  console.log('DEBUG - Current conversation history:', JSON.stringify(conversation.history, null, 2));
  
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
        
        // Nếu type là "expense" (chi tiêu), kiểm tra xem giao dịch có vượt ngân sách không
        let budgetAlert = null;
        if (type === 'expense' && result) {
          // Lấy thông tin của danh mục
          const category = await Category.findByPk(categoryId);
          const categoryName = category ? category.name : 'Không xác định';
          
          // Kiểm tra ngân sách tháng
          const currentDate = new Date();
          let transactionMonth, transactionYear;
          
          if (date) {
            const parts = date.split('-');
            if (parts.length === 3) {
              transactionMonth = parseInt(parts[1], 10);
              transactionYear = parseInt(parts[2], 10);
            }
          } else {
            transactionMonth = currentDate.getMonth() + 1; // 1-12
            transactionYear = currentDate.getFullYear();
          }
          
          // Create the transaction date object once
          const transactionDay = parseInt(date ? date.split('-')[0] : new Date().getDate());
          const transactionDate = new Date(transactionYear, transactionMonth - 1, transactionDay);
          console.log(`DEBUG - Transaction date: ${transactionDate.toISOString()}`);
          
          // Kiểm tra ngân sách cho giao dịch này
          try {
            console.log('DEBUG - Starting budget check for userId:', userId);
            // 1. Kiểm tra ngân sách tổng tháng
            const monthNames = [
              'January', 'February', 'March', 'April', 'May', 'June',
              'July', 'August', 'September', 'October', 'November', 'December'
            ];
            const monthStr = `${monthNames[transactionMonth - 1]} ${transactionYear}`;
            console.log(`DEBUG - Looking for budget with month=${monthStr}`);
            
            const budget = await Budget.findOne({
              where: { 
                userId, 
                month: monthStr 
              }
            });
            
            console.log('DEBUG - Budget found:', budget ? JSON.stringify(budget) : 'null');
            
            if (budget) {
              // Tính tổng chi tiêu trong tháng
              const startDate = new Date(transactionYear, transactionMonth - 1, 1);
              const endDate = new Date(transactionYear, transactionMonth, 0);
              
              console.log(`DEBUG - Calculating expenses from ${startDate.toISOString()} to ${endDate.toISOString()}`);
              
              const totalExpenses = await Transaction.sum('amount', {
                where: { 
                  userId,
                  type: 'expense',
                  date: {
                    [Op.between]: [startDate, endDate]
                  }
                }
              });
              
              // Cộng thêm số tiền của giao dịch hiện tại nếu không nằm trong khoảng thời gian tính toán
              let finalTotalExpenses = totalExpenses;
              if (!(transactionDate >= startDate && transactionDate <= endDate)) {
                finalTotalExpenses += amount;
              }
              
              console.log(`DEBUG - Total expenses: ${totalExpenses}, With current transaction: ${finalTotalExpenses}, Budget amount: ${budget.budget}`);
              
              // Kiểm tra nếu tổng chi tiêu vượt ngân sách
              if (budget.budget > 0 && finalTotalExpenses > budget.budget) {
                const formattedBudget = new Intl.NumberFormat('vi-VN').format(budget.budget);
                const monthText = (transactionMonth === currentDate.getMonth() + 1 && transactionYear === currentDate.getFullYear()) 
                  ? "tháng này" 
                  : `tháng ${transactionMonth}/${transactionYear}`;
                
                budgetAlert = `❗️ CẢNH BÁO ❗️\nChi tiêu ${monthText} đã vượt ngân sách ${formattedBudget}₫\n(Tổng chi tiêu: ${new Intl.NumberFormat('vi-VN').format(finalTotalExpenses)}₫)`;
                console.log('DEBUG - Monthly budget alert created:', budgetAlert);
              } else {
                console.log(`DEBUG - No monthly budget alert: Budget is ${budget.budget}, expenses are ${finalTotalExpenses}`);
              }
            } else {
              console.log('DEBUG - No monthly budget found for this month/user');
            }
            
            // 2. Kiểm tra ngân sách theo danh mục
            console.log(`DEBUG - Looking for category budget for categoryId=${categoryId}`);
            
            const userCategory = await UserCategory.findOne({
              where: { 
                userId,
                categoryId,
                month: monthStr  // Sử dụng cùng định dạng tháng đã sửa ở trên
              }
            });
            
            console.log('DEBUG - Category budget found:', userCategory ? JSON.stringify(userCategory) : 'null');
            
            if (userCategory && userCategory.budget_limit > 0) {
              // Tính chi tiêu cho danh mục này trong tháng
              const startDate = new Date(transactionYear, transactionMonth - 1, 1);
              const endDate = new Date(transactionYear, transactionMonth, 0);
              
              console.log(`DEBUG - Calculating category expenses from ${startDate.toISOString()} to ${endDate.toISOString()}`);
              
              const categoryExpense = await Transaction.sum('amount', {
                where: { 
                  userId,
                  categoryId,
                  type: 'expense',
                  date: {
                    [Op.between]: [startDate, endDate]
                  }
                }
              });
              
              // Cộng thêm số tiền của giao dịch hiện tại nếu cùng danh mục và không nằm trong khoảng thời gian tính toán
              let finalCategoryExpense = categoryExpense;
              if (!(transactionDate >= startDate && transactionDate <= endDate)) {
                finalCategoryExpense += amount;
              }
              
              console.log(`DEBUG - Category expenses: ${categoryExpense}, With current transaction: ${finalCategoryExpense}, Category budget: ${userCategory.budget_limit}`);
              
              // Kiểm tra nếu chi tiêu danh mục vượt ngân sách danh mục
              if (finalCategoryExpense > userCategory.budget_limit) {
                const formattedBudget = new Intl.NumberFormat('vi-VN').format(userCategory.budget_limit);
                const monthText = (transactionMonth === currentDate.getMonth() + 1 && transactionYear === currentDate.getFullYear()) 
                  ? "tháng này" 
                  : `tháng ${transactionMonth}/${transactionYear}`;
                
                // Nếu đã có cảnh báo tổng ngân sách, thêm vào sau dấu xuống dòng
                if (budgetAlert) {
                  budgetAlert += `\n\n❗️ CẢNH BÁO ❗️\nChi tiêu danh mục "${categoryName}" ${monthText} đã vượt ngân sách ${formattedBudget}₫\n(Chi tiêu danh mục: ${new Intl.NumberFormat('vi-VN').format(finalCategoryExpense)}₫)`;
                } else {
                  budgetAlert = `❗️ CẢNH BÁO ❗️\nChi tiêu danh mục "${categoryName}" ${monthText} đã vượt ngân sách ${formattedBudget}₫\n(Chi tiêu danh mục: ${new Intl.NumberFormat('vi-VN').format(finalCategoryExpense)}₫)`;
                }
                console.log('DEBUG - Category budget alert created:', budgetAlert);
              } else {
                console.log(`DEBUG - No category budget alert: Budget is ${userCategory.budget_limit}, expenses are ${finalCategoryExpense}`);
              }
            } else {
              console.log('DEBUG - No category budget found for this category/user');
            }
          } catch (budgetError) {
            console.error('Error checking budget alerts:', budgetError);
          }
        }
        
        // Thêm cảnh báo ngân sách vào phản hồi (nếu có)
        let replyMessage;
        if (budgetAlert) {
          // Thêm thông báo thành công ở đầu
          const successMessage = `✅ Đã tạo ${type === 'income' ? 'thu nhập' : 'chi tiêu'} ${amount.toLocaleString('vi-VN')} ₫ thành công.`;
          replyMessage = `${successMessage}\n\n${budgetAlert}`;
        } else {
          replyMessage = `✅ Đã tạo ${type === 'income' ? 'thu nhập' : 'chi tiêu'} ${amount.toLocaleString('vi-VN')} ₫ thành công.`;
        }
        console.log('DEBUG - Final reply message:', replyMessage);
        
        // Cập nhật conversation history ở đây để phù hợp với nội dung bot trả về
        conversation.history.push(
          { role: 'user', content: `Tạo ${type === 'income' ? 'thu nhập' : 'chi tiêu'} ${amount.toLocaleString('vi-VN')} ₫` },
          { role: 'assistant', content: replyMessage }
        );
        
        // Trim history
        if (conversation.history.length > 10) {
          conversation.history = conversation.history.slice(-10);
        }
        
        // Cập nhật vào Redis
        const redisKey = `cache:chatbot:conversation:${userId}`;
        await setCache(redisKey, conversation, CONVERSATION_EXPIRY);
        
        return {
          reply: result ? replyMessage : `❌ Lỗi: Không thể tạo giao dịch`,
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