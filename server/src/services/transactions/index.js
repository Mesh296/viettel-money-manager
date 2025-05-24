const { Transaction, UserCategory, Budget, User, Category } = require('../../models');
const { Sequelize } = require('sequelize');

const parseDate = (dateString) => {
    if (!dateString) return new Date(); // Default to current date if not provided
    const [day, month, year] = dateString.split('-').map(Number);
    console.log(dateString)
    console.log(day, month, year)
    if (!day || !month || !year || day > 31 || month > 12 || year < 1900 || year > 2100) {
        throw new Error('Invalid date format: Expected DD-MM-YYYY, year between 1900 and 2100');
    }
    const date = new Date(year, month - 1, day); // month is 0-based in JavaScript
    if (isNaN(date.getTime())) {
        throw new Error('Invalid date: Unable to parse date');
    }
    return date;
};

const create = async (currentUserId, categoryId, type, amount, date = null, note = null) => {
    try {
        if (!categoryId || !['income', 'expense'].includes(type) || typeof amount !== 'number' || amount < 0) {
            throw new Error('Valid categoryId, type (income/expense), and non-negative amount are required');
        }

        const user = await User.findByPk(currentUserId);
        const category = await Category.findByPk(categoryId);
        if (!user || !category) {
            throw new Error('User or category not found');
        }

        const transactionDate = parseDate(date);
        console.log("date: ", transactionDate);
        const transactionMonth = transactionDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });

        console.log()
        
        let userCategory = await UserCategory.findOne({ where: { userId: currentUserId, categoryId, month: transactionMonth } });
        if (!userCategory) {
            userCategory = await UserCategory.create({
                userId: currentUserId,
                categoryId,
                budget_limit: type === 'expense' ? 0.0 : amount,
                month: transactionMonth, // Set month to match transaction
            });
        }
        console.log("runheeeee")
        let budget = await Budget.findOne({ where: { userId: currentUserId, month: transactionMonth } });
        if (!budget) {
            budget = await Budget.create({
                userId: currentUserId,
                month: transactionMonth,
                budget: type === 'expense' ? 0.0 : amount,
            });
        }

        const transaction = await Transaction.create({
            userId: currentUserId,
            categoryId: categoryId,
            type,
            amount,
            date: transactionDate,
            note,
        });

        if (type === 'expense') {
            // Deduct the full amount from both budget_limit and budget, allowing negative values
            const amountToDeductFromUserCategory = amount;
            const amountToDeductFromBudget = amount;

            if (amountToDeductFromUserCategory > 0) {
                await UserCategory.update(
                    { budget_limit: Sequelize.literal(`budget_limit - ${amountToDeductFromUserCategory}`) },
                    { where: { userId: currentUserId, categoryId, month: transactionMonth } }
                );
            }

            if (amountToDeductFromBudget > 0) {
                await Budget.update(
                    { budget: Sequelize.literal(`budget - ${amountToDeductFromBudget}`) },
                    { where: { userId: currentUserId, month: transactionMonth } }
                );
            }
        } else if (type === 'income') {
            await UserCategory.update(
                { budget_limit: Sequelize.literal(`budget_limit + ${amount}`) },
                { where: { userId: currentUserId, categoryId } }
            );
            await Budget.update(
                { budget: Sequelize.literal(`budget + ${amount}`) },
                { where: { userId: currentUserId, month: transactionMonth } }
            );
        }

        return transaction;
    } catch (error) {
        throw new Error(error.message || 'Error creating transaction');
    }
};

const getAll = async () => {
    try {
        const transactions = await Transaction.findAll({
            include: [
                { model: User, as: 'user', attributes: ['id', 'email'] },
                { model: Category, as: 'category', attributes: ['id', 'name'] },
            ],
        });
        return transactions;
    } catch (error) {
        throw new Error(error.message || 'Error fetching transactions');
    }
};

const getAllUserTransactions = async (currentUserId) => {
    try {
        const transactions = await Transaction.findAll({
            where: { userId: currentUserId },
            include: [
                { model: User, as: 'user', attributes: ['id', 'email'] },
                { model: Category, as: 'category', attributes: ['id', 'name'] },
            ],
        });
        return transactions;
    } catch (error) {
        throw new Error(error.message || 'Error fetching transactions');
    }
}

const getById = async (transactionId) => {
    try {
        const transaction = await Transaction.findByPk(transactionId, {
            include: [
                { model: User, as: 'user', attributes: ['id', 'email'] },
                { model: Category, as: 'category', attributes: ['id', 'name'] },
            ],
        });
        if (!transaction) {
            throw new Error('Transaction not found');
        }
        return transaction;
    } catch (error) {
        throw new Error(error.message || 'Error fetching transaction');
    }
};

const deleteTransaction = async (transactionId) => {
    try {
        const transaction = await Transaction.findByPk(transactionId);
        if (!transaction) {
            throw new Error('Transaction not found');
        }

        const { userId, categoryId, type, amount, date } = transaction;
        const transactionMonth = date.toLocaleString('en-US', { month: 'long', year: 'numeric' });

        // Find associated UserCategory and Budget
        const userCategory = await UserCategory.findOne({ where: { userId, categoryId } });
        const budget = await Budget.findOne({ where: { userId, month: transactionMonth } });

        if (userCategory && budget) {
            if (type === 'expense') {
                await UserCategory.update(
                    { budget_limit: Sequelize.literal(`budget_limit + ${amount}`) },
                    { where: { userId, categoryId } }
                );
                await Budget.update(
                    { budget: Sequelize.literal(`budget + ${amount}`) },
                    { where: { userId, month: transactionMonth } }
                );
            } else if (type === 'income') {
                await UserCategory.update(
                    { budget_limit: Sequelize.literal(`budget_limit - ${amount}`) },
                    { where: { userId, categoryId } }
                );
                await Budget.update(
                    { budget: Sequelize.literal(`budget - ${amount}`) },
                    { where: { userId, month: transactionMonth } }
                );
            }
        }

        await Transaction.destroy({ where: { transactionId } });
        return { message: 'Transaction deleted successfully' };
    } catch (error) {
        throw new Error(error.message || 'Error deleting transaction');
    }
};

// Lấy thống kê tổng thu nhập, tổng chi tiêu và số dư
const getSummaryStats = async (userId, startDate = null, endDate = null) => {
    try {
        let whereClause = { userId };

        if (startDate && endDate) {
            const start = parseDate(startDate);
            const end = parseDate(endDate);
            whereClause.date = {
                [Sequelize.Op.between]: [start, end]
            };
        }

        const transactions = await Transaction.findAll({
            where: whereClause,
            attributes: [
                'type',
                [Sequelize.fn('SUM', Sequelize.col('amount')), 'total']
            ],
            group: ['type']
        });

        let totalIncome = 0;
        let totalExpense = 0;

        transactions.forEach(transaction => {
            if (transaction.type === 'income') {
                totalIncome = parseFloat(transaction.getDataValue('total') || 0);
            } else if (transaction.type === 'expense') {
                totalExpense = parseFloat(transaction.getDataValue('total') || 0);
            }
        });

        return {
            totalIncome,
            totalExpense,
            balance: totalIncome - totalExpense
        };
    } catch (error) {
        throw new Error(error.message || 'Error getting summary statistics');
    }
};

// Lấy dữ liệu thu nhập và chi tiêu theo tháng cho biểu đồ cột/thanh
const getMonthlyStats = async (userId, year = new Date().getFullYear()) => {
    try {
        // Chuyển năm thành số nếu là chuỗi
        year = parseInt(year);
        
        // Tạo startDate và endDate cho năm được chọn
        const startDate = new Date(year, 0, 1); // 1/1/year
        const endDate = new Date(year, 11, 31, 23, 59, 59); // 31/12/year
        
        const transactions = await Transaction.findAll({
            where: {
                userId,
                date: {
                    [Sequelize.Op.between]: [startDate, endDate]
                }
            }
        });
        
        // Khởi tạo dữ liệu cho 12 tháng
        const monthlyData = Array(12).fill().map(() => ({ 
            income: 0, 
            expense: 0 
        }));
        
        // Tổng hợp dữ liệu theo tháng
        transactions.forEach(transaction => {
            const month = transaction.date.getMonth(); // 0-11
            if (transaction.type === 'income') {
                monthlyData[month].income += parseFloat(transaction.amount);
            } else {
                monthlyData[month].expense += parseFloat(transaction.amount);
            }
        });
        
        // Định dạng dữ liệu kết quả
        const result = monthlyData.map((data, index) => ({
            month: index + 1, // 1-12
            monthName: new Date(year, index).toLocaleString('vi-VN', { month: 'long' }),
            income: data.income,
            expense: data.expense,
            balance: data.income - data.expense
        }));
        
        return result;
    } catch (error) {
        throw new Error(error.message || 'Error getting monthly statistics');
    }
};

// Lấy tỷ lệ chi tiêu theo danh mục cho biểu đồ tròn
const getCategorySpendingStats = async (userId, startDate = null, endDate = null) => {
    try {
        let whereClause = { 
            userId,
            type: 'expense'
        };

        if (startDate && endDate) {
            const start = parseDate(startDate);
            const end = parseDate(endDate);
            whereClause.date = {
                [Sequelize.Op.between]: [start, end]
            };
        }

        const categorySpending = await Transaction.findAll({
            where: whereClause,
            include: [
                { model: Category, as: 'category', attributes: ['id', 'name'] }
            ],
            attributes: [
                'categoryId',
                [Sequelize.fn('SUM', Sequelize.col('amount')), 'total']
            ],
            group: ['categoryId', 'category.id', 'category.name']
        });

        // Tính tổng chi tiêu
        const totalSpending = categorySpending.reduce((sum, category) => {
            return sum + parseFloat(category.getDataValue('total') || 0);
        }, 0);

        // Định dạng kết quả với phần trăm
        const result = categorySpending.map(category => ({
            categoryId: category.categoryId,
            categoryName: category.category.name,
            amount: parseFloat(category.getDataValue('total') || 0),
            percentage: totalSpending ? (parseFloat(category.getDataValue('total') || 0) / totalSpending * 100).toFixed(2) : 0
        }));

        return {
            totalSpending,
            categories: result
        };
    } catch (error) {
        throw new Error(error.message || 'Error getting category spending statistics');
    }
};

// Lấy dữ liệu so sánh thu nhập và chi tiêu theo thời gian
const getIncomeExpenseComparisonStats = async (userId, period = 'month', count = 6) => {
    try {
        // Chuyển count thành số nguyên
        count = parseInt(count);
        if (isNaN(count) || count <= 0) count = 6;
        
        const endDate = new Date();
        let startDate;
        let groupFormat;
        
        // Xác định startDate và định dạng nhóm dựa trên period
        switch(period) {
            case 'day':
                startDate = new Date(endDate);
                startDate.setDate(endDate.getDate() - count);
                groupFormat = '%Y-%m-%d'; // YYYY-MM-DD
                break;
            case 'week':
                startDate = new Date(endDate);
                startDate.setDate(endDate.getDate() - (count * 7));
                groupFormat = '%Y-%u'; // Year-WeekNumber
                break;
            case 'year':
                startDate = new Date(endDate);
                startDate.setFullYear(endDate.getFullYear() - count);
                groupFormat = '%Y'; // Year
                break;
            case 'month':
            default:
                startDate = new Date(endDate);
                startDate.setMonth(endDate.getMonth() - count);
                groupFormat = '%Y-%m'; // YYYY-MM
        }
        
        const transactions = await Transaction.findAll({
            where: {
                userId,
                date: {
                    [Sequelize.Op.between]: [startDate, endDate]
                }
            },
            attributes: [
                [Sequelize.fn('date_format', Sequelize.col('date'), groupFormat), 'period'],
                'type',
                [Sequelize.fn('SUM', Sequelize.col('amount')), 'total']
            ],
            group: [Sequelize.fn('date_format', Sequelize.col('date'), groupFormat), 'type']
        });
        
        // Tạo map để tổ chức dữ liệu
        const periodMap = new Map();
        
        // Xử lý giao dịch
        transactions.forEach(transaction => {
            const periodValue = transaction.getDataValue('period');
            const type = transaction.type;
            const amount = parseFloat(transaction.getDataValue('total') || 0);
            
            if (!periodMap.has(periodValue)) {
                periodMap.set(periodValue, { period: periodValue, income: 0, expense: 0 });
            }
            
            const periodData = periodMap.get(periodValue);
            if (type === 'income') {
                periodData.income = amount;
            } else if (type === 'expense') {
                periodData.expense = amount;
            }
        });
        
        // Chuyển map thành mảng và sắp xếp theo thời gian
        const result = Array.from(periodMap.values()).sort((a, b) => {
            return a.period.localeCompare(b.period);
        });
        
        return result;
    } catch (error) {
        throw new Error(error.message || 'Error getting income-expense comparison');
    }
};

// Cập nhật giao dịch
const updateTransaction = async (transactionId, userId, updateData) => {
    try {
        const transaction = await Transaction.findOne({
            where: { id: transactionId, userId }
        });

        if (!transaction) {
            throw new Error('Transaction not found or you do not have permission to update');
        }

        // Lưu thông tin ban đầu trước khi cập nhật
        const originalType = transaction.type;
        const originalAmount = transaction.amount;
        const originalCategoryId = transaction.categoryId;
        const originalDate = transaction.date;
        const originalMonth = originalDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });

        // Chuẩn bị dữ liệu cập nhật
        const { categoryId, type, amount, date, note } = updateData;
        let updatedDate = originalDate;
        
        if (date) {
            updatedDate = parseDate(date);
        }
        
        const updatedMonth = updatedDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });
        const monthChanged = originalMonth !== updatedMonth;

        // Thực hiện cập nhật
        await transaction.update({
            categoryId: categoryId || transaction.categoryId,
            type: type || transaction.type,
            amount: amount !== undefined ? amount : transaction.amount,
            date: updatedDate,
            note: note !== undefined ? note : transaction.note
        });

        // Cập nhật budget và userCategory nếu cần
        // 1. Loại giao dịch không thay đổi và số tiền không thay đổi và tháng không thay đổi -> không cần cập nhật
        // 2. Loại giao dịch thay đổi -> hoàn lại budget cũ, tạo budget mới
        // 3. Số tiền thay đổi -> cập nhật hiệu số
        // 4. Tháng thay đổi -> hoàn lại budget cũ, tạo budget mới

        if (type !== originalType || amount !== originalAmount || categoryId !== originalCategoryId || monthChanged) {
            // Hoàn lại giá trị ban đầu
            if (originalType === 'expense') {
                // Nếu là chi tiêu, hoàn lại số tiền
                await UserCategory.update(
                    { budget_limit: Sequelize.literal(`budget_limit + ${originalAmount}`) },
                    { where: { userId, categoryId: originalCategoryId, month: originalMonth } }
                );
                
                await Budget.update(
                    { budget: Sequelize.literal(`budget + ${originalAmount}`) },
                    { where: { userId, month: originalMonth } }
                );
            } else {
                // Nếu là thu nhập, trừ đi số tiền
                await UserCategory.update(
                    { budget_limit: Sequelize.literal(`budget_limit - ${originalAmount}`) },
                    { where: { userId, categoryId: originalCategoryId, month: originalMonth } }
                );
                
                await Budget.update(
                    { budget: Sequelize.literal(`budget - ${originalAmount}`) },
                    { where: { userId, month: originalMonth } }
                );
            }

            // Thêm giá trị mới
            const newType = type || originalType;
            const newAmount = amount !== undefined ? amount : originalAmount;
            const newCategoryId = categoryId || originalCategoryId;
            
            // Kiểm tra xem đã có UserCategory và Budget cho tháng mới chưa
            if (monthChanged) {
                let userCategory = await UserCategory.findOne({ 
                    where: { userId, categoryId: newCategoryId, month: updatedMonth } 
                });
                
                if (!userCategory) {
                    userCategory = await UserCategory.create({
                        userId,
                        categoryId: newCategoryId,
                        budget_limit: 0,
                        month: updatedMonth
                    });
                }
                
                let budget = await Budget.findOne({ 
                    where: { userId, month: updatedMonth } 
                });
                
                if (!budget) {
                    budget = await Budget.create({
                        userId,
                        month: updatedMonth,
                        budget: 0
                    });
                }
            }

            // Áp dụng giá trị mới
            if (newType === 'expense') {
                await UserCategory.update(
                    { budget_limit: Sequelize.literal(`budget_limit - ${newAmount}`) },
                    { where: { userId, categoryId: newCategoryId, month: updatedMonth } }
                );
                
                await Budget.update(
                    { budget: Sequelize.literal(`budget - ${newAmount}`) },
                    { where: { userId, month: updatedMonth } }
                );
            } else {
                await UserCategory.update(
                    { budget_limit: Sequelize.literal(`budget_limit + ${newAmount}`) },
                    { where: { userId, categoryId: newCategoryId, month: updatedMonth } }
                );
                
                await Budget.update(
                    { budget: Sequelize.literal(`budget + ${newAmount}`) },
                    { where: { userId, month: updatedMonth } }
                );
            }
        }

        // Trả về giao dịch đã cập nhật
        return transaction;
    } catch (error) {
        throw new Error(error.message || 'Error updating transaction');
    }
};

// Tìm kiếm và lọc giao dịch
const searchTransactions = async (userId, options) => {
    try {
        const { 
            startDate, 
            endDate, 
            type, 
            categoryId,
            minAmount,
            maxAmount,
            keyword,
            sortBy = 'date', 
            sortOrder = 'DESC',
            page = 1,
            limit = 10
        } = options;

        // Xây dựng điều kiện tìm kiếm
        let whereClause = { userId };
        
        // Lọc theo ngày
        if (startDate && endDate) {
            const start = parseDate(startDate);
            const end = parseDate(endDate);
            whereClause.date = {
                [Sequelize.Op.between]: [start, end]
            };
        } else if (startDate) {
            whereClause.date = {
                [Sequelize.Op.gte]: parseDate(startDate)
            };
        } else if (endDate) {
            whereClause.date = {
                [Sequelize.Op.lte]: parseDate(endDate)
            };
        }
        
        // Lọc theo loại giao dịch
        if (type && ['income', 'expense'].includes(type)) {
            whereClause.type = type;
        }
        
        // Lọc theo danh mục
        if (categoryId) {
            whereClause.categoryId = categoryId;
        }
        
        // Lọc theo số tiền
        if (minAmount !== undefined && maxAmount !== undefined) {
            whereClause.amount = {
                [Sequelize.Op.between]: [parseFloat(minAmount), parseFloat(maxAmount)]
            };
        } else if (minAmount !== undefined) {
            whereClause.amount = {
                [Sequelize.Op.gte]: parseFloat(minAmount)
            };
        } else if (maxAmount !== undefined) {
            whereClause.amount = {
                [Sequelize.Op.lte]: parseFloat(maxAmount)
            };
        }
        
        // Tìm kiếm theo từ khóa trong ghi chú
        if (keyword) {
            whereClause.note = {
                [Sequelize.Op.like]: `%${keyword}%`
            };
        }
        
        // Xây dựng điều kiện sắp xếp
        let order = [[sortBy, sortOrder]];
        
        // Thực hiện phân trang
        const offset = (page - 1) * limit;
        
        // Thực hiện truy vấn
        const result = await Transaction.findAndCountAll({
            where: whereClause,
            include: [
                { model: Category, as: 'category', attributes: ['id', 'name'] }
            ],
            order,
            limit,
            offset
        });
        
        // Tính toán thông tin phân trang
        const totalItems = result.count;
        const totalPages = Math.ceil(totalItems / limit);
        
        return {
            data: result.rows,
            pagination: {
                totalItems,
                totalPages,
                currentPage: page,
                itemsPerPage: limit
            }
        };
    } catch (error) {
        throw new Error(error.message || 'Error searching transactions');
    }
};

module.exports = {
    create,
    getAll,
    getById,
    deleteTransaction,
    getAllUserTransactions,
    getSummaryStats,
    getMonthlyStats,
    getCategorySpendingStats,
    getIncomeExpenseComparisonStats,
    updateTransaction,
    searchTransactions
};