// Массив тестовых задач
const tasks = [
  {
    id: 1,
    title: 'Сделать отчёт по практике',
    description: 'Подготовить документацию для кафедры',
    status: 'todo',
    priority: 'high',
    createdAt: '2026-07-05'
  },
  {
    id: 2,
    title: 'Изучить Drag & Drop API',
    description: 'Прочитать документацию MDN',
    status: 'todo',
    priority: 'medium',
    createdAt: '2026-07-04'
  },
  {
    id: 3,
    title: 'Настроить GitHub Pages',
    description: 'Опубликовать приложение',
    status: 'in-progress',
    priority: 'low',
    createdAt: '2026-07-03'
  },
  {
    id: 4,
    title: 'Протестировать приложение',
    description: 'Проверить все функции',
    status: 'done',
    priority: 'medium',
    createdAt: '2026-07-02'
  }
];

// Функция рендера карточек
function renderTasks() {
  // Очищаем все колонки
  document.querySelectorAll('.column-body').forEach(zone => {
    zone.innerHTML = '';
  });

  // Создаём карточки из массива
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

    // Находим нужную колонку по статусу
    const zone = document.querySelector(`[data-drop-zone="${task.status}"]`);
    if (zone) {
      zone.appendChild(card);
    }
  });

  // Обновляем счётчики
  updateCounters();
}

// Функция обновления счётчиков
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

// Запускаем рендер при загрузке страницы
document.addEventListener('DOMContentLoaded', renderTasks);