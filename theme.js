(function (global) {
  'use strict';

  const ThemeManager = {
    get() {
      return Storage.getSettings().theme || 'light';
    },

    apply(theme) {
      document.documentElement.setAttribute('data-theme', theme);
    },

    set(theme) {
      Storage.updateSettings({ theme });
      this.apply(theme);
      global.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
    },

    toggle() {
      this.set(this.get() === 'dark' ? 'light' : 'dark');
    },

    init() {
      this.apply(this.get());
      document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('.theme-toggle').forEach((btn) => {
          btn.addEventListener('click', () => this.toggle());
        });
      });
    }
  };

  global.ThemeManager = ThemeManager;
  ThemeManager.init();
})(window);
