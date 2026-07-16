(function (global) {
  'use strict';

  const Transactions = {
    state: {
      search: '',
      category: 'all',
      type: 'all',
      sort: 'date-desc',
      visibleCount: 10,
      editingId: null
    },


    getFiltered() {
      let list = Storage.getTransactions();
      list = list.filter((t) => Search.match(t, this.state.search));
      list = Filters.byCategory(list, this.state.category);
      list = Filters.byType(list, this.state.type);
      list = Filters.sort(list, this.state.sort);
      return list;
    },


    _monogramHTML(tx) {
      const color = Storage.getCategoryColor(tx.category);
      const letter = (tx.category || '?').charAt(0).toUpperCase();
      return '<span class="ledger-row__icon" style="background:' + color + '22; color:' + color + '">' + letter + '</span>';
    },

    _emptyStateHTML(title, sub) {
      return (
        '<div class="empty-state">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="15" x2="12" y2="15"/></svg>' +
        '<p>' + title + '</p>' +
        '<p>' + sub + '</p>' +
        '</div>'
      );
    },

    renderRecent(containerEl, count) {
      if (!containerEl) return;
      const list = Filters.sort(Storage.getTransactions(), 'date-desc').slice(0, count || 6);
      if (!list.length) {
        containerEl.innerHTML = this._emptyStateHTML('No transactions yet', 'Add your first entry to see it here.');
        return;
      }
      containerEl.innerHTML = list.map((tx) => this._ledgerRowHTML(tx)).join('');
      this._bindRowActions(containerEl);
    },

    _ledgerRowHTML(tx) {
      const amountClass = tx.type === 'income' ? 'ledger-row__amount--income' : 'ledger-row__amount--expense';
      const sign = tx.type === 'income' ? '+' : '\u2212';
      return (
        '<div class="ledger-row" data-id="' + tx.id + '">' +
        this._monogramHTML(tx) +
        '<div class="ledger-row__body">' +
        '<div class="ledger-row__desc">' + Utils.escapeHTML(tx.description) + '</div>' +
        '<div class="ledger-row__meta">' + Utils.escapeHTML(tx.category) + ' \u00b7 ' + Utils.formatRelativeDate(tx.date) + '</div>' +
        '</div>' +
        '<div class="ledger-row__amount ' + amountClass + '">' + sign + Utils.formatCurrency(Math.abs(tx.amount)) + '</div>' +
        '<div class="row-actions">' +
        '<button type="button" class="icon-btn js-edit-tx" aria-label="Edit transaction"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button>' +
        '</div>' +
        '</div>'
      );
    },

    renderTable(tbodyEl, emptyEl, loadMoreWrapEl) {
      if (!tbodyEl) return;
      const filtered = this.getFiltered();
      const visible = filtered.slice(0, this.state.visibleCount);

      if (!filtered.length) {
        tbodyEl.innerHTML = '';
        if (emptyEl) emptyEl.hidden = false;
        if (loadMoreWrapEl) loadMoreWrapEl.hidden = true;
        return;
      }
      if (emptyEl) emptyEl.hidden = true;

      tbodyEl.innerHTML = visible.map((tx) => this._tableRowHTML(tx)).join('');
      this._bindRowActions(tbodyEl);

      if (loadMoreWrapEl) loadMoreWrapEl.hidden = visible.length >= filtered.length;
    },

    _tableRowHTML(tx) {
      const typeBadge =
        tx.type === 'income'
          ? '<span class="badge badge--success"><span class="badge__dot"></span>Income</span>'
          : '<span class="badge badge--danger"><span class="badge__dot"></span>Expense</span>';
      const sign = tx.type === 'income' ? '+' : '\u2212';
      const color = Storage.getCategoryColor(tx.category);
      return (
        '<tr data-id="' + tx.id + '">' +
        '<td class="cell-date">' + Utils.formatDate(tx.date, 'short') + '</td>' +
        '<td class="cell-desc">' + Utils.escapeHTML(tx.description) + '</td>' +
        '<td><span class="badge"><span class="cat-dot" style="background:' + color + '"></span>' + Utils.escapeHTML(tx.category) + '</span></td>' +
        '<td>' + typeBadge + '</td>' +
        '<td class="amount">' + sign + Utils.formatCurrency(Math.abs(tx.amount)) + '</td>' +
        '<td><div class="row-actions">' +
        '<button type="button" class="icon-btn js-edit-tx" aria-label="Edit transaction"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button>' +
        '<button type="button" class="icon-btn icon-btn--danger js-delete-tx" aria-label="Delete transaction"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></button>' +
        '</div></td>' +
        '</tr>'
      );
    },

    _bindRowActions(scopeEl) {
      scopeEl.querySelectorAll('.js-edit-tx').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.closest('[data-id]').dataset.id;
          const tx = Storage.getTransactions().find((t) => t.id === id);
          if (tx) this.openModal(tx);
        });
      });
      scopeEl.querySelectorAll('.js-delete-tx').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.closest('[data-id]').dataset.id;
          if (confirm('Delete this transaction? This cannot be undone.')) {
            Storage.deleteTransaction(id);
            Utils.showToast('Transaction deleted', 'danger');
            document.dispatchEvent(new CustomEvent('transactions:changed'));
          }
        });
      });
    },


    _modalEl: null,
    _formEl: null,

    initModal(modalId, formId) {
      this._modalEl = document.getElementById(modalId);
      this._formEl = document.getElementById(formId);
      if (!this._modalEl || !this._formEl) return;

      this._formEl.querySelectorAll('input[name="type"]').forEach((radio) => {
        radio.addEventListener('change', () => this._populateCategoryOptions(radio.value));
      });

      this._formEl.addEventListener('submit', (e) => this.handleSubmit(e));

      this._modalEl.querySelectorAll('[data-close-modal]').forEach((el) => {
        el.addEventListener('click', () => this.closeModal());
      });
      this._modalEl.addEventListener('click', (e) => {
        if (e.target === this._modalEl) this.closeModal();
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this._modalEl.classList.contains('is-open')) this.closeModal();
      });

      document.querySelectorAll('[data-open-add-modal]').forEach((btn) => {
        btn.addEventListener('click', () => this.openModal());
      });
    },

    _populateCategoryOptions(type) {
      const select = this._formEl.querySelector('select[name="category"]');
      if (!select) return;
      const cats = Storage.getCategoriesByType(type);
      const current = select.value;
      select.innerHTML = cats.map((c) => '<option value="' + Utils.escapeHTML(c.name) + '">' + Utils.escapeHTML(c.name) + '</option>').join('');
      if (cats.some((c) => c.name === current)) select.value = current;
    },

    openModal(tx) {
      if (!this._modalEl || !this._formEl) return;
      this.state.editingId = tx ? tx.id : null;

      const title = this._modalEl.querySelector('[data-modal-title]');
      if (title) title.textContent = tx ? 'Edit Transaction' : 'Add Transaction';
      const submitLabel = this._modalEl.querySelector('[data-submit-label]');
      if (submitLabel) submitLabel.textContent = tx ? 'Save Changes' : 'Save Transaction';

      const type = tx ? tx.type : 'expense';
      const typeInput = this._formEl.querySelector('input[name="type"][value="' + type + '"]');
      if (typeInput) typeInput.checked = true;
      this._populateCategoryOptions(type);

      this._formEl.querySelector('[name="description"]').value = tx ? tx.description : '';
      this._formEl.querySelector('[name="amount"]').value = tx ? tx.amount : '';
      this._formEl.querySelector('[name="date"]').value = tx ? tx.date : Utils.todayISO();
      if (tx) this._formEl.querySelector('select[name="category"]').value = tx.category;

      this._formEl.querySelectorAll('.field').forEach((f) => f.classList.remove('has-error'));

      this._modalEl.hidden = false;
      requestAnimationFrame(() => {
        this._modalEl.classList.add('is-open');
        const firstInput = this._formEl.querySelector('[name="description"]');
        if (firstInput) firstInput.focus();
      });
    },

    closeModal() {
      if (!this._modalEl) return;
      this._modalEl.classList.remove('is-open');
      setTimeout(() => {
        this._modalEl.hidden = true;
      }, 220);
    },

    handleSubmit(e) {
      e.preventDefault();
      const form = this._formEl;
      const description = form.querySelector('[name="description"]').value.trim();
      const amount = parseFloat(form.querySelector('[name="amount"]').value);
      const date = form.querySelector('[name="date"]').value;
      const category = form.querySelector('select[name="category"]').value;
      const type = form.querySelector('input[name="type"]:checked').value;

      const descField = form.querySelector('[name="description"]').closest('.field');
      const amountField = form.querySelector('[name="amount"]').closest('.field');
      descField.classList.toggle('has-error', !description);
      amountField.classList.toggle('has-error', !(amount > 0));
      if (!description || !(amount > 0)) return;

      const payload = { description, amount, date: date || Utils.todayISO(), category, type };

      if (this.state.editingId) {
        Storage.updateTransaction(this.state.editingId, payload);
        Utils.showToast('Transaction updated');
      } else {
        Storage.addTransaction(payload);
        Utils.showToast('Transaction added');
      }

      this.closeModal();
      document.dispatchEvent(new CustomEvent('transactions:changed'));
    },


    exportCSV() {
      const list = this.getFiltered();
      const header = ['Date', 'Description', 'Category', 'Type', 'Amount'];
      const rows = list.map((t) => [t.date, '"' + String(t.description).replace(/"/g, '""') + '"', t.category, t.type, t.amount]);
      const csv = [header].concat(rows).map((r) => r.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'transactions_' + Utils.todayISO() + '.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      Utils.showToast('CSV exported');
    },


    _reportsConfig: null,

    initReportsPage(config) {
      this._reportsConfig = config;

      if (config.categorySelect) {
        const cats = Storage.getCategories();
        config.categorySelect.innerHTML =
          '<option value="all">All Categories</option>' +
          cats.map((c) => '<option value="' + Utils.escapeHTML(c.name) + '">' + Utils.escapeHTML(c.name) + '</option>').join('');
      }

      Search.bind(config.searchInput, (term) => {
        this.state.search = term;
        this.state.visibleCount = 10;
        this._renderReports();
      });
      if (config.categorySelect) {
        config.categorySelect.addEventListener('change', () => {
          this.state.category = config.categorySelect.value;
          this.state.visibleCount = 10;
          this._renderReports();
        });
      }
      if (config.typeSelect) {
        config.typeSelect.addEventListener('change', () => {
          this.state.type = config.typeSelect.value;
          this.state.visibleCount = 10;
          this._renderReports();
        });
      }
      if (config.sortSelect) {
        config.sortSelect.addEventListener('change', () => {
          this.state.sort = config.sortSelect.value;
          this._renderReports();
        });
      }
      if (config.loadMoreBtn) {
        config.loadMoreBtn.addEventListener('click', () => {
          this.state.visibleCount += 10;
          this._renderReports();
        });
      }
      if (config.exportBtn) {
        config.exportBtn.addEventListener('click', () => this.exportCSV());
      }

      document.addEventListener('transactions:changed', () => this._renderReports());
      this._renderReports();
    },

    _renderReports() {
      if (!this._reportsConfig) return;
      this.renderTable(this._reportsConfig.tbody, this._reportsConfig.emptyEl, this._reportsConfig.loadMoreWrap);
    }
  };

  global.Transactions = Transactions;
})(window);
