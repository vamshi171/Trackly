/**
 * Export expenses to CSV format
 * @param {Array} expenses - Array of expense objects
 * @param {string} filename - Name of the CSV file
 */
export const exportToCSV = (expenses, filename = "expenses.csv") => {
    if (!expenses || expenses.length === 0) {
        alert("No data to export");
        return;
    }

    // Define headers
    const headers = ["Title", "Amount", "Category", "Date", "Type", "Note"];
    
    // Map expenses to CSV rows
    const rows = expenses.map((exp) => [
        `"${exp.title || ''}"`,
        exp.amount || 0,
        `"${exp.categoryName || exp.category || ''}"`,
        exp.date || '',
        exp.type || 'EXPENSE',
        `"${exp.note || ''}"`,
    ]);

    // Combine headers and rows
    const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.join(",")),
    ].join("\n");

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

/**
 * Get monthly analytics from expenses
 * @param {Array} expenses - Array of expense objects
 * @returns {Object} Monthly analytics
 */
export const getMonthlyAnalytics = (expenses) => {
    const monthlyData = {};

    expenses.forEach((exp) => {
        if (!exp.date) return;
        const date = new Date(exp.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        
        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { month: monthKey, income: 0, expense: 0 };
        }

        const amount = parseFloat(exp.amount || 0);
        if (exp.type === "INCOME" || exp.type === "income") {
            monthlyData[monthKey].income += amount;
        } else {
            monthlyData[monthKey].expense += amount;
        }
    });

    return Object.values(monthlyData)
        .sort((a, b) => a.month.localeCompare(b.month))
        .slice(-12); // Last 12 months
};

/**
 * Get category breakdown
 * @param {Array} expenses - Array of expense objects
 * @returns {Array} Category breakdown data
 */
export const getCategoryBreakdown = (expenses) => {
    const categoryData = {};

    expenses.forEach((exp) => {
        if (exp.type === "INCOME" || exp.type === "income") return;
        
        const category = exp.categoryName || exp.category || "General";
        const amount = parseFloat(exp.amount || 0);
        
        if (!categoryData[category]) {
            categoryData[category] = { name: category, value: 0 };
        }
        categoryData[category].value += amount;
    });

    return Object.values(categoryData)
        .sort((a, b) => b.value - a.value)
        .slice(0, 10); // Top 10 categories
};

/**
 * Get income vs expense summary
 * @param {Array} expenses - Array of expense objects
 * @returns {Object} Income vs expense totals
 */
export const getIncomeExpenseSummary = (expenses) => {
    let totalIncome = 0;
    let totalExpense = 0;

    expenses.forEach((exp) => {
        const amount = parseFloat(exp.amount || 0);
        if (exp.type === "INCOME" || exp.type === "income") {
            totalIncome += amount;
        } else {
            totalExpense += amount;
        }
    });

    return { totalIncome, totalExpense, net: totalIncome - totalExpense };
};
