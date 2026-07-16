(function (global) {
  'use strict';

  const KEYS = {
    TRANSACTIONS: 'fd_transactions',
    BUDGETS: 'fd_budgets',
    CATEGORIES: 'fd_categories',
    SETTINGS: 'fd_settings',
    INIT_FLAG: 'fd_initialized'
  };

  const DEFAULT_SETTINGS = { name: 'Yash', currency: 'USD', theme: 'light' };

  const DEFAULT_CATEGORIES = [
    { name: 'Salary', type: 'income', color: '#1E6E52' },
    { name: 'Freelance', type: 'income', color: '#3B8C6E' },
    { name: 'Investments', type: 'income', color: '#5EA88C' },
    { name: 'Other Income', type: 'income', color: '#8FBFAA' },
    { name: 'Rent & Housing', type: 'expense', color: '#5B6B93' },
    { name: 'Groceries', type: 'expense', color: '#A83A2C' },
    { name: 'Dining Out', type: 'expense', color: '#C97A3D' },
    { name: 'Utilities', type: 'expense', color: '#3D8FA0' },
    { name: 'Transportation', type: 'expense', color: '#7A5CA8' },
    { name: 'Entertainment', type: 'expense', color: '#B8548A' },
    { name: 'Shopping', type: 'expense', color: '#B8862E' },
    { name: 'Healthcare', type: 'expense', color: '#C24B4B' },
    { name: 'Other', type: 'expense', color: '#8A968F' }
  ];

  const DEFAULT_BUDGETS = [
    { category: 'Rent & Housing', limit: 1500 },
    { category: 'Groceries', limit: 500 },
    { category: 'Dining Out', limit: 250 },
    { category: 'Utilities', limit: 200 },
    { category: 'Transportation', limit: 200 },
    { category: 'Entertainment', limit: 150 },
    { category: 'Shopping', limit: 300 },
    { category: 'Healthcare', limit: 150 },
    { category: 'Other', limit: 100 }
  ];

  const SEED_TEMPLATES = [
    // Income
    { daysAgo: 2, description: 'Monthly Salary', category: 'Salary', amount: 4350, type: 'income' },
    { daysAgo: 32, description: 'Monthly Salary', category: 'Salary', amount: 4350, type: 'income' },
    { daysAgo: 62, description: 'Monthly Salary', category: 'Salary', amount: 4300, type: 'income' },
    { daysAgo: 93, description: 'Monthly Salary', category: 'Salary', amount: 4300, type: 'income' },
    { daysAgo: 123, description: 'Monthly Salary', category: 'Salary', amount: 4250, type: 'income' },
    { daysAgo: 154, description: 'Monthly Salary', category: 'Salary', amount: 4250, type: 'income' },
    { daysAgo: 10, description: 'Freelance Web Project', category: 'Freelance', amount: 620, type: 'income' },
    { daysAgo: 75, description: 'Freelance Logo Design', category: 'Freelance', amount: 350, type: 'income' },
    { daysAgo: 140, description: 'Freelance Consulting', category: 'Freelance', amount: 480, type: 'income' },
    { daysAgo: 45, description: 'Dividend Payout', category: 'Investments', amount: 128, type: 'income' },
    { daysAgo: 110, description: 'Stock Dividend', category: 'Investments', amount: 96, type: 'income' },
    // Rent & Housing
    { daysAgo: 3, description: 'Monthly Rent', category: 'Rent & Housing', amount: 1450, type: 'expense' },
    { daysAgo: 33, description: 'Monthly Rent', category: 'Rent & Housing', amount: 1450, type: 'expense' },
    { daysAgo: 63, description: 'Monthly Rent', category: 'Rent & Housing', amount: 1450, type: 'expense' },
    { daysAgo: 94, description: 'Monthly Rent', category: 'Rent & Housing', amount: 1450, type: 'expense' },
    { daysAgo: 124, description: 'Monthly Rent', category: 'Rent & Housing', amount: 1400, type: 'expense' },
    { daysAgo: 155, description: 'Monthly Rent', category: 'Rent & Housing', amount: 1400, type: 'expense' },
    // Groceries
    { daysAgo: 1, description: 'Whole Foods Market', category: 'Groceries', amount: 86.42, type: 'expense' },
    { daysAgo: 8, description: "Trader Joe's", category: 'Groceries', amount: 54.18, type: 'expense' },
    { daysAgo: 15, description: 'Local Grocery Store', category: 'Groceries', amount: 72.90, type: 'expense' },
    { daysAgo: 22, description: 'Whole Foods Market', category: 'Groceries', amount: 91.35, type: 'expense' },
    { daysAgo: 38, description: 'Costco', category: 'Groceries', amount: 128.60, type: 'expense' },
    { daysAgo: 50, description: "Trader Joe's", category: 'Groceries', amount: 48.75, type: 'expense' },
    { daysAgo: 66, description: 'Whole Foods Market', category: 'Groceries', amount: 79.20, type: 'expense' },
    { daysAgo: 89, description: 'Local Grocery Store', category: 'Groceries', amount: 64.10, type: 'expense' },
    { daysAgo: 112, description: 'Costco', category: 'Groceries', amount: 135.44, type: 'expense' },
    // Dining Out
    { daysAgo: 2, description: 'Corner Bistro', category: 'Dining Out', amount: 42.50, type: 'expense' },
    { daysAgo: 6, description: 'Sushi Place', category: 'Dining Out', amount: 58.00, type: 'expense' },
    { daysAgo: 13, description: 'Coffee & Pastry', category: 'Dining Out', amount: 14.75, type: 'expense' },
    { daysAgo: 20, description: 'Pizza Night', category: 'Dining Out', amount: 33.20, type: 'expense' },
    { daysAgo: 29, description: 'Brunch Cafe', category: 'Dining Out', amount: 27.60, type: 'expense' },
    { daysAgo: 47, description: 'Thai Kitchen', category: 'Dining Out', amount: 39.90, type: 'expense' },
    { daysAgo: 70, description: 'Burger Joint', category: 'Dining Out', amount: 24.30, type: 'expense' },
    { daysAgo: 98, description: 'Sushi Place', category: 'Dining Out', amount: 63.80, type: 'expense' },
    // Utilities
    { daysAgo: 5, description: 'Electricity Bill', category: 'Utilities', amount: 112.40, type: 'expense' },
    { daysAgo: 5, description: 'Internet & Cable', category: 'Utilities', amount: 79.99, type: 'expense' },
    { daysAgo: 36, description: 'Electricity Bill', category: 'Utilities', amount: 128.75, type: 'expense' },
    { daysAgo: 67, description: 'Water Bill', category: 'Utilities', amount: 45.20, type: 'expense' },
    { daysAgo: 97, description: 'Electricity Bill', category: 'Utilities', amount: 121.10, type: 'expense' },
    { daysAgo: 128, description: 'Internet & Cable', category: 'Utilities', amount: 79.99, type: 'expense' },
    // Transportation
    { daysAgo: 4, description: 'Gas Station', category: 'Transportation', amount: 48.30, type: 'expense' },
    { daysAgo: 11, description: 'Rideshare', category: 'Transportation', amount: 22.15, type: 'expense' },
    { daysAgo: 25, description: 'Monthly Transit Pass', category: 'Transportation', amount: 85.00, type: 'expense' },
    { daysAgo: 40, description: 'Gas Station', category: 'Transportation', amount: 52.60, type: 'expense' },
    { daysAgo: 58, description: 'Car Maintenance', category: 'Transportation', amount: 145.00, type: 'expense' },
    { daysAgo: 80, description: 'Rideshare', category: 'Transportation', amount: 18.40, type: 'expense' },
    // Entertainment
    { daysAgo: 9, description: 'Movie Tickets', category: 'Entertainment', amount: 28.00, type: 'expense' },
    { daysAgo: 18, description: 'Streaming Subscription', category: 'Entertainment', amount: 15.99, type: 'expense' },
    { daysAgo: 34, description: 'Concert Tickets', category: 'Entertainment', amount: 95.00, type: 'expense' },
    { daysAgo: 55, description: 'Streaming Subscription', category: 'Entertainment', amount: 15.99, type: 'expense' },
    { daysAgo: 87, description: 'Bowling Night', category: 'Entertainment', amount: 32.50, type: 'expense' },
    // Shopping
    { daysAgo: 7, description: 'Clothing Store', category: 'Shopping', amount: 89.90, type: 'expense' },
    { daysAgo: 24, description: 'Electronics Store', category: 'Shopping', amount: 199.99, type: 'expense' },
    { daysAgo: 44, description: 'Home Goods', category: 'Shopping', amount: 64.30, type: 'expense' },
    { daysAgo: 72, description: 'Online Marketplace', category: 'Shopping', amount: 46.75, type: 'expense' },
    { daysAgo: 105, description: 'Clothing Store', category: 'Shopping', amount: 112.40, type: 'expense' },
    // Healthcare
    { daysAgo: 16, description: 'Pharmacy', category: 'Healthcare', amount: 32.50, type: 'expense' },
    { daysAgo: 60, description: 'Dental Checkup', category: 'Healthcare', amount: 140.00, type: 'expense' }
  ];

  function safeParse(json, fallback) {
    if (!json) return fallback;
    try {
      const parsed = JSON.parse(json);
      return parsed == null ? fallback : parsed;
    } catch (e) {
      return fallback;
    }
  }

  function generateSeedTransactions() {
    return SEED_TEMPLATES.map((tpl) => ({
      id: Utils.generateId('txn'),
      date: Utils.daysAgoISO(tpl.daysAgo),
      description: tpl.description,
      category: tpl.category,
      amount: tpl.amount,
      type: tpl.type
    }));
  }

  const Storage = {
    KEYS,
    DEFAULT_SETTINGS,

    init() {
      if (!localStorage.getItem(KEYS.INIT_FLAG)) {
        this.saveCategories(DEFAULT_CATEGORIES.map((c) => ({ ...c })));
        this.saveBudgets(DEFAULT_BUDGETS.map((b) => ({ ...b })));
        this.saveTransactions(generateSeedTransactions());
        this.saveSettings({ ...DEFAULT_SETTINGS });
        localStorage.setItem(KEYS.INIT_FLAG, 'true');
      }
    },

    getTransactions() {
      return safeParse(localStorage.getItem(KEYS.TRANSACTIONS), []);
    },
    saveTransactions(list) {
      localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(list));
    },
    addTransaction(tx) {
      const list = this.getTransactions();
      const record = { ...tx, id: Utils.generateId('txn') };
      list.unshift(record);
      this.saveTransactions(list);
      return record;
    },
    updateTransaction(id, updates) {
      const list = this.getTransactions();
      const idx = list.findIndex((t) => t.id === id);
      if (idx > -1) {
        list[idx] = { ...list[idx], ...updates };
        this.saveTransactions(list);
        return list[idx];
      }
      return null;
    },
    deleteTransaction(id) {
      this.saveTransactions(this.getTransactions().filter((t) => t.id !== id));
    },
    clearTransactions() {
      this.saveTransactions([]);
    },

    getBudgets() {
      return safeParse(localStorage.getItem(KEYS.BUDGETS), []);
    },
    saveBudgets(list) {
      localStorage.setItem(KEYS.BUDGETS, JSON.stringify(list));
    },
    setBudgetLimit(category, limit) {
      const list = this.getBudgets();
      const idx = list.findIndex((b) => b.category === category);
      if (idx > -1) list[idx].limit = limit;
      else list.push({ category, limit });
      this.saveBudgets(list);
    },
    getBudgetLimit(category) {
      const b = this.getBudgets().find((b) => b.category === category);
      return b ? b.limit : 0;
    },

    getCategories() {
      return safeParse(localStorage.getItem(KEYS.CATEGORIES), []);
    },
    saveCategories(list) {
      localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(list));
    },
    getCategoriesByType(type) {
      return this.getCategories().filter((c) => c.type === type);
    },
    addCategory(cat) {
      const list = this.getCategories();
      list.push(cat);
      this.saveCategories(list);
    },
    deleteCategory(name) {
      this.saveCategories(this.getCategories().filter((c) => c.name !== name));
      this.saveBudgets(this.getBudgets().filter((b) => b.category !== name));
    },
    getCategoryColor(name) {
      const c = this.getCategories().find((c) => c.name === name);
      return c ? c.color : '#8A968F';
    },

    getSettings() {
      return safeParse(localStorage.getItem(KEYS.SETTINGS), DEFAULT_SETTINGS);
    },
    saveSettings(settings) {
      localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
    },
    updateSettings(updates) {
      const merged = { ...this.getSettings(), ...updates };
      this.saveSettings(merged);
      return merged;
    },

    exportData() {
      return JSON.stringify(
        {
          transactions: this.getTransactions(),
          budgets: this.getBudgets(),
          categories: this.getCategories(),
          settings: this.getSettings(),
          exportedAt: new Date().toISOString()
        },
        null,
        2
      );
    },
    importData(json) {
      const data = JSON.parse(json);
      if (Array.isArray(data.transactions)) this.saveTransactions(data.transactions);
      if (Array.isArray(data.budgets)) this.saveBudgets(data.budgets);
      if (Array.isArray(data.categories)) this.saveCategories(data.categories);
      if (data.settings && typeof data.settings === 'object') this.saveSettings(data.settings);
    }
  };

  global.Storage = Storage;

  Storage.init();
})(window);
