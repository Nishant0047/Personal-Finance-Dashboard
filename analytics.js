(function (global) {
  'use strict';

  let currentRangeMonths = 3;

  function computeRangeStats(months) {
    const all = Storage.getTransactions();
    const now = new Date();
    let startISO = null;
    let prevStats = null;

    if (months !== 'all') {
      const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
      startISO = Utils.toISO(start);

      const prevStart = new Date(now.getFullYear(), now.getMonth() - (months - 1) - months, 1);
      const prevEnd = new Date(start.getFullYear(), start.getMonth(), 0);
      const prev = all.filter((t) => t.date >= Utils.toISO(prevStart) && t.date <= Utils.toISO(prevEnd));
      prevStats = {
        income: Utils.sumByType(prev, 'income'),
        expense: Utils.sumByType(prev, 'expense')
      };
    }

    const current = startISO ? all.filter((t) => t.date >= startISO) : all.slice();
    const income = Utils.sumByType(current, 'income');
    const expense = Utils.sumByType(current, 'expense');
    const net = income - expense;
    const savingsRate = income > 0 ? (net / income) * 100 : 0;

    return { current, income, expense, net, savingsRate, prevStats, startISO };
  }

  function setVal(id, value) {
    const el = document.getElementById(id);
    if (el) Utils.animateCount(el, value, (v) => Utils.formatCurrency(v));
  }

  function setDelta(id, value, invert) {
    const el = document.getElementById(id);
    if (!el) return;
    el.hidden = false;
    const isUp = invert ? value < 0 : value >= 0;
    const arrow = isUp
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>';
    el.className = 'stat-card__delta ' + (isUp ? 'stat-card__delta--up' : 'stat-card__delta--down');
    el.innerHTML = arrow + '<span>' + Math.abs(value).toFixed(0) + '%</span><span class="stat-card__delta-label">vs prior period</span>';
  }

  function hideDelta(id) {
    const el = document.getElementById(id);
    if (el) el.hidden = true;
  }

  function renderStatCards(stats) {
    setVal('an-income', stats.income);
    setVal('an-expense', stats.expense);
    setVal('an-net', stats.net);
    const savingsEl = document.getElementById('an-savings');
    if (savingsEl) Utils.animateCount(savingsEl, stats.savingsRate, (v) => v.toFixed(1) + '%');

    if (stats.prevStats) {
      setDelta('an-delta-income', Utils.percentChange(stats.income, stats.prevStats.income));
      setDelta('an-delta-expense', Utils.percentChange(stats.expense, stats.prevStats.expense), true);
    } else {
      hideDelta('an-delta-income');
      hideDelta('an-delta-expense');
    }
  }

  function renderTrendChart(months) {
    const monthCount = months === 'all' ? 12 : Math.max(months, 1);
    Charts.renderTrend('analytics-trend-chart', Utils.groupByMonth(Storage.getTransactions(), monthCount));
  }

  function renderRankList(containerId, list, total) {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (!list.length) {
      container.innerHTML = '<p class="text-muted" style="font-size:13px;">Nothing recorded for this period yet.</p>';
      return;
    }
    container.innerHTML = list
      .slice(0, 6)
      .map((c) => {
        const pct = total > 0 ? (c.total / total) * 100 : 0;
        const color = Storage.getCategoryColor(c.category);
        return (
          '<div class="rank-row">' +
          '<div class="rank-row__top">' +
          '<span class="rank-row__name"><span class="cat-dot" style="background:' + color + '"></span>' + Utils.escapeHTML(c.category) + '</span>' +
          '<span class="rank-row__value"><strong>' + Utils.formatCurrency(c.total) + '</strong> \u00b7 ' + pct.toFixed(0) + '%</span>' +
          '</div>' +
          '<div class="progress"><div class="progress__fill" style="width:' + pct.toFixed(1) + '%; background:' + color + '"></div></div>' +
          '</div>'
        );
      })
      .join('');
  }

  function renderCategoryBreakdown(stats) {
    const list = Utils.groupByCategory(stats.current, 'expense');
    const total = Charts.renderCategoryDonut('analytics-donut', list);
    const centerValue = document.querySelector('#analytics-donut-wrap .donut-center__value');
    if (centerValue) centerValue.textContent = Utils.formatCurrency(total);
    renderRankList('top-expense-categories', list, stats.expense);
  }

  function renderIncomeBreakdown(stats) {
    const list = Utils.groupByCategory(stats.current, 'income');
    renderRankList('top-income-sources', list, stats.income);
  }

  function renderAll() {
    const stats = computeRangeStats(currentRangeMonths);
    renderStatCards(stats);
    renderTrendChart(currentRangeMonths);
    renderCategoryBreakdown(stats);
    renderIncomeBreakdown(stats);
  }

  function initRangeSelector() {
    const buttons = document.querySelectorAll('.range-group button');
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        buttons.forEach((b) => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        const range = btn.dataset.range;
        currentRangeMonths = range === 'all' ? 'all' : parseInt(range, 10);
        renderAll();
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (document.body.dataset.page !== 'analytics') return;
    initRangeSelector();
    renderAll();
    global.addEventListener('themechange', renderAll);
    document.addEventListener('transactions:changed', renderAll);
  });
})(window);
