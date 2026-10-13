(() => {
  "use strict";

  const STORAGE_KEY = "taskflow.tasks.v1";
  const form = document.querySelector("#task-form");
  const input = document.querySelector("#task-input");
  const list = document.querySelector("#task-list");
  const emptyState = document.querySelector("#empty-state");
  const emptyTitle = document.querySelector("#empty-title");
  const emptyCopy = document.querySelector("#empty-copy");
  const taskCount = document.querySelector("#task-count");
  const allCount = document.querySelector("#all-count");
  const activeCount = document.querySelector("#active-count");
  const completedCount = document.querySelector("#completed-count");
  const remainingCopy = document.querySelector("#remaining-copy");
  const clearCompleted = document.querySelector("#clear-completed");
  const filterButtons = [...document.querySelectorAll("[data-filter]")];

  let tasks = loadTasks();
  let currentFilter = "all";

  function loadTasks() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      if (!Array.isArray(saved)) return [];
      return saved.filter((task) =>
        task && typeof task.id === "string" &&
        typeof task.text === "string" &&
        typeof task.completed === "boolean"
      );
    } catch {
      return [];
    }
  }

  function saveTasks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch {
      remainingCopy.textContent = "Storage is unavailable in this browser.";
    }
  }

  function createTask(text) {
    return {
      id: typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : String(Date.now()) + Math.random().toString(16).slice(2),
      text: text.trim(),
      completed: false
    };
  }

  function makeTaskElement(task) {
    const item = document.createElement("li");
    item.className = "task-item" + (task.completed ? " completed" : "");

    const check = document.createElement("button");
    check.type = "button";
    check.className = "task-check";
    check.setAttribute("aria-label", task.completed ? "Mark task as incomplete" : "Mark task as complete");
    check.setAttribute("aria-pressed", String(task.completed));
    check.textContent = task.completed ? "✓" : "";
    check.addEventListener("click", () => {
      tasks = tasks.map((entry) => entry.id === task.id
        ? { ...entry, completed: !entry.completed }
        : entry);
      saveTasks();
      render();
    });

    const text = document.createElement("span");
    text.className = "task-text";
    text.textContent = task.text;

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "delete-button";
    remove.setAttribute("aria-label", "Delete task: " + task.text);
    remove.title = "Delete task";
    remove.textContent = "×";
    remove.addEventListener("click", () => {
      tasks = tasks.filter((entry) => entry.id !== task.id);
      saveTasks();
      render();
    });

    item.append(check, text, remove);
    return item;
  }

  function render() {
    const completed = tasks.filter((task) => task.completed).length;
    const active = tasks.length - completed;
    const visibleTasks = tasks.filter((task) => {
      if (currentFilter === "active") return !task.completed;
      if (currentFilter === "completed") return task.completed;
      return true;
    });

    list.replaceChildren(...visibleTasks.map(makeTaskElement));
    taskCount.textContent = tasks.length + (tasks.length === 1 ? " task" : " tasks");
    allCount.textContent = String(tasks.length);
    activeCount.textContent = String(active);
    completedCount.textContent = String(completed);
    clearCompleted.disabled = completed === 0;
    remainingCopy.textContent = active === 0
      ? (tasks.length ? "Everything is complete. Nice work!" : "You're ready when you are.")
      : active + (active === 1 ? " task left to go." : " tasks left to go.");

    filterButtons.forEach((button) => {
      const selected = button.dataset.filter === currentFilter;
      button.classList.toggle("active", selected);
      button.setAttribute("aria-pressed", String(selected));
    });

    emptyState.hidden = visibleTasks.length > 0;
    if (currentFilter === "active") {
      emptyTitle.textContent = "All caught up.";
      emptyCopy.textContent = "There are no tasks in progress right now.";
    } else if (currentFilter === "completed") {
      emptyTitle.textContent = "Not yet, and that's okay.";
      emptyCopy.textContent = "Completed tasks will show up here.";
    } else {
      emptyTitle.textContent = "A fresh start.";
      emptyCopy.textContent = "Add your first task above and build some momentum.";
    }
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) {
      input.focus();
      return;
    }
    tasks.unshift(createTask(text));
    saveTasks();
    input.value = "";
    currentFilter = "all";
    render();
    input.focus();
  });

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      currentFilter = button.dataset.filter;
      render();
    });
  });

  clearCompleted.addEventListener("click", () => {
    tasks = tasks.filter((task) => !task.completed);
    saveTasks();
    render();
  });

  render();
})();