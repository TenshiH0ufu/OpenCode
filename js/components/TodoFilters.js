'use strict';

/**
 * TodoFilters — Componente de filtros e UI do Todo App
 *
 * Gerencia:
 * - Botões de filtro (Todas / Ativas / Completas)
 * - Contador de tarefas restantes
 * - Botão "Limpar completadas"
 * - Progress ring (percentual de conclusão)
 * - Subscribe ao store para manter UI sincronizada
 *
 * @example
 * const filters = new TodoFilters(store, '.filter-bar', ...);
 * filters.onFilterChange = (f) => list.setFilter(f);
 * filters.init();
 */

class TodoFilters {
  /** @type {import('../core/state.js').TodoStore} */
  #store;
  /** @type {Element|null} */
  #filterBar;
  /** @type {Element|null} */
  #counterEl;
  /** @type {HTMLButtonElement|null} */
  #clearBtn;
  /** @type {Element|null} */
  #progressFill;
  /** @type {Element|null} */
  #progressText;
  /** @type {Element|null} */
  #progressRing;
  /** @type {Function|null} */
  #onFilterChangeCb = null;
  /** @type {Function|null} */
  #onClearCompletedCb = null;
  /** @type {Function|null} */
  #unsubscribe = null;
  /** @type {'all'|'active'|'completed'} */
  #currentFilter = 'all';
  /** @type {number} */
  #circumference = 125.6;

  constructor(store, filterBarSelector, counterSelector, clearBtnSelector, progressFillSelector, progressTextSelector) {
    this.#store = store;
    this.#filterBar = document.querySelector(filterBarSelector);
    this.#counterEl = document.querySelector(counterSelector);
    this.#clearBtn = document.querySelector(clearBtnSelector);
    this.#progressFill = document.querySelector(progressFillSelector);
    this.#progressText = document.querySelector(progressTextSelector);
    this.#progressRing = this.#progressFill?.closest('[role="progressbar"]');
  }

  set onFilterChange(cb) {
    this.#onFilterChangeCb = cb;
  }

  set onClearCompleted(cb) {
    this.#onClearCompletedCb = cb;
  }

  get currentFilter() {
    return this.#currentFilter;
  }

  init() {
    this.#unsubscribe = this.#store.subscribe(() => this.#updateUI());
    this.#updateUI();

    this.#filterBar?.addEventListener('click', (e) => {
      const btn = e.target.closest('.todo-filter');
      if (!btn) return;
      const filter = btn.dataset.filter;
      if (!filter || filter === this.#currentFilter) return;
      this.#setActiveFilter(filter);
    });

    this.#clearBtn?.addEventListener('click', () => {
      if (this.#onClearCompletedCb) {
        this.#onClearCompletedCb();
      } else {
        this.#store.clearCompleted();
      }
    });
  }

  #setActiveFilter(filter) {
    this.#currentFilter = filter;
    const buttons = this.#filterBar?.querySelectorAll('.todo-filter');
    if (buttons) {
      buttons.forEach((btn) => {
        const isActive = btn.dataset.filter === filter;
        btn.classList.toggle('todo-filter--active', isActive);
        btn.setAttribute('aria-selected', String(isActive));
      });
    }
    if (this.#onFilterChangeCb) this.#onFilterChangeCb(filter);
    this.#updateUI();
  }

  #updateUI() {
    const todos = this.#store.todos;
    const total = todos.length;
    const completed = todos.filter(t => t.completed).length;
    const active = total - completed;

    if (this.#counterEl) {
      const label = active === 1 ? 'tarefa restante' : 'tarefas restantes';
      this.#counterEl.textContent = `${active} ${label}`;
    }

    const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
    const offset = this.#circumference - (pct / 100) * this.#circumference;

    if (this.#progressFill) this.#progressFill.style.strokeDashoffset = offset;
    if (this.#progressText) this.#progressText.textContent = `${pct}%`;
    if (this.#progressRing) this.#progressRing.setAttribute('aria-valuenow', String(pct));

    if (this.#clearBtn) this.#clearBtn.style.display = completed > 0 ? '' : 'none';
  }
}

export { TodoFilters };
