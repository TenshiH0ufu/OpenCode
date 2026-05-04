'use strict';

/**
 * TodoItem — Componente de item individual de tarefa
 *
 * Gerencia:
 * - Criação do elemento DOM <li>
 * - Toggle completed (checkbox)
 * - Animação de remoção
 * - Edição inline via double-click
 *
 * @example
 * const item = new TodoItem(todo, store);
 * listEl.appendChild(item.el);
 * item.onDelete = (id) => { ... };
 */

class TodoItem {
  /** @type {{id: number, text: string, completed: boolean}} */
  #todo;
  /** @type {import('../core/state.js').TodoStore} */
  #store;
  /** @type {HTMLLIElement} */
  #el;
  /** @type {boolean} */
  #editing = false;
  /** @type {Function|null} */
  #onDeleteCb = null;

  /**
   * @param {{id: number, text: string, completed: boolean}} todo
   * @param {import('../core/state.js').TodoStore} store
   */
  constructor(todo, store) {
    this.#todo = todo;
    this.#store = store;
    this.#el = this.#build();
  }

  /** @returns {HTMLLIElement} */
  get el() {
    return this.#el;
  }

  /** @returns {number} */
  get id() {
    return this.#todo.id;
  }

  /**
   * Callback disparado quando o item deve ser removido
   * @param {(id: number) => void} cb
   */
  set onDelete(cb) {
    this.#onDeleteCb = cb;
  }

  /**
   * Alterna o estado completed visualmente
   * @param {boolean} [force]
   */
  toggleCompleted(force) {
    const completed = force ?? !this.#todo.completed;
    this.#todo.completed = completed;
    this.#el.classList.toggle('todo-item--completed', completed);
    const cb = this.#el.querySelector('.todo-checkbox__input');
    if (cb) cb.checked = completed;
  }

  /**
   * Inicia animação de remoção e dispara callback ao final
   */
  removeWithAnimation() {
    this.#el.classList.add('todo-item--removing');

    const onEnd = () => {
      this.#el.removeEventListener('transitionend', onEnd);
      if (this.#onDeleteCb) {
        this.#onDeleteCb(this.#todo.id);
      }
      this.#el.remove();
    };

    this.#el.addEventListener('transitionend', onEnd);

    setTimeout(() => {
      this.#el.removeEventListener('transitionend', onEnd);
      if (this.#el.parentNode) {
        if (this.#onDeleteCb) this.#onDeleteCb(this.#todo.id);
        this.#el.remove();
      }
    }, 400);
  }

  /**
   * Constrói o DOM do item
   * @returns {HTMLLIElement}
   */
  #build() {
    const li = document.createElement('li');
    li.className = 'todo-item';
    li.dataset.id = this.#todo.id;
    if (this.#todo.completed) li.classList.add('todo-item--completed');

    li.innerHTML = `
      <label class="todo-checkbox">
        <input type="checkbox" class="todo-checkbox__input"
          ${this.#todo.completed ? 'checked' : ''}
          aria-label="Marcar '${this.#escapeHtml(this.#todo.text)}' como ${this.#todo.completed ? 'não concluída' : 'concluída'}">
        <span class="todo-checkbox__indicator">
          <svg class="todo-checkbox__icon" viewBox="0 0 24 24" aria-hidden="true">
            <polyline points="5 12 10 17 19 8" fill="none" stroke="white" stroke-width="3"
              stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>
      </label>
      <span class="todo-item__text">${this.#escapeHtml(this.#todo.text)}</span>
      <button class="todo-item__delete" aria-label="Remover tarefa '${this.#escapeHtml(this.#todo.text)}'">×</button>
    `;

    // Double-click para edição inline
    const textEl = li.querySelector('.todo-item__text');
    textEl.addEventListener('dblclick', () => this.#startEditing(textEl));

    return li;
  }

  /**
   * Inicia edição inline no texto da tarefa
   * @param {HTMLElement} textEl
   */
  #startEditing(textEl) {
    if (this.#editing) return;
    this.#editing = true;

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'todo-item__edit-input';
    input.value = this.#todo.text;
    input.setAttribute('aria-label', 'Editar tarefa');

    textEl.replaceWith(input);
    input.focus();
    input.select();

    const finish = (save) => {
      if (!this.#editing) return;
      this.#editing = false;

      const newText = save ? input.value.trim() : this.#todo.text;

      if (save && newText && newText !== this.#todo.text) {
        this.#store.updateTodoText(this.#todo.id, newText);
        this.#todo.text = newText;
      }

      const newSpan = document.createElement('span');
      newSpan.className = 'todo-item__text';
      newSpan.textContent = this.#todo.text;

      newSpan.addEventListener('dblclick', () => this.#startEditing(newSpan));
      input.replaceWith(newSpan);
    };

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        finish(true);
      }
      if (e.key === 'Escape') {
        finish(false);
      }
    });

    input.addEventListener('blur', () => finish(true));
  }

  /**
   * Escapa HTML para evitar XSS
   * @param {string} str
   * @returns {string}
   */
  #escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}

export { TodoItem };
