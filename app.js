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

// ===== ФУНКЦИЯ ПОЛУЧЕНИЯ ПУТИ К ИКОНКЕ =====
function getIconPath(name) {
  const theme = document.documentElement.getAttribute('data-theme') || 'light';
  const capitalName = name.charAt(0).toUpperCase() + name.slice(1);
  if (theme === 'dark') {
    return 'icons/' + capitalName + 's.png';
  } else {
    return 'icons/' + capitalName + '.png';
  }
}

// ===== МОДАЛЬНОЕ ОКНО =====
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modal-title');
const taskForm = document.getElementById('task-form');
const taskTitleInput = document.getElementById('task-title');
const taskDescInput = document.getElementById('task-description');
const taskPriorityInput = document.getElementById('task-priority');
let editingId = null;
let currentStatus = 'todo';

function openModal(task, status) {
  task = task || null;
  status = status || 'todo';
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
    const task = tasks.find(function(t) { return t.id === editingId; });
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
  saveTasks();
}

function deleteTask(id) {
  if (!confirm('Удалить задачу?')) return;
  const index = tasks.findIndex(function(t) { return t.id === id; });
  if (index !== -1) {
    tasks.splice(index, 1);
    renderTasks();
    saveTasks();
  }
}

// ===== DRAG & DROP (десктоп) =====
function initDragAndDrop() {
  const cards = document.querySelectorAll('.task-card');
  const dropZones = document.querySelectorAll('.column-body');

  cards.forEach(function(card) {
    card.addEventListener('dragstart', handleDragStart);
    card.addEventListener('dragend', handleDragEnd);
  });

  dropZones.forEach(function(zone) {
    zone.addEventListener('dragover', handleDragOver);
    zone.addEventListener('dragenter', handleDragEnter);
    zone.addEventListener('dragleave', handleDragLeave);
    zone.addEventListener('drop', handleDrop);
  });
}

function handleDragStart(e) {
  this.classList.add('dragging');
  e.dataTransfer.setData('text/plain', this.dataset.id);
  e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(e) {
  this.classList.remove('dragging');
  document.querySelectorAll('.column-body').forEach(function(zone) {
    zone.classList.remove('drag-over');
  });
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
}

function handleDragEnter(e) {
  e.preventDefault();
  this.classList.add('drag-over');
}

function handleDragLeave(e) {
  if (!this.contains(e.relatedTarget)) {
    this.classList.remove('drag-over');
  }
}

function handleDrop(e) {
  e.preventDefault();
  this.classList.remove('drag-over');
  const taskId = e.dataTransfer.getData('text/plain');
  const newStatus = this.dataset.dropZone;
  const task = tasks.find(function(t) { return t.id == taskId; });
  if (task && task.status !== newStatus) {
    task.status = newStatus;
    saveTasks();
    renderTasks();
  }
}

// ===== TOUCH DRAG & DROP (мобильные) =====
let touchItem = null;
let touchClone = null;
let touchStartX = 0;
let touchStartY = 0;
let touchOffsetX = 0;
let touchOffsetY = 0;
let touchHoldTimer = null;
let touchHoldStarted = false;
let activeColumn = null;

const TOUCH_HOLD_DELAY = 250;
const TOUCH_MOVE_THRESHOLD = 10;

function initTouchDragAndDrop() {
  document.addEventListener('touchstart', handleTouchStart, { passive: false });
  document.addEventListener('touchmove', handleTouchMove, { passive: false });
  document.addEventListener('touchend', handleTouchEnd, { passive: false });
  document.addEventListener('touchcancel', handleTouchCancel, { passive: false });
}

function handleTouchStart(e) {
  const card = e.target.closest('.task-card');
  if (!card) return;

  if (e.target.closest('.edit-btn') || e.target.closest('.delete-btn')) {
    return;
  }

  touchItem = card;
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
  touchHoldStarted = false;

  const rect = card.getBoundingClientRect();
  touchOffsetX = touchStartX - rect.left;
  touchOffsetY = touchStartY - rect.top;

  touchHoldTimer = setTimeout(function() {
    touchHoldStarted = true;
    if (navigator.vibrate) {
      navigator.vibrate(30);
    }
  }, TOUCH_HOLD_DELAY);
}

function handleTouchMove(e) {
  if (!touchItem) return;

  const touch = e.touches[0];
  const deltaX = Math.abs(touch.clientX - touchStartX);
  const deltaY = Math.abs(touch.clientY - touchStartY);

  if (!touchHoldStarted) {
    if (deltaX > TOUCH_MOVE_THRESHOLD || deltaY > TOUCH_MOVE_THRESHOLD) {
      clearTimeout(touchHoldTimer);
      touchItem = null;
    }
    return;
  }

  if (deltaX < 5 && deltaY < 5) return;

  e.preventDefault();

  if (!touchClone) {
    touchClone = touchItem.cloneNode(true);
    touchClone.classList.add('touch-clone');
    touchClone.style.position = 'fixed';
    touchClone.style.zIndex = '10000';
    touchClone.style.width = touchItem.offsetWidth + 'px';
    touchClone.style.pointerEvents = 'none';
    document.body.appendChild(touchClone);
    touchItem.classList.add('touch-dragging');
  }

  touchClone.style.left = (touch.clientX - touchOffsetX) + 'px';
  touchClone.style.top = (touch.clientY - touchOffsetY) + 'px';

  touchClone.style.display = 'none';
  const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
  touchClone.style.display = '';

  const newColumn = elementBelow ? elementBelow.closest('.column') : null;

  document.querySelectorAll('.column').forEach(function(col) {
    col.classList.remove('column-highlight');
  });

  if (newColumn && newColumn !== activeColumn) {
    newColumn.classList.add('column-highlight');
    activeColumn = newColumn;
  } else if (!newColumn && activeColumn) {
    activeColumn.classList.remove('column-highlight');
    activeColumn = null;
  }
}

function handleTouchEnd(e) {
  clearTimeout(touchHoldTimer);

  if (!touchItem) return;

  if (!touchHoldStarted) {
    touchItem = null;
    return;
  }

  const touch = e.changedTouches[0];

  if (touchClone) {
    touchClone.style.display = 'none';
  }
  const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
  if (touchClone) {
    touchClone.style.display = '';
  }

  const column = elementBelow ? elementBelow.closest('.column') : null;

  if (column) {
    const newStatus = column.dataset.status;
    const taskId = parseInt(touchItem.dataset.id);
    const task = tasks.find(function(t) { return t.id === taskId; });

    if (task && task.status !== newStatus) {
      task.status = newStatus;
      saveTasks();
      renderTasks();

      setTimeout(function() {
        const newCard = document.querySelector('[data-id="' + taskId + '"]');
        if (newCard) {
          newCard.classList.add('task-dropped');
          setTimeout(function() {
            newCard.classList.remove('task-dropped');
          }, 600);
        }
      }, 50);
    }
  }

  if (touchClone) {
    touchClone.remove();
    touchClone = null;
  }

  touchItem.classList.remove('touch-dragging');

  document.querySelectorAll('.column').forEach(function(col) {
    col.classList.remove('column-highlight');
  });

  touchItem = null;
  activeColumn = null;
}

function handleTouchCancel(e) {
  clearTimeout(touchHoldTimer);
  if (touchClone) {
    touchClone.remove();
    touchClone = null;
  }
  if (touchItem) {
    touchItem.classList.remove('touch-dragging');
  }
  document.querySelectorAll('.column').forEach(function(col) {
    col.classList.remove('column-highlight');
  });
  touchItem = null;
  activeColumn = null;
}

// ===== РЕНДЕРИНГ =====
function renderTasks() {
  document.querySelectorAll('.column-body').forEach(function(zone) {
    zone.innerHTML = '';
  });

  tasks.forEach(function(task) {
    const card = document.createElement('article');
    card.className = 'task-card';
    card.draggable = true;
    card.dataset.priority = task.priority;
    card.dataset.id = task.id;

    // БЕЗ бейджа приоритета - только дата и кнопки
    card.innerHTML = '<div class="task-title">' + task.title + '</div>' +
      '<div class="task-desc">' + task.description + '</div>' +
      '<div class="task-meta">' +
        '<span class="task-date">' +
          '<img src="' + getIconPath('calendar') + '" alt="Дата" class="icon icon-calendar">' +
          ' ' + task.createdAt +
        '</span>' +
        '<div class="task-actions">' +
          '<button class="edit-btn" title="Редактировать">' +
            '<img src="' + getIconPath('pencil') + '" alt="Редактировать" class="icon icon-pencil">' +
          '</button>' +
          '<button class="delete-btn" title="Удалить">' +
            '<img src="' + getIconPath('trash') + '" alt="Удалить" class="icon icon-trash">' +
          '</button>' +
        '</div>' +
      '</div>';

    card.querySelector('.edit-btn').addEventListener('click', function() {
      openModal(task);
    });

    card.querySelector('.delete-btn').addEventListener('click', function() {
      deleteTask(task.id);
    });

    const zone = document.querySelector('[data-drop-zone="' + task.status + '"]');
    if (zone) {
      zone.appendChild(card);
    }
  });

  initDragAndDrop();
  updateCounters();
}

function updateCounters() {
  const counters = {
    'todo': 0,
    'in-progress': 0,
    'done': 0
  };

  tasks.forEach(function(task) {
    if (counters.hasOwnProperty(task.status)) {
      counters[task.status]++;
    }
  });

  const todoCounter = document.querySelector('[data-counter="todo"]');
  const inProgressCounter = document.querySelector('[data-counter="in-progress"]');
  const doneCounter = document.querySelector('[data-counter="done"]');

  if (todoCounter) todoCounter.textContent = counters['todo'];
  if (inProgressCounter) inProgressCounter.textContent = counters['in-progress'];
  if (doneCounter) doneCounter.textContent = counters['done'];
}

// ===== ТЁМНАЯ ТЕМА =====
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');

function loadTheme() {
  const savedTheme = localStorage.getItem('task-tracker-theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
}

function saveTheme(theme) {
  localStorage.setItem('task-tracker-theme', theme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', newTheme);
  saveTheme(newTheme);
  updateThemeIcon(newTheme);
  renderTasks();
}

function updateThemeIcon(theme) {
  if (theme === 'light') {
    themeIcon.src = getIconPath('moon');
    themeIcon.alt = 'Переключить на тёмную тему';
  } else {
    themeIcon.src = getIconPath('sun');
    themeIcon.alt = 'Переключить на светлую тему';
  }
}

loadTheme();
themeToggle.addEventListener('click', toggleTheme);

// ===== ЭКСПОРТ/ИМПОРТ JSON =====
const exportBtn = document.getElementById('export-btn');
const importBtn = document.getElementById('import-btn');
const importFile = document.getElementById('import-file');

function exportTasks() {
  const dataStr = JSON.stringify(tasks, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'tasks_' + new Date().toISOString().split('T')[0] + '.json';
  link.click();
  URL.revokeObjectURL(url);
}

function importTasks(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const importedTasks = JSON.parse(e.target.result);
      if (Array.isArray(importedTasks)) {
        if (confirm('Импортировать ' + importedTasks.length + ' задач? Текущие задачи будут заменены.')) {
          tasks = importedTasks;
          saveTasks();
          renderTasks();
          alert('Задачи успешно импортированы!');
        }
      } else {
        alert('Неверный формат файла!');
      }
    } catch (error) {
      alert('Ошибка при чтении файла: ' + error.message);
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

exportBtn.addEventListener('click', exportTasks);
importBtn.addEventListener('click', function() { importFile.click(); });
importFile.addEventListener('change', importTasks);

// ===== СОБЫТИЯ МОДАЛЬНОГО ОКНА =====
document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('modal-cancel').addEventListener('click', closeModal);
modal.addEventListener('click', function(e) {
  if (e.target === modal) closeModal();
});
taskForm.addEventListener('submit', saveTask);

document.querySelectorAll('[data-add]').forEach(function(btn) {
  btn.addEventListener('click', function() {
    openModal(null, btn.dataset.add);
  });
});

// ===== ЗАПУСК =====
document.addEventListener('DOMContentLoaded', function() {
  renderTasks();
  initTouchDragAndDrop();
});