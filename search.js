(function (global) {
  'use strict';

  const Search = {
    match(transaction, term) {
      if (!term) return true;
      const needle = term.trim().toLowerCase();
      if (!needle) return true;
      return (
        transaction.description.toLowerCase().includes(needle) ||
        transaction.category.toLowerCase().includes(needle)
      );
    },

    bind(inputEl, onChange, delay) {
      if (!inputEl) return;
      const handler = Utils.debounce(() => onChange(inputEl.value.trim()), delay || 220);
      inputEl.addEventListener('input', handler);
    }
  };

  global.Search = Search;
})(window);
