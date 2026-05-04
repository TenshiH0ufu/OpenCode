'use strict';

/**
 * app.js — Inicialização e coordenação do Todo App
 *
 * Cria o store, instancia componentes, conecta callbacks,
 * gerencia dark mode, export/import JSON.
 */

import { TodoStore } from './core/state.js';
import { TodoInput } from './components/TodoInput.js';
import { TodoList } from './components/TodoList.js';
import { TodoFilters } from './components/TodoFilters.js';

document.addEventListener('DOMContentLoaded', () => {
  const store = new TodoStore();

  // ============================================================
  // 1. CRIA COMPONENTES
  // ============================================================

  const todoInput = new TodoInput(store, '#todo-input', '#btn-add');
  const todoList = new TodoList(store, '#todo-list', '#empty-state');
  const todoFilters = new TodoFilters(
    store,
    '.filter-bar',
    '#task-count',
    '#btn-clear',
    '.progress-ring__fill',
    '.progress-ring__text',
  );

  todoFilters.onFilterChange = (filter) => todoList.setFilter(filter);
  todoFilters.onClearCompleted = () => todoList.removeCompletedItems();

  todoInput.init();
  todoList.init();
  todoFilters.init();

  // ============================================================
  // 2. DATA ATUAL
  // ============================================================

  const dateEl = document.getElementById('current-date');
  if (dateEl) {
    const now = new Date();
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    dateEl.textContent = now.toLocaleDateString('pt-BR', options);
  }

  // ============================================================
  // 3. DARK MODE
  // ============================================================

  const themeToggle = document.getElementById('theme-toggle');
  const html = document.documentElement;

  function applyTheme(theme) {
    html.setAttribute('data-theme', theme);
    themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
    themeToggle.setAttribute('aria-label', theme === 'dark' ? 'Modo claro' : 'Modo escuro');
    localStorage.setItem('todos-theme', theme);
  }

  // Detecta preferência inicial
  const savedTheme = localStorage.getItem('todos-theme');
  if (savedTheme) {
    applyTheme(savedTheme);
  } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    applyTheme('dark');
  } else {
    applyTheme('light');
  }

  themeToggle.addEventListener('click', () => {
    const current = html.getAttribute('data-theme');
    applyTheme(current === 'dark' ? 'light' : 'dark');
  });

  // Escuta mudanças no sistema
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('todos-theme')) {
      applyTheme(e.matches ? 'dark' : 'light');
    }
  });

  // ============================================================
  // 4. EXPORT JSON
  // ============================================================

  document.getElementById('btn-export')?.addEventListener('click', () => {
    const data = store.todos;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tarefas-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // ============================================================
  // 5. IMPORT JSON
  // ============================================================

  const fileInput = document.getElementById('file-import');
  const btnImport = document.getElementById('btn-import');

  btnImport?.addEventListener('click', () => {
    fileInput?.click();
  });

  fileInput?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!Array.isArray(data)) throw new Error('Formato inválido');
        store.replaceAll(data);
        todoList.setFilter(todoFilters.currentFilter);
      } catch (err) {
        alert('Erro ao importar: formato de arquivo inválido.');
        console.error('[Import]', err);
      }
    };
    reader.readAsText(file);
    fileInput.value = '';
  });

  // ============================================================
  // 6. FOCO INICIAL
  // ============================================================

  todoInput.focus();
});
