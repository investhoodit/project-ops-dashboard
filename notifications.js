const NOTIFY_DATA_KEY = 'investhood_project_ops_dashboard_v1';
const NOTIFY_EMAILS = ['jerome.dhlamini@gmail.com', 'kelebogilemoshadi@gmail.com'];
const NOTIFY_WHATSAPP = '27682460562';

function getNotifyData() {
  try {
    return JSON.parse(localStorage.getItem(NOTIFY_DATA_KEY)) || { projects: [], tasks: [] };
  } catch {
    return { projects: [], tasks: [] };
  }
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getDueTodayTasks() {
  const data = getNotifyData();
  const today = todayKey();
  return (data.tasks || [])
    .filter(task => task.dueDate === today && task.status !== 'Completed')
    .map(task => ({
      ...task,
      project: (data.projects || []).find(project => project.id === task.projectId)
    }));
}

function buildNotificationMessage(tasks) {
  if (!tasks.length) return `Good morning, no Investhood IT Portfolio tasks are due today (${todayKey()}).`;
  return [
    `Good morning, the following Investhood IT Portfolio tasks are due today (${todayKey()}):`,
    '',
    ...tasks.map((task, index) => `${index + 1}. ${task.title}\nProject: ${task.project?.name || task.projectId}\nOwner: ${task.owner}\nPriority: ${task.priority}\nStatus: ${task.status}`),
    '',
    'Please update the dashboard once completed.'
  ].join('\n');
}

function renderDueTodayNotifications() {
  const list = document.getElementById('dueTodayList');
  const emailBtn = document.getElementById('emailDueTasksBtn');
  const whatsappBtn = document.getElementById('whatsappDueTasksBtn');
  if (!list || !emailBtn || !whatsappBtn) return;

  const tasks = getDueTodayTasks();
  const message = buildNotificationMessage(tasks);
  list.innerHTML = tasks.length ? tasks.map(task => `
    <div class="notification-item">
      <div>
        <strong>${escapeNotify(task.title)}</strong>
        <small>${escapeNotify(task.project?.name || task.projectId)} | ${escapeNotify(task.owner)} | ${escapeNotify(task.priority)} priority | ${escapeNotify(task.status)}</small>
      </div>
      <span class="status in-progress">Due Today</span>
    </div>
  `).join('') : '<div class="empty-state">No open tasks are due today.</div>';

  const subject = encodeURIComponent(`Investhood IT Portfolio Tasks Due Today - ${todayKey()}`);
  const body = encodeURIComponent(message);
  emailBtn.href = `mailto:${NOTIFY_EMAILS.join(',')}?subject=${subject}&body=${body}`;
  whatsappBtn.href = `https://wa.me/${NOTIFY_WHATSAPP}?text=${body}`;
}

function escapeNotify(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

window.addEventListener('load', renderDueTodayNotifications);
document.addEventListener('click', () => window.setTimeout(renderDueTodayNotifications, 150));
document.addEventListener('change', () => window.setTimeout(renderDueTodayNotifications, 150));
document.addEventListener('submit', () => window.setTimeout(renderDueTodayNotifications, 150));
