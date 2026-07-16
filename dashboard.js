(function (global) {
  'use strict';

  function computeStats() {
    const all = Storage.getTransactions();
    const now = new Date();
    const monthStart = Utils.toISO(new Date(now.getFullYear(), now.getMonth(), 1));
    const monthEnd = Utils.toISO(new Date(now.getFullYear(), now.getMonth() + 1, 0));
    const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevStart = Utils.toISO(prevMonthDate);
    const prevEnd = Utils.toISO(new Date(prevMonthDate.getFullYear(), prevMonthDate.getMonth() + 1, 0));

    const totalIncome = Utils.sumByType(all, 'income');
    const totalExpense = Utils.sumByType(all, 'expense');
    const balance = totalIncome - totalExpense;

    const monthIncome = Utils.sumByType(all, 'income', monthStart, monthEnd);
    const monthExpense = Utils.sumByType(all, 'expense', monthStart, monthEnd);
    const prevIncome = Utils.sumByType(all, 'income', prevStart, prevEnd);
    const prevExpense = Utils.sumByType(all, 'expense', prevStart, prevEnd);

    const savingsRate = monthIncome > 0 ? ((monthIncome - monthExpense) / monthIncome) * 100 : 0;
    const prevSavingsRate = prevIncome > 0 ? ((prevIncome - prevExpense) / prevIncome) * 100 : 0;

    return {
      balance,
      monthIncome,
      monthExpense,
      savingsRate,
      incomeDelta: Utils.percentChange(monthIncome, prevIncome),
      expenseDelta: Utils.percentChange(monthExpense, prevExpense),
      savingsDelta: savingsRate - prevSavingsRate,
      monthStart,
      monthEnd
    };
  }

  function setDelta(id, value, label, invertColor, isPoints) {
    const el = document.getElementById(id);
    if (!el) return;
    const isUp = invertColor ? value < 0 : value >= 0;
    const arrow = isUp
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>';
    el.className = 'stat-card__delta ' + (isUp ? 'stat-card__delta--up' : 'stat-card__delta--down');
    const amount = isPoints ? Math.abs(value).toFixed(1) + ' pts' : Math.abs(value).toFixed(0) + '%';
    el.innerHTML = arrow + '<span>' + amount + '</span><span class="stat-card__delta-label">' + label + '</span>';
  }

  function renderStatCards(stats) {
    const balanceEl = document.getElementById('stat-balance');
    const incomeEl = document.getElementById('stat-income');
    const expenseEl = document.getElementById('stat-expense');
    const savingsEl = document.getElementById('stat-savings');

    if (balanceEl) Utils.animateCount(balanceEl, stats.balance, (v) => Utils.formatCurrency(v));
    if (incomeEl) Utils.animateCount(incomeEl, stats.monthIncome, (v) => Utils.formatCurrency(v));
    if (expenseEl) Utils.animateCount(expenseEl, stats.monthExpense, (v) => Utils.formatCurrency(v));
    if (savingsEl) Utils.animateCount(savingsEl, stats.savingsRate, (v) => v.toFixed(1) + '%');

    setDelta('delta-income', stats.incomeDelta, 'vs last month');
    setDelta('delta-expense', stats.expenseDelta, 'vs last month', true);
    setDelta('delta-savings', stats.savingsDelta, 'vs last month', false, true);
  }

  function renderCharts(stats) {
    const all = Storage.getTransactions();
    Charts.renderTrend('trend-chart', Utils.groupByMonth(all, 6));

    const categories = Utils.groupByCategory(all, 'expense', stats.monthStart, stats.monthEnd);
    const total = Charts.renderCategoryDonut('category-donut', categories);
    const centerValue = document.querySelector('#category-donut-wrap .donut-center__value');
    if (centerValue) centerValue.textContent = Utils.formatCurrency(total);

    const legend = document.getElementById('category-legend');
    if (legend) {
      const top = categories;
      legend.innerHTML = top.length
        ? top
            .map((c) => {
              const color = Storage.getCategoryColor(c.category);
              return (
                '<span class="chart-legend-item"><span class="chart-legend-item__dot" style="background:' +
                color +
                '"></span>' +
                Utils.escapeHTML(c.category) +
                '<strong>' + Utils.formatCurrency(c.total) + '</strong></span>'
              );
            })
            .join('')
        : '<p class="text-muted" style="font-size:12.5px;">No expenses recorded this month yet.</p>';
    }
  }

  function renderBudgets(stats) {
    const container = document.getElementById('budget-list');
    if (!container) return;
    const budgets = Storage.getBudgets();
    if (!budgets.length) {
      container.innerHTML = '<p class="text-muted" style="font-size:13px;">No budgets set. Add limits in Settings.</p>';
      return;
    }

    const spentByCategory = {};
    Utils.groupByCategory(Storage.getTransactions(), 'expense', stats.monthStart, stats.monthEnd).forEach((c) => {
      spentByCategory[c.category] = c.total;
    });

    container.innerHTML = budgets
      .map((b) => {
        const spent = spentByCategory[b.category] || 0;
        const pct = b.limit > 0 ? (spent / b.limit) * 100 : 0;
        const barClass = pct >= 100 ? 'progress__fill--danger' : pct >= 70 ? 'progress__fill--warning' : '';
        const color = Storage.getCategoryColor(b.category);
        return (
          '<div class="budget-row">' +
          '<div class="budget-row__top">' +
          '<span class="budget-row__name"><span class="budget-row__swatch" style="background:' + color + '"></span>' +
          Utils.escapeHTML(b.category) +
          '</span>' +
          '<span class="budget-row__figures"><strong>' + Utils.formatCurrency(spent) + '</strong> / ' + Utils.formatCurrency(b.limit) + '</span>' +
          '</div>' +
          '<div class="progress"><div class="progress__fill ' + barClass + '" style="width:' + Utils.clamp(pct, 0, 100) + '%"></div></div>' +
          '<div class="budget-row__pct">' + pct.toFixed(0) + '% used' + (pct >= 100 ? ' \u2014 over budget' : '') + '</div>' +
          '</div>'
        );
      })
      .join('');
  }

  function renderAll() {
    const stats = computeStats();
    renderStatCards(stats);
    renderCharts(stats);
    renderBudgets(stats);
    Transactions.renderRecent(document.getElementById('recent-transactions'), 6);
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (document.body.dataset.page !== 'dashboard') return;
    Transactions.initModal('transaction-modal', 'transaction-form');
    renderAll();
    document.addEventListener('transactions:changed', renderAll);
    global.addEventListener('themechange', () => renderCharts(computeStats()));
  });
})(window);
