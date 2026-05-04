'use strict';

/**
 * TodoStore — Gerenciamento de estado das tarefas
 *
 * Observer pattern: subscribe/notify
 * Persistência via Storage (localStorage wrapper)
 *
 * @example
 * const store = new TodoStore();
 * store.subscribe((todos) => console.log(todos));
 * store.addTodo('Minha tarefa');
 */

import { Storage } from './storage.js';

class TodoStore {
  /** @type {Array<{id: number, text: string, completed: boolean, createdAt: string}>} */
  #todos;
  /** @type {Set<Function>} */
  #listeners = new Set();
  /** @type {Storage} */
  #storage;

  constructor() {
    this.#storage = new Storage('todos-mvp');
    this.#todos = this.#storage.load();
  }

  /**
   * Retorna cópia do array de tarefas
   * @returns {Array}
   */
  get todos() {
    return [...this.#todos];
  }

  /**
   * Inscreve um listener para mudanças de estado
   * @param {Function} fn - Recebe o snapshot completo dos todos
   * @returns {Function} unsubscribe
   */
  subscribe(fn) {
    this.#listeners.add(fn);
    return () => this.#listeners.delete(fn);
  }

  /**
   * Adiciona uma nova tarefa
   * @param {string} text
   * @returns {{id: number, text: string, completed: boolean, createdAt: string}|null}
   */
  addTodo(text) {
    const trimmed = text.trim();
    if (!trimmed) return null;

    const todo = {
      id: Date.now(),
      text: trimmed,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    this.#todos.unshift(todo);
    this.#persist();
    return todo;
  }

  /**
   * Alterna o estado completed de uma tarefa
   * @param {number} id
   */
  toggleTodo(id) {
    const todo = this.#todos.find(t => t.id === id);
    if (!todo) return;

    todo.completed = !todo.completed;
    this.#persist();
  }

  /**
   * Remove uma tarefa pelo id
   * @param {number} id
   */
  deleteTodo(id) {
    this.#todos = this.#todos.filter(t => t.id !== id);
    this.#persist();
  }

  /**
   * Remove todas as tarefas completadas
   */
  clearCompleted() {
    this.#todos = this.#todos.filter(t => !t.completed);
    this.#persist();
  }

  /**
   * Atualiza o texto de uma tarefa (edição inline)
   * @param {number} id
   * @param {string} newText
   */
  updateTodoText(id, newText) {
    const todo = this.#todos.find(t => t.id === id);
    if (!todo) return;

    const trimmed = newText.trim();
    if (!trimmed) return;

    todo.text = trimmed;
    todo.updatedAt = new Date().toISOString();
    this.#persist();
  }

  /**
   * Substitui todas as tarefas (para import)
   * @param {Array} newTodos
   */
  replaceAll(newTodos) {
    if (!Array.isArray(newTodos)) return;
    this.#todos = newTodos.map(t => ({
      id: t.id || Date.now(),
      text: String(t.text || ''),
      completed: Boolean(t.completed),
      createdAt: t.createdAt || new Date().toISOString(),
    }));
    this.#persist();
  }

  /**
   * Retorna tarefas filtradas
   * @param {'all'|'active'|'completed'} filter
   * @returns {Array}
   */
  filterTodos(filter) {
    if (filter === 'all') return [...this.#todos];
    if (filter === 'active') return this.#todos.filter(t => !t.completed);
    if (filter === 'completed') return this.#todos.filter(t => t.completed);
    return [...this.#todos];
  }

  /**
   * Persiste + notifica
   */
  #persist() {
    this.#storage.save(this.#todos);
    this.#notify();
  }

  /**
   * Notifica todos os listeners
   */
  #notify() {
    const snapshot = [...this.#todos];
    for (const fn of this.#listeners) {
      try {
        fn(snapshot);
      } catch (err) {
        console.error('[TodoStore] Error in listener:', err);
      }
    }
  }
}

export { TodoStore };
