const STORAGE_KEY = "task2-todo-app";

const state = {
  todos: [],
  filter: "all",
};

const todoForm = document.getElementById("todo-form");
const todoInput = document.getElementById("todo-input");
const todoList = document.getElementById("todo-list");
const taskCount = document.getElementById("task-count");
const clearCompletedBtn = document.getElementById("clear-completed");
const emptyState = document.getElementById("empty-state");
const formMessage = document.getElementById("form-message");
const filterButtons = document.querySelectorAll(".filter-btn");

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
    console.error("Failed to parse saved todos:", error);
    state.todos = [];
  }
}

function getFilteredTodos() {
  if (state.filter === "active") {
    return state.todos.filter((todo) => !todo.completed);
  }

  if (state.filter === "completed") {
    return state.todos.filter((todo) => todo.completed);
  }

  return state.todos;
}

function updateTaskCount() {
  taskCount.textContent = state.todos.length;
}

function updateEmptyState(filteredTodos) {
  emptyState.style.display = filteredTodos.length === 0 ? "block" : "none";
}

function setActiveFilterButton() {
  filterButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.filter === state.filter);
  });
}

function createTodoElement(todo) {
  const li = document.createElement("li");
  li.className = `todo-item ${todo.completed ? "completed" : ""}`;
  li.dataset.id = todo.id;

  li.innerHTML = `
    <div class="todo-main">
      <input
        class="todo-checkbox"
        type="checkbox"
        ${todo.completed ? "checked" : ""}
        aria-label="Mark task as completed"
      />
      <div class="todo-content">
        <p class="todo-text">${escapeHtml(todo.text)}</p>
        <div class="todo-meta">
          Status: ${todo.completed ? "Completed" : "Active"}
        </div>
      </div>
    </div>

    <div class="todo-actions">
      <button class="action-btn edit-btn" type="button">Edit</button>
      <button class="action-btn delete-btn" type="button">Delete</button>
    </div>
  `;

  return li;
}

function renderTodos() {
  const filteredTodos = getFilteredTodos();

  todoList.innerHTML = "";

  filteredTodos.forEach((todo) => {
    const todoElement = createTodoElement(todo);
    todoList.appendChild(todoElement);
  });

  updateTaskCount();
  updateEmptyState(filteredTodos);
  setActiveFilterButton();
}

function addTodo(text) {
  const trimmedText = text.trim();

  if (!trimmedText) {
    formMessage.textContent = "Please enter a task before adding.";
    return;
  }

  const newTodo = {
    id: createId(),
    text: trimmedText,
    completed: false,
    createdAt: new Date().toISOString(),
  };

  state.todos.unshift(newTodo);
  saveTodos();
  renderTodos();

  todoInput.value = "";
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

function updateTodo(id, newText) {
  const trimmedText = newText.trim();

  if (!trimmedText) {
    alert("Task cannot be empty.");
    return;
  }

  state.todos = state.todos.map((todo) =>
    todo.id === id ? { ...todo, text: trimmedText } : todo
  );

  saveTodos();
  renderTodos();
}

function clearCompletedTodos() {
  state.todos = state.todos.filter((todo) => !todo.completed);
  saveTodos();
  renderTodos();
}

function startEditMode(todoItem, todo) {
  const content = todoItem.querySelector(".todo-content");
  const actions = todoItem.querySelector(".todo-actions");

  content.innerHTML = `
    <input class="edit-input" type="text" value="${escapeAttribute(todo.text)}" maxlength="120" />
    <div class="todo-meta">Editing task</div>
  `;

  actions.innerHTML = `
    <button class="action-btn save-btn" type="button">Save</button>
    <button class="action-btn cancel-btn" type="button">Cancel</button>
  `;

  const editInput = todoItem.querySelector(".edit-input");
  editInput.focus();
  editInput.select();
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function escapeAttribute(text) {
  return text.replace(/"/g, "&quot;");
}

todoForm.addEventListener("submit", (event) => {
  event.preventDefault();
  addTodo(todoInput.value);
});

clearCompletedBtn.addEventListener("click", () => {
  clearCompletedTodos();
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.filter = button.dataset.filter;
    renderTodos();
  });
});

/* Delegated event listeners */
todoList.addEventListener("click", (event) => {
  const todoItem = event.target.closest(".todo-item");
  if (!todoItem) return;

  const todoId = todoItem.dataset.id;
  const todo = state.todos.find((item) => item.id === todoId);
  if (!todo) return;

  if (event.target.classList.contains("delete-btn")) {
    deleteTodo(todoId);
    return;
  }

  if (event.target.classList.contains("edit-btn")) {
    startEditMode(todoItem, todo);
    return;
  }

  if (event.target.classList.contains("save-btn")) {
    const editInput = todoItem.querySelector(".edit-input");
    if (editInput) {
      updateTodo(todoId, editInput.value);
    }
    return;
  }

  if (event.target.classList.contains("cancel-btn")) {
    renderTodos();
  }
});

todoList.addEventListener("change", (event) => {
  const todoItem = event.target.closest(".todo-item");
  if (!todoItem) return;

  const todoId = todoItem.dataset.id;

  if (event.target.classList.contains("todo-checkbox")) {
    toggleTodo(todoId);
  }
});

todoList.addEventListener("keydown", (event) => {
  const todoItem = event.target.closest(".todo-item");
  if (!todoItem) return;

  const todoId = todoItem.dataset.id;

  if (event.target.classList.contains("edit-input")) {
    if (event.key === "Enter") {
      updateTodo(todoId, event.target.value);
    }

    if (event.key === "Escape") {
      renderTodos();
    }
  }
});

function init() {
  loadTodos();
  renderTodos();
}

init();