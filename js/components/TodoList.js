'use strict';

/**
 * TodoList — Componente de renderização da lista de tarefas
 *
 * Gerencia:
 * - Renderização a partir do store
 * - Toggle via evento delegado
 * - Delete com animação (delega para TodoItem)
 * - Animação slide-in ao adicionar
 * - Limpeza em lote de completadas
 *
 * @example
 * const list = new TodoList(store, '#todo-list', '#empty-state');
 * list.init();
 * list.setFilter('active');
 */

import { TodoItem } from './TodoItem.js';

class TodoList {
  /** @type {import('../core/state.js').TodoStore} */
  #store;
  /** @type {HTMLUListElement|null} */
  #listEl;
  /** @type {Element|null} */
  #emptyEl;
  /** @type {HTMLInputElement|null} */
  #inputEl;
  /** @type {'all'|'active'|'completed'} */
  #filter = 'all';
  /** @type {Map<number, TodoItem>} */
  #items = new Map();

  constructor(store, listSelector, emptySelector) {
    this.#store = store;
    this.#listEl = document.querySelector(listSelector);
    this.#emptyEl = document.querySelector(emptySelector);
    this.#inputEl = document.querySelector('#todo-input');
  }

  init() {
    if (!this.#listEl) {
      console.warn('[TodoList] Required list element not found');
      return;
    }

    this.#render();

    document.addEventListener('todo:added', (e) => {
      this.#prependItem(e.detail.todo);
    });

    this.#listEl.addEventListener('change', (e) => {
      const cb = e.target.closest('.todo-checkbox__input');
      if (!cb) return;
      const li = cb.closest('.todo-item');
      if (!li) return;

      const id = Number(li.dataset.id);
      this.#store.toggleTodo(id);

      // Usa o estado real do checkbox (já alterado pelo clique do usuário)
      li.classList.toggle('todo-item--completed', cb.checked);

      // Se filtro ativo, esconde item que não corresponde mais
      if (this.#filter !== 'all') {
        const todo = this.#store.todos.find(t => t.id === id);
        if (todo) {
          const shouldShow = (this.#filter === 'active' && !todo.completed)
                          || (this.#filter === 'completed' && todo.completed);
          if (!shouldShow) {
            li.classList.add('todo-item--removing');
            this.#items.delete(id);
            const onEnd = () => {
              li.removeEventListener('transitionend', onEnd);
              li.remove();
              this.#updateEmptyState();
            };
            li.addEventListener('transitionend', onEnd);
            setTimeout(() => {
              if (li.parentNode) { li.remove(); this.#updateEmptyState(); }
            }, 400);
          }
        }
      }
    });

    this.#listEl.addEventListener('click', (e) => {
      const del = e.target.closest('.todo-item__delete');
      if (!del) return;
      const li = del.closest('.todo-item');
      if (!li) return;

      const id = Number(li.dataset.id);
      const item = this.#items.get(id);
      if (item) {
        item.removeWithAnimation();
      }
    });
  }

  setFilter(filter) {
    this.#filter = filter;
    this.#render();
  }

  removeCompletedItems() {
    const ids = [...this.#items.entries()]
      .filter(([, item]) => item.el.classList.contains('todo-item--completed'))
      .map(([id]) => id);

    if (ids.length === 0) return false;

    let removed = 0;

    ids.forEach((id) => {
      const item = this.#items.get(id);
      if (!item) return;

      item.el.classList.add('todo-item--removing');

      const onEnd = () => {
        item.el.removeEventListener('transitionend', onEnd);
        item.el.remove();
        this.#items.delete(id);
        removed++;

        if (removed === ids.length) {
          this.#store.clearCompleted();
          this.#updateEmptyState();
          this.#inputEl?.focus();
        }
      };

      item.el.addEventListener('transitionend', onEnd);
    });

    setTimeout(() => {
      const remaining = this.#listEl?.querySelectorAll('.todo-item--removing') || [];
      if (remaining.length > 0) {
        remaining.forEach((li) => li.remove());
        this.#items.clear();
        this.#store.clearCompleted();
        this.#updateEmptyState();
      }
    }, 400);

    return true;
  }

  #render() {
    const todos = this.#store.filterTodos(this.#filter);
    this.#listEl.innerHTML = '';
    this.#items.clear();

    todos.forEach((todo) => {
      const item = new TodoItem(todo, this.#store);
      item.onDelete = (id) => {
        this.#items.delete(id);
        this.#store.deleteTodo(id);
        this.#updateEmptyState();
        this.#focusAfterDelete();
      };
      this.#items.set(todo.id, item);
      this.#listEl.appendChild(item.el);
    });

    this.#updateEmptyState();
  }

  #prependItem(todo) {
    const shouldShow =
      this.#filter === 'all' ||
      (this.#filter === 'active' && !todo.completed) ||
      (this.#filter === 'completed' && todo.completed);

    if (!shouldShow) return;

    const item = new TodoItem(todo, this.#store);
    item.onDelete = (id) => {
      this.#items.delete(id);
      this.#store.deleteTodo(id);
      this.#updateEmptyState();
      this.#focusAfterDelete();
    };

    this.#items.set(todo.id, item);

    const li = item.el;
    li.classList.add('todo-item--animating-in');
    this.#listEl.prepend(li);
    li.offsetHeight;
    li.classList.add('todo-item--visible');

    li.addEventListener('transitionend', () => {
      li.classList.remove('todo-item--animating-in');
    }, { once: true });

    this.#updateEmptyState();
  }

  #focusAfterDelete() {
    const remaining = this.#listEl.querySelector('.todo-item');
    if (remaining) {
      const cb = remaining.querySelector('.todo-checkbox__input');
      cb?.focus();
    } else {
      this.#inputEl?.focus();
    }
  }

  #updateEmptyState() {
    if (!this.#emptyEl) return;
    const hasItems = this.#listEl.children.length > 0;
    this.#emptyEl.classList.toggle('empty-state--visible', !hasItems);
    this.#listEl.style.display = hasItems ? '' : 'none';
  }
}

export { TodoList };
