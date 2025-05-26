const { Transaction, UserCategory, Budget, User, Category } = require('../../models');
const { Sequelize } = require('sequelize');

const parseDate = (dateString) => {
    console.log('parseDate called with:', dateString);
    if (!dateString) {
        console.log('No date provided, returning current date');
        return new Date(); // Default to current date if not provided
    }
    
    const [day, month, year] = dateString.split('-').map(Number);
    console.log('Parsed date parts:', { day, month, year });
    
    if (!day || !month || !year || day > 31 || month > 12 || year < 1900 || year > 2100) {
        console.error('Invalid date format:', dateString);
        throw new Error('Invalid date format: Expected DD-MM-YYYY, year between 1900 and 2100');
    }
    
    const date = new Date(year, month - 1, day); // month is 0-based in JavaScript
    console.log('Created Date object:', date);
    
    if (isNaN(date.getTime())) {
        console.error('Invalid date, cannot parse:', dateString);
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
        console.log('Service getById called with ID:', transactionId);
        const transaction = await Transaction.findByPk(transactionId, {
            include: [
                { model: User, as: 'user', attributes: ['id', 'email'] },
                { model: Category, as: 'category', attributes: ['id', 'name'] },
            ],
        });
        console.log('Transaction found in database:', transaction ? 'Yes' : 'No');
        if (!transaction) {
            throw new Error('Transaction not found');
        }
        return transaction;
    } catch (error) {
        console.error('Error in getById service:', error);
        throw new Error(error.message || 'Error fetching transaction');
    }
};

const deleteTransaction = async (transactionId) => {
    try {

        console.log("transactionId: ", transactionId)
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

        await Transaction.destroy({ where: { transactionId: transactionId } });
        return { message: 'Transaction deleted successfully' };
    } catch (error) {
        throw new Error(error.message || 'Error deleting transaction');
    }
};

// Lấy thống kê tổng thu nhập, tổng chi tiêu và số dư
const getSummaryStats = async (userId, month = null, year = null) => {
    try {
        // Mặc định sử dụng tháng và năm hiện tại nếu không được cung cấp
        const currentDate = new Date();
        const targetMonth = month ? parseInt(month) - 1 : currentDate.getMonth(); // Chuyển từ 1-12 sang 0-11
        const targetYear = year ? parseInt(year) : currentDate.getFullYear();
        
        // Tạo ngày đầu tháng và cuối tháng
        const startDate = new Date(targetYear, targetMonth, 1); // Ngày đầu tháng
        const lastDayOfMonth = new Date(targetYear, targetMonth + 1, 0).getDate(); // Lấy ngày cuối cùng của tháng
        const endDate = new Date(targetYear, targetMonth, lastDayOfMonth, 23, 59, 59); // 23:59:59 ngày cuối tháng

        const whereClause = { 
            userId,
            date: {
                [Sequelize.Op.between]: [startDate, endDate]
            }
        };

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

        // Lấy thông tin tháng
        const monthName = new Date(targetYear, targetMonth).toLocaleString('vi-VN', { month: 'long' });

        return {
            month: targetMonth + 1,
            year: targetYear,
            monthName,
            totalIncome,
            totalExpense,
            balance: totalIncome - totalExpense
        };
    } catch (error) {
        throw new Error(error.message || 'Error getting summary statistics');
    }
};

// Lấy dữ liệu thu nhập và chi tiêu theo tháng cho biểu đồ cột/thanh
const getMonthlyStats = async (userId, month = null, year = null) => {
    try {
        // Mặc định sử dụng tháng và năm hiện tại nếu không được cung cấp
        const currentDate = new Date();
        const targetMonth = month ? parseInt(month) - 1 : currentDate.getMonth(); // Chuyển từ 1-12 sang 0-11
        const targetYear = year ? parseInt(year) : currentDate.getFullYear();
        
        // Tạo ngày đầu tháng và cuối tháng
        const startDate = new Date(targetYear, targetMonth, 1); // Ngày đầu tháng
        const lastDayOfMonth = new Date(targetYear, targetMonth + 1, 0).getDate(); // Lấy ngày cuối cùng của tháng
        const endDate = new Date(targetYear, targetMonth, lastDayOfMonth, 23, 59, 59); // 23:59:59 ngày cuối tháng
        
        // Lấy tất cả giao dịch trong tháng
        const transactions = await Transaction.findAll({
            where: {
                userId,
                date: {
                    [Sequelize.Op.between]: [startDate, endDate]
                }
            },
            include: [
                { model: Category, as: 'category', attributes: ['id', 'name'] }
            ]
        });
        
        // Tính toán tổng thu nhập và chi tiêu
        let totalIncome = 0;
        let totalExpense = 0;
        const categoryStats = new Map(); // Dùng để theo dõi chi tiêu theo danh mục
        
        transactions.forEach(transaction => {
            const amount = parseFloat(transaction.amount);
            if (transaction.type === 'income') {
                totalIncome += amount;
            } else if (transaction.type === 'expense') {
                totalExpense += amount;
                
                // Thêm vào thống kê theo danh mục
                const categoryId = transaction.categoryId;
                const categoryName = transaction.category ? transaction.category.name : 'Không xác định';
                
                if (!categoryStats.has(categoryId)) {
                    categoryStats.set(categoryId, {
                        categoryId,
                        categoryName,
                        amount: 0
                    });
                }
                
                const categoryStat = categoryStats.get(categoryId);
                categoryStat.amount += amount;
            }
        });
        
        // Định dạng thông tin thống kê
        const monthName = new Date(targetYear, targetMonth).toLocaleString('vi-VN', { month: 'long' });
        
        // Chuyển Map thành mảng và tính phần trăm từng danh mục
        const categoriesData = Array.from(categoryStats.values());
        categoriesData.forEach(category => {
            category.percentage = totalExpense ? ((category.amount / totalExpense) * 100).toFixed(2) : 0;
        });
        
        // Sắp xếp danh mục theo chi tiêu giảm dần
        categoriesData.sort((a, b) => b.amount - a.amount);
        
        return {
            month: targetMonth + 1, // Chuyển về định dạng 1-12
            year: targetYear,
            monthName,
            income: totalIncome,
            expense: totalExpense,
            balance: totalIncome - totalExpense,
            categories: categoriesData,
            daily: getDailyStats(transactions, targetYear, targetMonth)
        };
    } catch (error) {
        throw new Error(error.message || 'Error getting monthly statistics');
    }
};

// Hàm hỗ trợ để tính thống kê theo ngày trong tháng
const getDailyStats = (transactions, year, month) => {
    const lastDay = new Date(year, month + 1, 0).getDate();
    const dailyStats = Array(lastDay).fill().map((_, i) => ({
        day: i + 1,
        income: 0,
        expense: 0
    }));
    
    transactions.forEach(transaction => {
        const day = transaction.date.getDate() - 1; // Chuyển từ 1-31 sang 0-30
        const amount = parseFloat(transaction.amount);
        
        if (transaction.type === 'income') {
            dailyStats[day].income += amount;
        } else if (transaction.type === 'expense') {
            dailyStats[day].expense += amount;
        }
    });
    
    return dailyStats;
};

// Lấy tỷ lệ chi tiêu theo danh mục cho biểu đồ tròn
const getCategorySpendingStats = async (userId, month = null, year = null) => {
    try {
        // Mặc định sử dụng tháng và năm hiện tại nếu không được cung cấp
        const currentDate = new Date();
        const targetMonth = month ? parseInt(month) - 1 : currentDate.getMonth(); // Chuyển từ 1-12 sang 0-11
        const targetYear = year ? parseInt(year) : currentDate.getFullYear();
        
        // Tạo ngày đầu tháng và cuối tháng
        const startDate = new Date(targetYear, targetMonth, 1); // Ngày đầu tháng
        const lastDayOfMonth = new Date(targetYear, targetMonth + 1, 0).getDate(); // Lấy ngày cuối cùng của tháng
        const endDate = new Date(targetYear, targetMonth, lastDayOfMonth, 23, 59, 59); // 23:59:59 ngày cuối tháng
        
        // Tìm tất cả các giao dịch chi tiêu trong tháng được chọn
        const categorySpending = await Transaction.findAll({
            where: {
                userId,
                type: 'expense',
                date: {
                    [Sequelize.Op.between]: [startDate, endDate]
                }
            },
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
        const categories = categorySpending.map(category => ({
            categoryId: category.categoryId,
            categoryName: category.category.name,
            amount: parseFloat(category.getDataValue('total') || 0),
            percentage: totalSpending ? (parseFloat(category.getDataValue('total') || 0) / totalSpending * 100).toFixed(2) : 0
        }));

        // Sắp xếp danh mục theo mức chi tiêu giảm dần
        categories.sort((a, b) => b.amount - a.amount);
        
        // Lấy thông tin tháng
        const monthName = new Date(targetYear, targetMonth).toLocaleString('vi-VN', { month: 'long' });

        return {
            month: targetMonth + 1,
            year: targetYear,
            monthName,
            totalSpending,
            categories
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
        console.log('Service updateTransaction called with ID:', transactionId, 'userId:', userId);
        const transaction = await Transaction.findOne({
            where: { id: transactionId, userId }
        });

        console.log('Transaction found for update:', transaction ? 'Yes' : 'No');
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
            console.log('Parsing date for update:', date);
            updatedDate = parseDate(date);
            console.log('Parsed date:', updatedDate);
        }
        
        const updatedMonth = updatedDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });
        const monthChanged = originalMonth !== updatedMonth;

        console.log('Updating transaction with data:', {
            categoryId: categoryId || transaction.categoryId,
            type: type || transaction.type,
            amount: amount !== undefined ? amount : transaction.amount,
            date: updatedDate,
            note: note !== undefined ? note : transaction.note
        });

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
            console.log('Budget needs updating due to changes in transaction');
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
                console.log('Month changed, checking for UserCategory and Budget');
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

        console.log('Transaction updated successfully');
        // Trả về giao dịch đã cập nhật
        return transaction;
    } catch (error) {
        console.error('Error in updateTransaction service:', error);
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
        if (startDate || endDate) {
            whereClause.date = {};
            
            if (startDate) {
                try {
                    const start = parseDate(startDate);
                    whereClause.date[Sequelize.Op.gte] = start;
                } catch (error) {
                    console.error('Start date parsing error:', error.message);
                }
            }
            
            if (endDate) {
                try {
                    const end = parseDate(endDate);
                    end.setHours(23, 59, 59, 999); // Set to end of day
                    whereClause.date[Sequelize.Op.lte] = end;
                } catch (error) {
                    console.error('End date parsing error:', error.message);
                }
            }
        }
        
        // Lọc theo loại giao dịch
        if (type && ['income', 'expense'].includes(type)) {
            whereClause.type = type;
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

        // Chuẩn bị include cho Category
        const includes = [{
            model: Category,
            as: 'category',
            attributes: ['id', 'name']
        }];

        // Xử lý tìm kiếm theo tên danh mục
        if (categoryId) {
            // Nếu categoryId là ID số
            if (!isNaN(categoryId)) {
                whereClause.categoryId = parseInt(categoryId);
            } 
            // Nếu categoryId là tên danh mục
            else {
                includes[0].where = {
                    name: {
                        [Sequelize.Op.like]: `%${categoryId}%`
                    }
                };
            }
        }
        
        console.log("Final whereClause:", JSON.stringify(whereClause, null, 2));
        
        // Thực hiện truy vấn
        const result = await Transaction.findAndCountAll({
            where: whereClause,
            include: includes,
            order,
            limit: parseInt(limit),
            offset: parseInt(offset),
            distinct: true // Thêm distinct để đếm chính xác số lượng bản ghi
        });
        
        // Tính toán thông tin phân trang
        const totalItems = result.count;
        const totalPages = Math.ceil(totalItems / limit);
        
        return {
            data: result.rows,
            pagination: {
                totalItems,
                totalPages,
                currentPage: parseInt(page),
                itemsPerPage: parseInt(limit)
            }
        };
    } catch (error) {
        console.error('Search transaction error:', error);
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