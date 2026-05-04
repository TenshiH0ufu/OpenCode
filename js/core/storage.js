'use strict';

/**
 * Storage — Wrapper para localStorage com fallback seguro
 *
 * @example
 * const storage = new Storage('todos-key');
 * const data = storage.load();
 * storage.save([...]);
 */

class Storage {
  /** @type {string} */
  #key;

  /**
   * @param {string} key - Chave do localStorage
   */
  constructor(key) {
    if (!key) throw new Error('Storage requires a key');
    this.#key = key;
  }

  /**
   * Carrega dados do localStorage
   * @returns {Array}
   */
  load() {
    try {
      const stored = localStorage.getItem(this.#key);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * Salva dados no localStorage
   * @param {*} data
   */
  save(data) {
    try {
      localStorage.setItem(this.#key, JSON.stringify(data));
    } catch (err) {
      console.error('[Storage] Error saving:', err);
    }
  }

  /**
   * Remove a chave do localStorage
   */
  clear() {
    try {
      localStorage.removeItem(this.#key);
    } catch {
      // Silently fail
    }
  }
}

export { Storage };
