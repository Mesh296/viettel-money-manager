const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');
const { Category } = require('../../models');
const transactionService = require('../transactions');
const categoryService = require('../categories');

dotenv.config();

// Khởi tạo Google Generative AI với API key từ .env
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error('GEMINI_API_KEY is not defined in environment variables');
}

const genAI = new GoogleGenerativeAI(apiKey);

/**
 * Lấy tất cả danh mục để cung cấp cho Gemini làm ngữ cảnh
 */
async function getAllCategoriesForContext() {
  try {
    const categories = await Category.findAll();
    return categories.map(cat => ({
      id: cat.id,
      name: cat.name
    }));
  } catch (error) {
    console.error('Error fetching categories for context:', error);
    return [];
  }
}

// Định dạng kết quả giao dịch hiển thị đẹp hơn
function formatTransactionsForChat(transactions) {
  if (!transactions || transactions.length === 0) {
    return "Không tìm thấy giao dịch nào.";
  }
  
  // Nếu quá nhiều giao dịch, chỉ hiển thị một số
  const maxToShow = 5;
  const hasMore = transactions.length > maxToShow;
  const toShow = hasMore ? transactions.slice(0, maxToShow) : transactions;
  
  // Format đơn giản hơn - mỗi giao dịch trên một dòng
  const formattedTransactions = toShow.map((t, idx) => {
    const date = new Date(t.date).toLocaleDateString('vi-VN');
    const amount = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(t.amount);
    const category = t.category?.name || 'Không có danh mục';
    const type = t.type === 'income' ? 'Thu nhập' : 'Chi tiêu';
    const note = t.note ? ` (${t.note})` : '';
    const id = t.transactionId || t.id; // Đảm bảo lấy được ID
    
    return `${idx + 1}. ${date}: ${type} ${amount} - ${category}${note} [ID: ${id}]`;
  }).join('\n');
  
  const result = `Tìm thấy ${transactions.length} giao dịch:\n\n${formattedTransactions}`;
  return hasMore ? `${result}\n\n... và ${transactions.length - maxToShow} giao dịch khác` : result;
}

/**
 * Fallback handler khi Gemini API không khả dụng
 * Xử lý các lệnh đơn giản dựa trên từ khóa
 */
async function handleFallback(userId, message) {
  console.log("Using fallback handler for message:", message);
  const messageLower = message.toLowerCase().trim();
  
  try {
    // Xử lý các lệnh xóa giao dịch
    if (messageLower.includes("xóa giao dịch") || messageLower.match(/xo[aá]\s+giao\s+d[iị]ch/i)) {
      const deletePattern = /xo[aá]\s+giao\s+d[iị]ch\s+(\d+)/i;
      const match = message.match(deletePattern);
      
      if (match) {
        const transactionId = match[1];
        try {
          const result = await handleDeleteTransaction(userId, { transactionId });
          if (result.success) {
            return {
              reply: `✅ Đã xóa giao dịch với ID ${transactionId} thành công.`,
              functionCall: {
                name: "deleteTransaction",
                args: { transactionId },
                result
              }
            };
          } else {
            return {
              reply: `❌ Không thể xóa giao dịch: ${result.message}`
            };
          }
        } catch (error) {
          console.error("Error deleting transaction:", error);
          return { reply: "❌ Có lỗi xảy ra khi xóa giao dịch. Vui lòng thử lại sau." };
        }
      }
      
      return {
        reply: "Để xóa giao dịch, vui lòng cung cấp ID của giao dịch.\n\nVí dụ: xóa giao dịch 123"
      };
    }

    // Xử lý các lệnh tạo giao dịch
    else if (messageLower.includes("tạo giao dịch") || 
        messageLower.includes("thêm giao dịch") || 
        messageLower.includes("tạo transaction")) {
      
      // Kiểm tra xem người dùng đã nhập đầy đủ thông tin chưa
      const createPattern = /tạo\s+giao\s+dịch\s+(thu\s+nhập|chi\s+tiêu)\s+(\d+)\s+([^\s]+)\s+(\d{1,2}-\d{1,2}-\d{4})(?:\s+(.+))?/i;
      const match = message.match(createPattern);
      
      if (match) {
        // Đã nhận đủ thông tin, phân tích cú pháp
        const type = match[1].toLowerCase().includes('thu') ? 'income' : 'expense';
        const amount = parseFloat(match[2]);
        const categoryName = match[3];
        const date = match[4]; // DD-MM-YYYY
        const note = match[5] || '';
        
        // Tìm categoryId từ tên danh mục
        const categories = await getAllCategoriesForContext();
        const category = categories.find(c => c.name.toLowerCase() === categoryName.toLowerCase());
        
        if (!category) {
          return {
            reply: `❌ Không tìm thấy danh mục "${categoryName}". Vui lòng chọn một trong các danh mục sau hoặc tạo mới:\n\n${categories.map(c => `- ${c.name}`).join('\n')}`
          };
        }
        
        // Gọi API tạo giao dịch
        const result = await handleCreateTransaction(userId, {
          categoryId: category.id,
          type,
          amount,
          date,
          note
        });
        
        if (result.success) {
          const formattedAmount = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
          return {
            reply: `✅ Đã tạo giao dịch thành công:\n\n${type === 'income' ? '📈 Thu nhập' : '📉 Chi tiêu'} ${formattedAmount}\n📆 Ngày: ${date}\n📌 Danh mục: ${categoryName}${note ? '\n📝 Ghi chú: ' + note : ''}`,
            functionCall: {
              name: "createTransaction",
              args: {
                categoryId: category.id,
                type,
                amount,
                date,
                note
              },
              result
            }
          };
        } else {
          return {
            reply: `❌ Không thể tạo giao dịch: ${result.message}`
          };
        }
      }
      
      // Nếu chưa đủ thông tin, hiển thị hướng dẫn
      return {
        reply: "📝 Tôi có thể giúp bạn tạo giao dịch. Vui lòng cung cấp thông tin theo định dạng: \n\n*tạo giao dịch [thu nhập/chi tiêu] [số tiền] [danh mục] [ngày DD-MM-YYYY] [ghi chú]*.\n\nVí dụ: tạo giao dịch thu nhập 500000 Lương 15-05-2024 Lương tháng 5"
      };
    }
    
    // Xử lý lệnh tìm kiếm giao dịch
    else if (messageLower.includes("tìm giao dịch") || 
             messageLower.includes("xem giao dịch") ||
             messageLower.includes("tìm transaction")) {
      
      // Tìm từ ngày nào đến ngày nào
      let startDate, endDate;
      
      // Xử lý đơn giản: nếu có "tháng này" thì lấy giao dịch tháng hiện tại
      if (messageLower.includes("tháng này")) {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        
        try {
          const result = await transactionService.searchTransactions(userId, {
            startDate: `01-${month.toString().padStart(2, '0')}-${year}`,
            endDate: `${new Date(year, month, 0).getDate()}-${month.toString().padStart(2, '0')}-${year}`,
            page: 1,
            limit: 10
          });
          
          if (result && result.data && result.data.length > 0) {
            const formatted = formatTransactionsForChat(result.data);
            return {
              reply: formatted,
              functionCall: {
                name: "searchTransactions",
                args: {
                  startDate: `01-${month.toString().padStart(2, '0')}-${year}`,
                  endDate: `${new Date(year, month, 0).getDate()}-${month.toString().padStart(2, '0')}-${year}`
                },
                result: {
                  success: true,
                  message: `Tìm thấy ${result.data.length} giao dịch`,
                  transactions: result.data,
                  pagination: result.pagination
                }
              }
            };
          }
          
          return {
            reply: "🔍 Không tìm thấy giao dịch nào trong tháng này."
          };
          
        } catch (error) {
          console.error("Fallback search error:", error);
          return { reply: "❌ Không thể tìm kiếm giao dịch. Vui lòng thử lại sau." };
        }
      }
      
      return {
        reply: "🔍 Tôi có thể giúp bạn tìm giao dịch. Hãy thử các lệnh như:\n\n- Tìm giao dịch tháng này\n- Tìm giao dịch thu nhập\n- Tìm giao dịch chi tiêu"
      };
    }
    
    // Xử lý lệnh danh mục
    else if (messageLower.includes("danh mục") || messageLower.includes("category")) {
      // Kiểm tra lệnh tạo danh mục mới
      const createCategoryPattern = /tạo\s+danh\s+mục\s+(.+)/i;
      const match = message.match(createCategoryPattern);
      
      if (match) {
        const categoryName = match[1].trim();
        try {
          const result = await handleCreateCategory({ name: categoryName });
          if (result.success) {
            return {
              reply: `✅ Đã tạo danh mục "${categoryName}" thành công.`,
              functionCall: {
                name: "createCategory",
                args: { name: categoryName },
                result
              }
            };
          } else {
            return {
              reply: `❌ Không thể tạo danh mục: ${result.message}`
            };
          }
        } catch (error) {
          console.error("Error creating category:", error);
          return { reply: "❌ Có lỗi xảy ra khi tạo danh mục. Vui lòng thử lại sau." };
        }
      }
      
      // Hiển thị danh sách danh mục
      try {
        const categories = await getAllCategoriesForContext();
        const formattedCategories = categories.map(cat => `📌 ${cat.name}`).join('\n');
        return {
          reply: `📋 *Danh sách danh mục:*\n\n${formattedCategories}\n\nBạn có thể tạo danh mục mới bằng cách nhập: *tạo danh mục [tên danh mục]*`
        };
      } catch (error) {
        console.error("Error fetching categories:", error);
        return { reply: "❌ Không thể lấy danh sách danh mục. Vui lòng thử lại sau." };
      }
    }
    
    // Xử lý lệnh trợ giúp
    else if (messageLower.includes("trợ giúp") || messageLower.includes("help") || messageLower.includes("hướng dẫn")) {
      return {
        reply: `📚 *Hướng dẫn sử dụng chatbot:*\n\n1️⃣ *Tạo giao dịch mới:*\n   tạo giao dịch [thu nhập/chi tiêu] [số tiền] [danh mục] [ngày DD-MM-YYYY] [ghi chú]\n\n2️⃣ *Tìm kiếm giao dịch:*\n   tìm giao dịch tháng này\n\n3️⃣ *Xem danh sách danh mục:*\n   danh mục\n\n4️⃣ *Tạo danh mục mới:*\n   tạo danh mục [tên danh mục]\n\n5️⃣ *Xóa giao dịch:*\n   xóa giao dịch [ID giao dịch]`
      };
    }
    
    // Trả lời mặc định
    return {
      reply: "Xin lỗi, dịch vụ AI hiện đang quá tải. Tôi có thể giúp bạn thực hiện các tác vụ cơ bản như:\n\n- Tạo giao dịch\n- Tìm giao dịch trong tháng này\n- Xem danh sách danh mục\n- Tạo danh mục mới\n- Xóa giao dịch\n\nNhập 'trợ giúp' để xem hướng dẫn chi tiết."
    };
  } catch (error) {
    console.error("Fallback handler error:", error);
    return {
      reply: "❌ Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau hoặc sử dụng giao diện thông thường của ứng dụng."
    };
  }
}

/**
 * Xử lý chat với Gemini AI
 */
async function processChat(userId, message) {
  try {
    // Lấy danh sách các danh mục để cung cấp cho Gemini
    const categories = await getAllCategoriesForContext();
    
    // Chuẩn bị system prompt
    const systemPrompt = `
Bạn là trợ lý AI hỗ trợ quản lý tài chính cá nhân. Bạn có khả năng giúp người dùng tạo, xem, sửa và xóa các giao dịch tài chính. 
Hãy trả lời một cách ngắn gọn, chuyên nghiệp và thân thiện.

THÔNG TIN QUAN TRỌNG:
1. Danh sách các danh mục hiện có: ${JSON.stringify(categories)}
2. Nếu người dùng muốn tạo giao dịch với danh mục không có trong danh sách, hãy đề nghị họ tạo danh mục mới trước.
3. Khi người dùng yêu cầu tạo giao dịch, bạn cần hỏi các thông tin: loại giao dịch (thu nhập/chi tiêu), số tiền, danh mục, ngày và ghi chú (không bắt buộc).
4. Khi xử lý ngày tháng, hãy chuyển đổi thành định dạng "DD-MM-YYYY" để phù hợp với API.
5. Nếu người dùng yêu cầu thông tin không rõ ràng, hãy hỏi thêm để làm rõ.
`;

    console.log("Setting up Gemini model (gemini-2.0-flash)");
    
    try {
      // Thử sử dụng Gemini API
      // Khởi tạo model gemini-2.0-flash (phiên bản mới)
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  
      // Tạo các tool definitions cho function calling
      const tools = [
        {
          functionDeclarations: [
            {
              name: "createTransaction",
              description: "Tạo một giao dịch mới",
              parameters: {
                type: "object",
                properties: {
                  categoryId: {
                    type: "string",
                    description: "ID của danh mục"
                  },
                  type: {
                    type: "string",
                    enum: ["income", "expense"],
                    description: "Loại giao dịch: thu nhập hoặc chi tiêu"
                  },
                  amount: {
                    type: "number",
                    description: "Số tiền của giao dịch (số dương)"
                  },
                  date: {
                    type: "string",
                    description: "Ngày giao dịch, định dạng DD-MM-YYYY"
                  },
                  note: {
                    type: "string",
                    description: "Ghi chú về giao dịch (không bắt buộc)"
                  }
                },
                required: ["categoryId", "type", "amount", "date"]
              }
            },
            {
              name: "searchTransactions",
              description: "Tìm kiếm giao dịch theo các tiêu chí",
              parameters: {
                type: "object",
                properties: {
                  startDate: {
                    type: "string",
                    description: "Ngày bắt đầu tìm kiếm, định dạng DD-MM-YYYY"
                  },
                  endDate: {
                    type: "string", 
                    description: "Ngày kết thúc tìm kiếm, định dạng DD-MM-YYYY"
                  },
                  type: {
                    type: "string",
                    enum: ["income", "expense"],
                    description: "Loại giao dịch: thu nhập hoặc chi tiêu"
                  },
                  categoryId: {
                    type: "string",
                    description: "ID của danh mục"
                  },
                  minAmount: {
                    type: "number",
                    description: "Số tiền tối thiểu"
                  },
                  maxAmount: {
                    type: "number",
                    description: "Số tiền tối đa"
                  },
                  keyword: {
                    type: "string",
                    description: "Từ khóa tìm kiếm trong ghi chú"
                  }
                }
              }
            },
            {
              name: "updateTransaction",
              description: "Cập nhật thông tin của một giao dịch",
              parameters: {
                type: "object",
                properties: {
                  transactionId: {
                    type: "string",
                    description: "ID của giao dịch cần cập nhật"
                  },
                  updates: {
                    type: "object",
                    description: "Các trường cần cập nhật",
                    properties: {
                      categoryId: {
                        type: "string",
                        description: "ID của danh mục mới"
                      },
                      type: {
                        type: "string",
                        enum: ["income", "expense"],
                        description: "Loại giao dịch: thu nhập hoặc chi tiêu"
                      },
                      amount: {
                        type: "number",
                        description: "Số tiền mới của giao dịch (số dương)"
                      },
                      date: {
                        type: "string",
                        description: "Ngày giao dịch mới, định dạng DD-MM-YYYY"
                      },
                      note: {
                        type: "string",
                        description: "Ghi chú mới về giao dịch"
                      }
                    }
                  }
                },
                required: ["transactionId", "updates"]
              }
            },
            {
              name: "deleteTransaction",
              description: "Xóa một giao dịch",
              parameters: {
                type: "object",
                properties: {
                  transactionId: {
                    type: "string",
                    description: "ID của giao dịch cần xóa"
                  }
                },
                required: ["transactionId"]
              }
            },
            {
              name: "createCategory",
              description: "Tạo một danh mục mới",
              parameters: {
                type: "object",
                properties: {
                  name: {
                    type: "string",
                    description: "Tên của danh mục mới"
                  }
                },
                required: ["name"]
              }
            }
          ]
        }
      ];
  
      console.log("Sending request to Gemini API");
  
      // Cấu trúc yêu cầu mới theo API mới nhất
      const request = {
        contents: [
          {
            role: "user",
            parts: [{ text: systemPrompt }]
          },
          {
            role: "model",
            parts: [{ text: "Tôi đã hiểu. Tôi sẽ hỗ trợ người dùng với các giao dịch tài chính theo hướng dẫn. Tôi sẽ sử dụng các hàm đã định nghĩa khi cần thiết." }]
          },
          {
            role: "user",
            parts: [{ text: message }]
          }
        ],
        tools: tools,
        generationConfig: {
          temperature: 0.2,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      };
  
      // Gửi yêu cầu đến Gemini API với timeout 10 giây
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Gemini API timeout")), 10000)
      );
      
      const result = await Promise.race([
        model.generateContent(request),
        timeoutPromise
      ]);
      
      console.log("Received response from Gemini API");
  
      // Truy cập phản hồi
      const response = result.response;
      const responseText = response.text();
      
      // Xử lý function call nếu có
      if (response.functionCalls && response.functionCalls().length > 0) {
        const functionCall = response.functionCalls()[0]; // Lấy function call đầu tiên
        const functionName = functionCall.name;
        const functionArgs = JSON.parse(functionCall.args);
        
        console.log(`Function called: ${functionName}`, functionArgs);
        
        let functionResult;
        
        // Xử lý từng loại function call
        switch (functionName) {
          case 'createTransaction':
            functionResult = await handleCreateTransaction(userId, functionArgs);
            break;
          
          case 'searchTransactions':
            functionResult = await handleSearchTransactions(userId, functionArgs);
            break;
          
          case 'updateTransaction':
            functionResult = await handleUpdateTransaction(userId, functionArgs);
            break;
          
          case 'deleteTransaction':
            functionResult = await handleDeleteTransaction(userId, functionArgs);
            break;
          
          case 'createCategory':
            functionResult = await handleCreateCategory(functionArgs);
            break;
          
          default:
            functionResult = { error: `Không hỗ trợ hàm ${functionName}` };
        }
        
        // Phản hồi bao gồm cả kết quả của function call và text
        return {
          reply: responseText,
          functionCall: {
            name: functionName,
            args: functionArgs,
            result: functionResult
          }
        };
      }
      
      // Trường hợp không có function call nào, chỉ trả về text
      return { reply: responseText };
    } catch (geminiError) {
      // Nếu Gemini API lỗi, ghi log và sử dụng fallback
      console.error('Error with Gemini API:', geminiError);
      console.log('Switching to fallback handler');
      return await handleFallback(userId, message);
    }

  } catch (error) {
    console.error('Error processing chat:', error);
    throw new Error(`Không thể xử lý tin nhắn: ${error.message}`);
  }
}

/**
 * Xử lý tạo giao dịch
 */
async function handleCreateTransaction(userId, args) {
  try {
    const { categoryId, type, amount, date, note } = args;
    const result = await transactionService.create(
      userId, 
      categoryId, 
      type, 
      amount, 
      date, 
      note || ''
    );
    return {
      success: true,
      message: 'Giao dịch đã được tạo thành công',
      transaction: result
    };
  } catch (error) {
    console.error('Error creating transaction:', error);
    return {
      success: false,
      message: error.message || 'Không thể tạo giao dịch'
    };
  }
}

/**
 * Xử lý tìm kiếm giao dịch
 */
async function handleSearchTransactions(userId, args) {
  try {
    const result = await transactionService.searchTransactions(userId, args);
    return {
      success: true,
      message: `Tìm thấy ${result.data?.length || 0} giao dịch`,
      transactions: result.data,
      pagination: result.pagination
    };
  } catch (error) {
    console.error('Error searching transactions:', error);
    return {
      success: false,
      message: error.message || 'Không thể tìm kiếm giao dịch'
    };
  }
}

/**
 * Xử lý cập nhật giao dịch
 */
async function handleUpdateTransaction(userId, args) {
  try {
    const { transactionId, updates } = args;
    const result = await transactionService.updateTransaction(
      transactionId, 
      userId, 
      updates
    );
    return {
      success: true,
      message: 'Giao dịch đã được cập nhật thành công',
      transaction: result
    };
  } catch (error) {
    console.error('Error updating transaction:', error);
    return {
      success: false,
      message: error.message || 'Không thể cập nhật giao dịch'
    };
  }
}

/**
 * Xử lý xóa giao dịch
 */
async function handleDeleteTransaction(userId, args) {
  try {
    const { transactionId } = args;
    const result = await transactionService.deleteTransaction(transactionId);
    return {
      success: true,
      message: 'Giao dịch đã được xóa thành công'
    };
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return {
      success: false,
      message: error.message || 'Không thể xóa giao dịch'
    };
  }
}

/**
 * Xử lý tạo danh mục
 */
async function handleCreateCategory(args) {
  try {
    const { name } = args;
    const result = await categoryService.create(name);
    return {
      success: true,
      message: 'Danh mục đã được tạo thành công',
      category: result
    };
  } catch (error) {
    console.error('Error creating category:', error);
    return {
      success: false,
      message: error.message || 'Không thể tạo danh mục'
    };
  }
}

module.exports = {
  processChat
}; 