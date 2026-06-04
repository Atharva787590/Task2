const STORAGE_KEY = "task2-neobrutal-todos";

const state = {
  todos: [],
  filter: "all",
  search: "",
  editingId: null,
};

const todoForm = document.getElementById("todo-form");
const todoInput = document.getElementById("todo-input");
const prioritySelect = document.getElementById("priority-select");
const todoList = document.getElementById("todo-list");
const emptyState = document.getElementById("empty-state");
const formMessage = document.getElementById("form-message");

const totalCount = document.getElementById("total-count");
const activeCount = document.getElementById("active-count");
const completedCount = document.getElementById("completed-count");

const progressFill = document.getElementById("progress-fill");
const progressText = document.getElementById("progress-text");

const filterGroup = document.getElementById("filter-group");
const bulkActions = document.getElementById("bulk-actions");
const searchInput = document.getElementById("search-input");

function createId() {
  return Date.now().toString() + Math.random().toString(16).slice(2);
}

function saveTodos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.todos));
}

function loadTodos() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) return;

  try {
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed)) {
      state.todos = parsed;
    }
  } catch (error) {
    console.error("Error loading todos:", error);
    state.todos = [];
  }
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function escapeAttribute(text) {
  return text.replace(/"/g, "&quot;");
}

function getFilteredTodos() {
  let filtered = [...state.todos];

  if (state.filter === "active") {
    filtered = filtered.filter((todo) => !todo.completed);
  } else if (state.filter === "completed") {
    filtered = filtered.filter((todo) => todo.completed);
  }

  if (state.search.trim()) {
    const query = state.search.trim().toLowerCase();
    filtered = filtered.filter((todo) => todo.text.toLowerCase().includes(query));
  }

  return filtered;
}

function updateStats() {
  const total = state.todos.length;
  const active = state.todos.filter((todo) => !todo.completed).length;
  const completed = state.todos.filter((todo) => todo.completed).length;
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

  totalCount.textContent = total;
  activeCount.textContent = active;
  completedCount.textContent = completed;
  progressFill.style.width = `${percentage}%`;
  progressText.textContent = `${percentage}% COMPLETED`;
}

function setActiveFilter() {
  const buttons = filterGroup.querySelectorAll(".filter-btn");

  buttons.forEach((button) => {
    button.classList.toggle("active", button.dataset.filter === state.filter);
  });
}

function createPriorityBadge(priority) {
  const label = priority.toUpperCase();
  return `<span class="todo-badge badge-${priority}">${label}</span>`;
}

function createTodoItem(todo) {
  const li = document.createElement("li");
  li.className = `todo-item ${todo.completed ? "completed" : ""}`;
  li.dataset.id = todo.id;

  if (state.editingId === todo.id) {
    li.innerHTML = `
      <div class="todo-main">
        <div class="todo-content">
          <input class="edit-input" type="text" value="${escapeAttribute(todo.text)}" maxlength="120" />
          <select class="edit-priority">
            <option value="low" ${todo.priority === "low" ? "selected" : ""}>LOW</option>
            <option value="medium" ${todo.priority === "medium" ? "selected" : ""}>MEDIUM</option>
            <option value="high" ${todo.priority === "high" ? "selected" : ""}>HIGH</option>
          </select>
        </div>
      </div>

      <div class="todo-actions">
        <button class="action-btn save-btn" data-action="save" type="button">SAVE</button>
        <button class="action-btn cancel-btn" data-action="cancel" type="button">CANCEL</button>
      </div>
    `;
  } else {
    li.innerHTML = `
      <div class="todo-main">
        <input
          class="todo-checkbox"
          type="checkbox"
          ${todo.completed ? "checked" : ""}
          aria-label="Toggle completed task"
        />

        <div class="todo-content">
          <p class="todo-text">${escapeHtml(todo.text)}</p>

          <div class="todo-meta">
            ${createPriorityBadge(todo.priority)}
            <span class="todo-badge">${todo.completed ? "COMPLETED" : "ACTIVE"}</span>
          </div>
        </div>
      </div>

      <div class="todo-actions">
        <button class="action-btn edit-btn" data-action="edit" type="button">EDIT</button>
        <button class="action-btn delete-btn" data-action="delete" type="button">DELETE</button>
      </div>
    `;
  }

  return li;
}

function renderTodos() {
  const filteredTodos = getFilteredTodos();

  todoList.innerHTML = "";

  filteredTodos.forEach((todo) => {
    todoList.appendChild(createTodoItem(todo));
  });

  emptyState.style.display = filteredTodos.length === 0 ? "block" : "none";

  updateStats();
  setActiveFilter();
}

function addTodo(text, priority) {
  const trimmed = text.trim();

  if (!trimmed) {
    formMessage.textContent = "PLEASE ENTER A TASK.";
    return;
  }

  const newTodo = {
    id: createId(),
    text: trimmed,
    priority,
    completed: false,
    createdAt: new Date().toISOString(),
  };

  state.todos.unshift(newTodo);
  saveTodos();
  renderTodos();

  todoInput.value = "";
  prioritySelect.value = "medium";
  formMessage.textContent = "";
}

function toggleTodo(id) {
  state.todos = state.todos.map((todo) =>
    todo.id === id ? { ...todo, completed: !todo.completed } : todo
  );

  saveTodos();
  renderTodos();
}

function deleteTodo(id) {
  state.todos = state.todos.filter((todo) => todo.id !== id);
  saveTodos();
  renderTodos();
}

function startEdit(id) {
  state.editingId = id;
  renderTodos();

  const currentItem = todoList.querySelector(`[data-id="${id}"]`);
  const input = currentItem?.querySelector(".edit-input");
  if (input) {
    input.focus();
    input.select();
  }
}

function saveEdit(id, newText, newPriority) {
  const trimmed = newText.trim();

  if (!trimmed) {
    alert("TASK CANNOT BE EMPTY.");
    return;
  }

  state.todos = state.todos.map((todo) =>
    todo.id === id
      ? { ...todo, text: trimmed, priority: newPriority }
      : todo
  );

  state.editingId = null;
  saveTodos();
  renderTodos();
}

function cancelEdit() {
  state.editingId = null;
  renderTodos();
}

function clearCompleted() {
  state.todos = state.todos.filter((todo) => !todo.completed);
  saveTodos();
  renderTodos();
}

function markAllDone() {
  state.todos = state.todos.map((todo) => ({ ...todo, completed: true }));
  saveTodos();
  renderTodos();
}

todoForm.addEventListener("submit", (event) => {
  event.preventDefault();
  addTodo(todoInput.value, prioritySelect.value);
});

searchInput.addEventListener("input", (event) => {
  state.search = event.target.value;
  renderTodos();
});

/* Delegated filter handling */
filterGroup.addEventListener("click", (event) => {
  const button = event.target.closest(".filter-btn");
  if (!button) return;

  state.filter = button.dataset.filter;
  renderTodos();
});

/* Delegated bulk actions */
bulkActions.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;

  const action = button.dataset.action;

  if (action === "mark-all") {
    markAllDone();
  }

  if (action === "clear-completed") {
    clearCompleted();
  }
});

/* Delegated task actions */
todoList.addEventListener("click", (event) => {
  const item = event.target.closest(".todo-item");
  if (!item) return;

  const id = item.dataset.id;
  const actionBtn = event.target.closest("[data-action]");

  if (!actionBtn) return;

  const action = actionBtn.dataset.action;

  if (action === "edit") {
    startEdit(id);
  }

  if (action === "delete") {
    deleteTodo(id);
  }

  if (action === "cancel") {
    cancelEdit();
  }

  if (action === "save") {
    const input = item.querySelector(".edit-input");
    const priority = item.querySelector(".edit-priority");

    if (input && priority) {
      saveEdit(id, input.value, priority.value);
    }
  }
});

/* Delegated checkbox handling */
todoList.addEventListener("change", (event) => {
  const item = event.target.closest(".todo-item");
  if (!item) return;

  if (event.target.classList.contains("todo-checkbox")) {
    toggleTodo(item.dataset.id);
  }
});

/* Edit keyboard handling */
todoList.addEventListener("keydown", (event) => {
  const item = event.target.closest(".todo-item");
  if (!item) return;

  if (event.target.classList.contains("edit-input")) {
    if (event.key === "Enter") {
      const priority = item.querySelector(".edit-priority");
      saveEdit(item.dataset.id, event.target.value, priority.value);
    }

    if (event.key === "Escape") {
      cancelEdit();
    }
  }
});

function init() {
  loadTodos();
  renderTodos();
}

init();