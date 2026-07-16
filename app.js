(function (global) {
  'use strict';


  function initShell() {
    const sidebar = document.getElementById('sidebar');
    const menuBtn = document.querySelector('.topbar__menu-btn');
    const backdrop = document.getElementById('sidebar-backdrop');

    function openSidebar() {
      if (sidebar) sidebar.classList.add('is-open');
      if (backdrop) backdrop.classList.add('is-visible');
    }
    function closeSidebar() {
      if (sidebar) sidebar.classList.remove('is-open');
      if (backdrop) backdrop.classList.remove('is-visible');
    }
    if (menuBtn) menuBtn.addEventListener('click', openSidebar);
    if (backdrop) backdrop.addEventListener('click', closeSidebar);
    document.querySelectorAll('.nav-link').forEach((link) => link.addEventListener('click', closeSidebar));

    const current = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-link').forEach((link) => {
      const isActive = link.getAttribute('href') === current;
      link.classList.toggle('is-active', isActive);
      if (isActive) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  }


  function initSettingsPage() {
    if (document.body.dataset.page !== 'settings') return;
    renderProfileForm();
    renderThemeControls();
    renderBudgetsSettings();
    renderCategoriesSettings();
    wireDataManagement();
  }

  function renderProfileForm() {
    const form = document.getElementById('profile-form');
    if (!form) return;
    const settings = Storage.getSettings();
    form.querySelector('[name="name"]').value = settings.name || '';
    form.querySelector('[name="currency"]').value = settings.currency || 'USD';

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = form.querySelector('[name="name"]').value.trim();
      const currency = form.querySelector('[name="currency"]').value;
      Storage.updateSettings({ name, currency });
      Utils.showToast('Profile saved');
    });
  }

  function renderThemeControls() {
    const radios = document.querySelectorAll('input[name="theme-choice"]');
    if (!radios.length) return;
    const sync = (theme) => radios.forEach((r) => { r.checked = r.value === theme; });
    sync(ThemeManager.get());
    radios.forEach((r) => {
      r.addEventListener('change', () => {
        if (r.checked) ThemeManager.set(r.value);
      });
    });
    global.addEventListener('themechange', (e) => sync(e.detail.theme));
  }

  function renderBudgetsSettings() {
    const container = document.getElementById('budgets-settings-list');
    if (!container) return;
    const budgets = Storage.getBudgets();

    if (!budgets.length) {
      container.innerHTML = '<p class="text-muted" style="font-size:13px;">No expense categories yet. Add one below.</p>';
      return;
    }

    const now = new Date();
    const monthStart = Utils.toISO(new Date(now.getFullYear(), now.getMonth(), 1));
    const monthEnd = Utils.toISO(new Date(now.getFullYear(), now.getMonth() + 1, 0));
    const spentByCategory = {};
    Utils.groupByCategory(Storage.getTransactions(), 'expense', monthStart, monthEnd).forEach((c) => {
      spentByCategory[c.category] = c.total;
    });

    container.innerHTML = budgets
      .map((b) => {
        const color = Storage.getCategoryColor(b.category);
        return (
          '<div class="settings-row" data-category="' + Utils.escapeHTML(b.category) + '">' +
          '<span class="settings-row__label"><span class="cat-dot" style="background:' + color + '"></span>' + Utils.escapeHTML(b.category) + '</span>' +
          '<span class="settings-row__control">' +
          '<span class="text-muted" style="font-size:12px;">' + Utils.formatCurrency(spentByCategory[b.category] || 0) + ' spent this month</span>' +
          '<input type="number" min="0" step="1" class="input js-budget-input" value="' + b.limit + '" aria-label="Monthly limit for ' + Utils.escapeHTML(b.category) + '">' +
          '</span>' +
          '</div>'
        );
      })
      .join('');

    container.querySelectorAll('.js-budget-input').forEach((input) => {
      input.addEventListener('change', () => {
        const category = input.closest('[data-category]').dataset.category;
        Storage.setBudgetLimit(category, parseFloat(input.value) || 0);
        Utils.showToast('Budget updated for ' + category);
      });
    });
  }

  function renderCategoriesSettings() {
    const container = document.getElementById('categories-chip-list');
    const form = document.getElementById('add-category-form');
    if (!container) return;

    function render() {
      const cats = Storage.getCategories();
      container.innerHTML = cats
        .map(
          (c) =>
            '<span class="category-chip"><span class="cat-dot" style="background:' + c.color + '"></span>' +
            Utils.escapeHTML(c.name) +
            '<button type="button" class="js-delete-cat" data-name="' + Utils.escapeHTML(c.name) + '" aria-label="Delete ' + Utils.escapeHTML(c.name) + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></span>'
        )
        .join('');

      container.querySelectorAll('.js-delete-cat').forEach((btn) => {
        btn.addEventListener('click', () => {
          const name = btn.dataset.name;
          if (confirm('Delete "' + name + '"? Existing transactions keep this label, but it won\u2019t appear in menus anymore.')) {
            Storage.deleteCategory(name);
            Utils.showToast('Category deleted', 'danger');
            render();
            renderBudgetsSettings();
          }
        });
      });
    }
    render();

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = form.querySelector('[name="cat-name"]').value.trim();
        const type = form.querySelector('[name="cat-type"]').value;
        if (!name) return;
        const existing = Storage.getCategories();
        if (existing.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
          Utils.showToast('That category already exists', 'warning');
          return;
        }
        const palette = ['#1E6E52', '#A83A2C', '#B8862E', '#3D8FA0', '#7A5CA8', '#B8548A', '#5B6B93', '#C97A3D'];
        const color = palette[existing.length % palette.length];
        Storage.addCategory({ name, type, color });
        if (type === 'expense') Storage.setBudgetLimit(name, 0);
        form.reset();
        render();
        renderBudgetsSettings();
        Utils.showToast('Category added');
      });
    }
  }

  function wireDataManagement() {
    const exportBtn = document.getElementById('export-data-btn');
    const importInput = document.getElementById('import-data-input');
    const clearBtn = document.getElementById('clear-transactions-btn');

    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        const blob = new Blob([Storage.exportData()], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'finance-dashboard-backup_' + Utils.todayISO() + '.json';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        Utils.showToast('Data exported');
      });
    }

    if (importInput) {
      importInput.addEventListener('change', () => {
        const file = importInput.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          try {
            Storage.importData(reader.result);
            Utils.showToast('Data imported \u2014 reloading\u2026');
            setTimeout(() => location.reload(), 700);
          } catch (err) {
            Utils.showToast('Could not read that file', 'danger');
          }
        };
        reader.readAsText(file);
        importInput.value = '';
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (confirm('Delete all transactions? Categories, budgets, and settings are kept. This cannot be undone.')) {
          Storage.clearTransactions();
          Utils.showToast('All transactions deleted', 'danger');
          renderBudgetsSettings();
          document.dispatchEvent(new CustomEvent('transactions:changed'));
        }
      });
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    initShell();
    initSettingsPage();
  });
})(window);
