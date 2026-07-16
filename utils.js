(function (global) {
  'use strict';

  const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const Utils = {
    formatCurrency(amount, currency) {
      const value = Number(amount) || 0;
      const code = currency || (global.Storage ? global.Storage.getSettings().currency : 'USD') || 'USD';
      try {
        return new Intl.NumberFormat(undefined, {
          style: 'currency',
          currency: code,
          maximumFractionDigits: 2,
          minimumFractionDigits: 2
        }).format(value);
      } catch (e) {
        return '$' + value.toFixed(2);
      }
    },

    formatSignedCurrency(amount, type) {
      const sign = type === 'income' ? '+' : '-';
      return sign + this.formatCurrency(Math.abs(amount));
    },

    formatDate(isoDate, style) {
      const d = this.parseISO(isoDate);
      if (!d) return isoDate || '';
      if (style === 'short') {
        return MONTH_LABELS[d.getMonth()] + ' ' + d.getDate();
      }
      return MONTH_LABELS[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
    },

    formatRelativeDate(isoDate) {
      const d = this.parseISO(isoDate);
      if (!d) return '';
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const diffDays = Math.round((today - d) / 86400000);
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays > 1 && diffDays < 7) return diffDays + ' days ago';
      return this.formatDate(isoDate, 'short');
    },

    parseISO(isoDate) {
      if (!isoDate) return null;
      const parts = isoDate.split('-');
      if (parts.length !== 3) return null;
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return isNaN(d.getTime()) ? null : d;
    },

    toISO(date) {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return y + '-' + m + '-' + d;
    },

    daysAgoISO(n) {
      const d = new Date();
      d.setDate(d.getDate() - n);
      return this.toISO(d);
    },

    todayISO() {
      return this.toISO(new Date());
    },

    monthLabel(date) {
      return MONTH_LABELS[date.getMonth()] + ' ' + date.getFullYear();
    },


    generateId(prefix) {
      return (prefix || 'id') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    },

    debounce(fn, wait) {
      let t;
      return function (...args) {
        clearTimeout(t);
        t = setTimeout(() => fn.apply(this, args), wait || 200);
      };
    },

    clamp(num, min, max) {
      return Math.min(Math.max(num, min), max);
    },

    percentChange(current, previous) {
      if (!previous) return current > 0 ? 100 : 0;
      return ((current - previous) / Math.abs(previous)) * 100;
    },

    escapeHTML(str) {
      const div = document.createElement('div');
      div.textContent = str == null ? '' : String(str);
      return div.innerHTML;
    },

    sumByType(transactions, type, fromISO, toISO) {
      return transactions.reduce((sum, t) => {
        if (t.type !== type) return sum;
        if (fromISO && t.date < fromISO) return sum;
        if (toISO && t.date > toISO) return sum;
        return sum + Number(t.amount || 0);
      }, 0);
    },

    groupByMonth(transactions, monthsBack) {
      const buckets = [];
      const now = new Date();
      for (let i = monthsBack - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const start = this.toISO(new Date(d.getFullYear(), d.getMonth(), 1));
        const end = this.toISO(new Date(d.getFullYear(), d.getMonth() + 1, 0));
        buckets.push({ label: this.monthLabel(d), start, end, income: 0, expense: 0 });
      }
      transactions.forEach((t) => {
        const bucket = buckets.find((b) => t.date >= b.start && t.date <= b.end);
        if (!bucket) return;
        if (t.type === 'income') bucket.income += Number(t.amount || 0);
        else bucket.expense += Number(t.amount || 0);
      });
      return buckets;
    },

    groupByCategory(transactions, type, fromISO, toISO) {
      const totals = {};
      transactions.forEach((t) => {
        if (t.type !== type) return;
        if (fromISO && t.date < fromISO) return;
        if (toISO && t.date > toISO) return;
        totals[t.category] = (totals[t.category] || 0) + Number(t.amount || 0);
      });
      return Object.keys(totals)
        .map((category) => ({ category, total: totals[category] }))
        .sort((a, b) => b.total - a.total);
    },


    showToast(message, variant) {
      const container = document.getElementById('toast-container');
      if (!container) return;
      const toast = document.createElement('div');
      toast.className = 'toast' + (variant ? ' toast--' + variant : '');
      toast.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg><span></span>';
      toast.querySelector('span').textContent = message;
      container.appendChild(toast);
      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(8px)';
        setTimeout(() => toast.remove(), 220);
      }, 3200);
    },

    animateCount(el, endValue, formatFn, duration) {
      if (!el) return;
      const start = performance.now();
      const dur = duration || 900;
      const reduceMotion = global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduceMotion) {
        el.textContent = formatFn(endValue);
        return;
      }
      function tick(now) {
        const progress = Utils.clamp((now - start) / dur, 0, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = formatFn(endValue * eased);
        if (progress < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }
  };

  global.Utils = Utils;
})(window);
