(function (global) {
  'use strict';

  const Filters = {
    byCategory(list, category) {
      if (!category || category === 'all') return list;
      return list.filter((t) => t.category === category);
    },

    byType(list, type) {
      if (!type || type === 'all') return list;
      return list.filter((t) => t.type === type);
    },

    sort(list, sortKey) {
      const sorted = list.slice();
      switch (sortKey) {
        case 'date-asc':
          sorted.sort((a, b) => a.date.localeCompare(b.date));
          break;
        case 'amount-desc':
          sorted.sort((a, b) => Number(b.amount) - Number(a.amount));
          break;
        case 'amount-asc':
          sorted.sort((a, b) => Number(a.amount) - Number(b.amount));
          break;
        case 'date-desc':
        default:
          sorted.sort((a, b) => b.date.localeCompare(a.date));
          break;
      }
      return sorted;
    },

    monthsAgoISO(n) {
      const d = new Date();
      d.setMonth(d.getMonth() - n);
      return Utils.toISO(d);
    },

    byDateFrom(list, fromISO) {
      if (!fromISO) return list;
      return list.filter((t) => t.date >= fromISO);
    }
  };

  global.Filters = Filters;
})(window);
