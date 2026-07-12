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
    return `icons/${capitalName}s.png`;
  } else {
    return `icons/${capitalName}.png`;
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
  saveTasks();
}

function deleteTask(id) {
  if (!confirm('Удалить задачу?')) return;
  const index = tasks.findIndex(t => t.id === id);
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

  cards.forEach(card => {
    card.addEventListener('dragstart', handleDragStart);
    card.addEventListener('dragend', handleDragEnd);
  });

  dropZones.forEach(zone => {
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
  document.querySelectorAll('.column-body').forEach(zone => {
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
  const task = tasks.find(t => t.id == taskId);
  if (task && task.status !== newStatus) {
    task.status = newStatus;
    saveTasks();
    renderTasks();
  }
}

// ===== TOUCH DRAG & DROP (мобильные) =====
// ===== TOUCH DRAG & DROP (мобильные) =====
let touchItem = null;
let touchClone = null;
let touchStartX = 0;
let touchStartY = 0;
let touchOffsetX = 0;
let touchOffsetY = 0;
let touchStartTime = 0;
let touchMoved = false;
let touchHoldTimer = null;
let touchHoldStarted = false;
let activeColumn = null;
const TOUCH_HOLD_DELAY = 200; // мс — задержка перед началом перетаскивания
const TOUCH_MOVE_THRESHOLD = 8; // px — порог движения

function initTouchDragAndDrop() {
  document.addEventListener('touchstart', handleTouchStart, { passive: false });
  document.addEventListener('touchmove', handleTouchMove, { passive: false });
  document.addEventListener('touchend', handleTouchEnd, { passive: false });
  document.addEventListener('touchcancel', handleTouchCancel, { passive: false });
}

function handleTouchStart(e) {
  const card = e.target.closest('.task-card');
  if (!card) return;
  
  // Игнорируем кнопки редактирования/удаления
  if (e.target.closest('.edit-btn') || e.target.closest('.delete-btn')) {
    return;
  }

  touchItem = card;
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
  touchStartTime = Date.now();
  touchMoved = false;
  touchHoldStarted = false;

  // Вычисляем смещение точки касания относительно карточки
  const rect = card.getBoundingClientRect();
  touchOffsetX = touchStartX - rect.left;
  touchOffsetY = touchStartY - rect.top;

  // Запускаем таймер задержки — перетаскивание начнётся только через 200мс
  touchHoldTimer = setTimeout(() => {
    touchHoldStarted = true;
    // Лёгкая вибрация при захвате (если поддерживается)
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

  // Если таймер задержки ещё не истёк — это скролл, отменяем перетаскивание
  if (!touchHoldStarted) {
    // Если палец сдвинулся больше порога ДО истечения таймера — это скролл
    if (deltaX > TOUCH_MOVE_THRESHOLD || deltaY > TOUCH_MOVE_THRESHOLD) {
      clearTimeout(touchHoldTimer);
      touchItem = null;
    }
    return;
  }

  // Перетаскивание активно
  if (deltaX < 5 && deltaY < 5) {
    return; // Слишком маленькое движение — игнорируем
  }

  e.preventDefault();

  // Создаём клон карточки для визуального эффекта
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

  // Двигаем клон
  touchClone.style.left = (touch.clientX - touchOffsetX) + 'px';
  touchClone.style.top = (touch.clientY - touchOffsetY) + 'px';

  // Определяем колонку под пальцем
  touchClone.style.display = 'none';
  const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
  touchClone.style.display = '';

  const newColumn = elementBelow?.closest('.column');

  document.querySelectorAll('.column').forEach(col => {
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
  // Очищаем таймер задержки
  clearTimeout(touchHoldTimer);

  if (!touchItem) return;

  // Если перетаскивание не началось (был скролл или короткий тап)
  if (!touchHoldStarted) {
    touchItem = null;
    return;
  }

  const touch = e.changedTouches[0];

  touchClone.style.display = 'none';
  const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
  touchClone.style.display = '';

  const column = elementBelow?.closest('.column');

  if (column) {
    const newStatus = column.dataset.status;
    const taskId = parseInt(touchItem.dataset.id);
    const task = tasks.find(t => t.id === taskId);

    if (task && task.status !== newStatus) {
      task.status = newStatus;
      saveTasks();
      renderTasks();
      
      setTimeout(() => {
        const newCard = document.querySelector(`[data-id="${taskId}"]`);
        if (newCard) {
          newCard.classList.add('task-dropped');
          setTimeout(() => newCard.classList.remove('task-dropped'), 600);
        }
      }, 50);
    }
  }

  if (touchClone) {
    touchClone.remove();
    touchClone = null;
  }

  touchItem.classList.remove('touch-dragging');

  document.querySelectorAll('.column').forEach(col => {
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
  document.querySelectorAll('.column').forEach(col => {
    col.classList.remove('column-highlight');
  });
  touchItem = null;
  activeColumn = null;
}
// ===== ЗАПУСК =====
document.addEventListener('DOMContentLoaded', () => {
  renderTasks();
  initTouchDragAndDrop();
});