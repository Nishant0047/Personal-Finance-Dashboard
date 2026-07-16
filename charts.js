(function (global) {
  'use strict';

  const Charts = {
    _instances: {},

    available() {
      return typeof global.Chart !== 'undefined';
    },

    palette() {
      const css = getComputedStyle(document.documentElement);
      const v = (name) => css.getPropertyValue(name).trim();
      return {
        text: v('--color-text'),
        muted: v('--color-text-secondary'),
        grid: v('--color-border'),
        success: v('--color-success'),
        danger: v('--color-danger'),
        warning: v('--color-warning')
      };
    },

    _destroy(canvasId) {
      if (this._instances[canvasId]) {
        this._instances[canvasId].destroy();
        delete this._instances[canvasId];
      }
    },

    renderTrend(canvasId, monthBuckets) {
      const canvas = document.getElementById(canvasId);
      if (!canvas || !this.available()) return;
      this._destroy(canvasId);
      const c = this.palette();

      this._instances[canvasId] = new Chart(canvas, {
        type: 'bar',
        data: {
          labels: monthBuckets.map((m) => m.label),
          datasets: [
            {
              label: 'Income',
              data: monthBuckets.map((m) => m.income),
              backgroundColor: c.success,
              borderRadius: 5,
              maxBarThickness: 22
            },
            {
              label: 'Expenses',
              data: monthBuckets.map((m) => m.expense),
              backgroundColor: c.danger,
              borderRadius: 5,
              maxBarThickness: 22
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: {
              position: 'bottom',
              labels: { color: c.text, usePointStyle: true, boxWidth: 8, boxHeight: 8, font: { family: "'Plus Jakarta Sans', sans-serif", size: 12 }, padding: 16 }
            },
            tooltip: {
              callbacks: {
                label: (ctx) => ctx.dataset.label + ': ' + Utils.formatCurrency(ctx.parsed.y)
              }
            }
          },
          scales: {
            x: { grid: { display: false }, ticks: { color: c.muted, font: { family: "'IBM Plex Mono', monospace", size: 11 } } },
            y: {
              grid: { color: c.grid },
              border: { display: false },
              ticks: {
                color: c.muted,
                font: { family: "'IBM Plex Mono', monospace", size: 11 },
                callback: (v) => Utils.formatCurrency(v)
              }
            }
          }
        }
      });
    },

    renderCategoryDonut(canvasId, categoryTotals) {
      const canvas = document.getElementById(canvasId);
      if (!canvas || !this.available()) return 0;
      this._destroy(canvasId);
      const c = this.palette();
      const total = categoryTotals.reduce((s, x) => s + x.total, 0);

      this._instances[canvasId] = new Chart(canvas, {
        type: 'doughnut',
        data: {
          labels: categoryTotals.map((x) => x.category),
          datasets: [
            {
              data: categoryTotals.map((x) => x.total),
              backgroundColor: categoryTotals.map((x) => Storage.getCategoryColor(x.category)),
              borderColor: c.text === '' ? '#fff' : getComputedStyle(document.documentElement).getPropertyValue('--color-surface').trim(),
              borderWidth: 2,
              hoverOffset: 6
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '70%',
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => {
                  const pct = total ? ((ctx.parsed / total) * 100).toFixed(1) : '0';
                  return ' ' + ctx.label + ': ' + Utils.formatCurrency(ctx.parsed) + ' (' + pct + '%)';
                }
              }
            }
          }
        }
      });
      return total;
    },

    renderHorizontalBar(canvasId, items) {
      const canvas = document.getElementById(canvasId);
      if (!canvas || !this.available()) return;
      this._destroy(canvasId);
      const c = this.palette();

      this._instances[canvasId] = new Chart(canvas, {
        type: 'bar',
        data: {
          labels: items.map((x) => x.category),
          datasets: [
            {
              data: items.map((x) => x.total),
              backgroundColor: items.map((x) => Storage.getCategoryColor(x.category)),
              borderRadius: 5,
              maxBarThickness: 18
            }
          ]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: (ctx) => Utils.formatCurrency(ctx.parsed.x) } }
          },
          scales: {
            x: { grid: { color: c.grid }, ticks: { color: c.muted, callback: (v) => Utils.formatCurrency(v), font: { family: "'IBM Plex Mono', monospace", size: 10 } } },
            y: { grid: { display: false }, ticks: { color: c.text, font: { size: 12 } } }
          }
        }
      });
    },

    refreshAll(renderFn) {
      if (typeof renderFn === 'function') renderFn();
    }
  };

  global.Charts = Charts;
})(window);
