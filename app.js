// ===== ЗАГРУЗКА И СОХРАНЕНИЕ =====
function loadTasks() {
  const saved = localStorage.getItem('task-tracker-tasks');
  if (saved) {
    return JSON.parse(saved);
  }
  return [
    { id: 1, title: 'Сделать отчёт по практике', description: 'Подготовить документацию для кафедры', status: 'todo', priority: 'high', createdAt: '2026-07-05' },
    { id: 2, title: 'Изучить Drag & Drop API', description: 'Прочитать документацию MDN', status: 'todo', priority: 'medium', createdAt: '2026-07-04' },
    { id: 3, title: 'Настроить GitHub Pages', description: 'Опубликовать приложение', status: 'in-progress', priority: 'low', createdAt: '2026-07-03' },
    { id: 4, title: 'Протестировать приложение', description: 'Проверить все функции', status: 'done', priority: 'medium', createdAt: '2026-07-02' }
  ];
}

function saveTasks() {
  localStorage.setItem('task-tracker-tasks', JSON.stringify(tasks));
}

// ===== ИНИЦИАЛИЗАЦИЯ =====
let tasks = loadTasks();

// ===== МОДАЛЬНОЕ ОКНО =====
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modal-title');
const taskForm = document.getElementById('task-form');
const taskTitleInput = document.getElementById('task-title');
const taskDescInput = document.getElementById('task-description');
const taskPriorityInput = document.getElementById('task-priority');
let editingId = null;
let currentStatus = 'todo';

function openModal(task = null, status = 'todo') {
  if (task) {
    modalTitle.textContent = 'Редактирование задачи';
    editingId = task.id;
    taskTitleInput.value = task.title;
    taskDescInput.value = task.description;
    taskPriorityInput.value = task.priority;
  } else {
    modalTitle.textContent = 'Новая задача';
    editingId = null;
    currentStatus = status;
    taskForm.reset();
    taskPriorityInput.value = 'medium';
  }
  modal.classList.remove('hidden');
  taskTitleInput.focus();
}

function closeModal() {
  modal.classList.add('hidden');
  taskForm.reset();
  editingId = null;
}

// ===== CRUD ОПЕРАЦИИ =====
function saveTask(e) {
  e.preventDefault();
  
  const title = taskTitleInput.value.trim();
  if (!title) return;
  
  const data = {
    title: title,
    description: taskDescInput.value.trim(),
    priority: taskPriorityInput.value
  };
  
  if (editingId) {
    const task = tasks.find(t => t.id === editingId);
    if (task) {
      task.title = data.title;
      task.description = data.description;
      task.priority = data.priority;
    }
    editingId = null;
  } else {
    const newTask = {
      id: Date.now(),
      title: data.title,
      description: data.description,
      status: currentStatus,
      priority: data.priority,
      createdAt: new Date().toISOString().split('T')[0]
    };
    tasks.push(newTask);
  }
  
  closeModal();
  renderTasks();
  saveTasks(); // Сохраняем в localStorage
}

function deleteTask(id) {
  if (!confirm('Удалить задачу?')) return;
  
  const index = tasks.findIndex(t => t.id === id);
  if (index !== -1) {
    tasks.splice(index, 1);
    renderTasks();
    saveTasks(); // Сохраняем в localStorage
  }
}

// ===== РЕНДЕРИНГ =====
function renderTasks() {
  document.querySelectorAll('.column-body').forEach(zone => {
    zone.innerHTML = '';
  });

  tasks.forEach(task => {
    const card = document.createElement('article');
    card.className = 'task-card';
    card.dataset.priority = task.priority;
    card.dataset.id = task.id;

    card.innerHTML = `
      <div class="task-title">${task.title}</div>
      <div class="task-desc">${task.description}</div>
      <div class="task-meta">
        <span class="task-date">📅 ${task.createdAt}</span>
        <div class="task-actions">
          <button class="edit-btn" title="Редактировать">✏️</button>
          <button class="delete-btn" title="Удалить">🗑️</button>
        </div>
      </div>
    `;

    card.querySelector('.edit-btn').addEventListener('click', () => {
      openModal(task);
    });
    
    card.querySelector('.delete-btn').addEventListener('click', () => {
      deleteTask(task.id);
    });

    const zone = document.querySelector(`[data-drop-zone="${task.status}"]`);
    if (zone) {
      zone.appendChild(card);
    }
  });

  updateCounters();
}

function updateCounters() {
  const counters = {
    'todo': 0,
    'in-progress': 0,
    'done': 0
  };

  tasks.forEach(task => {
    counters[task.status]++;
  });

  document.querySelector('[data-counter="todo"]').textContent = counters['todo'];
  document.querySelector('[data-counter="in-progress"]').textContent = counters['in-progress'];
  document.querySelector('[data-counter="done"]').textContent = counters['done'];
}

// ===== СОБЫТИЯ =====
document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('modal-cancel').addEventListener('click', closeModal);
modal.addEventListener('click', e => {
  if (e.target === modal) closeModal();
});
taskForm.addEventListener('submit', saveTask);

document.querySelectorAll('[data-add]').forEach(btn => {
  btn.addEventListener('click', () => {
    openModal(null, btn.dataset.add);
  });
});

// ===== ЗАПУСК =====
document.addEventListener('DOMContentLoaded', renderTasks);