'use strict';

/**
 * TodoInput — Componente de input para novas tarefas
 *
 * Gerencia:
 * - Input de texto com placeholder
 * - Botão "+" para adicionar
 * - Enter key para adicionar
 * - Validação (não permite vazio)
 * - Escape para limpar e blur
 *
 * @example
 * const input = new TodoInput(store, '#todo-input', '#btn-add');
 * input.init();
 */

class TodoInput {
  /** @type {import('../core/state.js').TodoStore} */
  #store;
  /** @type {HTMLInputElement|null} */
  #inputEl;
  /** @type {HTMLButtonElement|null} */
  #addBtn;

  /**
   * @param {import('../core/state.js').TodoStore} store
   * @param {string} inputSelector - Seletor do input
   * @param {string} addBtnSelector - Seletor do botão adicionar
   */
  constructor(store, inputSelector, addBtnSelector) {
    this.#store = store;
    this.#inputEl = document.querySelector(inputSelector);
    this.#addBtn = document.querySelector(addBtnSelector);
  }

  /**
   * Inicializa o componente: bind de eventos
   */
  init() {
    if (!this.#inputEl || !this.#addBtn) {
      console.warn('[TodoInput] Required elements not found');
      return;
    }

    this.#inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.#add();
      }
      if (e.key === 'Escape') {
        this.#inputEl.value = '';
        this.#inputEl.blur();
      }
    });

    this.#addBtn.addEventListener('click', () => this.#add());
  }

  /**
   * Foca no input
   */
  focus() {
    this.#inputEl?.focus();
  }

  /**
   * Adiciona uma nova tarefa via store
   * Dispara evento customizado para que TodoList reaja com animação
   */
  #add() {
    const text = this.#inputEl.value;
    if (!text.trim()) return;

    const todo = this.#store.addTodo(text);
    if (todo) {
      document.dispatchEvent(new CustomEvent('todo:added', {
        detail: { todo },
      }));
      this.#inputEl.value = '';
      this.#inputEl.focus();
    }
  }
}

export { TodoInput };
