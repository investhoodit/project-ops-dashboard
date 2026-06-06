const CALENDAR_EVENTS_KEY = 'investhood_calendar_events_v1';
const DASHBOARD_DATA_KEY = 'investhood_project_ops_dashboard_v1';

let calendarDate = new Date();
calendarDate.setDate(1);

const saPublicHolidays = [
  { date: '2026-01-01', title: "New Year's Day" },
  { date: '2026-03-21', title: 'Human Rights Day' },
  { date: '2026-04-03', title: 'Good Friday' },
  { date: '2026-04-06', title: 'Family Day' },
  { date: '2026-04-27', title: 'Freedom Day' },
  { date: '2026-04-28', title: 'Public Holiday: Freedom Day Observed' },
  { date: '2026-05-01', title: "Workers' Day" },
  { date: '2026-06-16', title: 'Youth Day' },
  { date: '2026-08-09', title: "National Women's Day" },
  { date: '2026-08-10', title: "Public Holiday: Women's Day Observed" },
  { date: '2026-09-24', title: 'Heritage Day' },
  { date: '2026-12-16', title: 'Day of Reconciliation' },
  { date: '2026-12-25', title: 'Christmas Day' },
  { date: '2026-12-26', title: 'Day of Goodwill' }
];

function getDashboardDataForCalendar() {
  try {
    return JSON.parse(localStorage.getItem(DASHBOARD_DATA_KEY)) || { projects: [], tasks: [] };
  } catch {
    return { projects: [], tasks: [] };
  }
}

function getUserEvents() {
  try {
    return JSON.parse(localStorage.getItem(CALENDAR_EVENTS_KEY)) || [];
  } catch {
    return [];
  }
}

function saveUserEvents(events) {
  localStorage.setItem(CALENDAR_EVENTS_KEY, JSON.stringify(events));
}

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function sameMonth(date, activeDate) {
  return date.getMonth() === activeDate.getMonth() && date.getFullYear() === activeDate.getFullYear();
}

function getCalendarEvents() {
  const dashboard = getDashboardDataForCalendar();
  const taskEvents = (dashboard.tasks || []).map(task => {
    const project = (dashboard.projects || []).find(item => item.id === task.projectId);
    return {
      id: `task-${task.id}`,
      date: task.dueDate,
      title: task.title,
      type: 'Task',
      className: 'task',
      notes: `${project?.name || 'Project'} | ${task.status} | ${task.owner}`,
      editable: false
    };
  }).filter(event => event.date);

  const holidayEvents = saPublicHolidays.map(holiday => ({
    ...holiday,
    id: `holiday-${holiday.date}`,
    type: 'SA Holiday',
    className: 'holiday',
    notes: 'South African public holiday',
    editable: false
  }));

  const userEvents = getUserEvents().map(event => ({
    ...event,
    className: 'user',
    editable: true
  }));

  return [...taskEvents, ...holidayEvents, ...userEvents];
}

function renderCalendar() {
  const grid = document.getElementById('calendarGrid');
  const title = document.getElementById('calendarTitle');
  const agenda = document.getElementById('calendarAgenda');
  if (!grid || !title || !agenda) return;

  const monthName = calendarDate.toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' });
  title.textContent = monthName;

  const firstDay = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 1);
  const start = new Date(firstDay);
  start.setDate(firstDay.getDate() - firstDay.getDay());
  const today = formatDate(new Date());
  const events = getCalendarEvents();
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const weekdayMarkup = weekdays.map(day => `<div class="calendar-weekday">${day}</div>`).join('');
  const dayMarkup = Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    const dateKey = formatDate(day);
    const dayEvents = events.filter(event => event.date === dateKey);
    const outside = sameMonth(day, calendarDate) ? '' : ' outside';
    const isToday = dateKey === today ? ' today' : '';
    return `
      <div class="calendar-day${outside}${isToday}" data-date="${dateKey}">
        <div class="day-number"><span>${day.getDate()}</span><span>${dayEvents.length ? dayEvents.length : ''}</span></div>
        ${dayEvents.slice(0, 4).map(event => `<div class="calendar-event ${event.className}" title="${escapeCalendar(event.notes || '')}" data-event-id="${event.id}">${escapeCalendar(event.title)}</div>`).join('')}
        ${dayEvents.length > 4 ? `<div class="calendar-event user">+${dayEvents.length - 4} more</div>` : ''}
      </div>
    `;
  }).join('');
  grid.innerHTML = weekdayMarkup + dayMarkup;

  const upcoming = events
    .filter(event => event.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 10);

  agenda.innerHTML = upcoming.length ? upcoming.map(event => `
    <div class="agenda-item">
      <div><strong>${escapeCalendar(event.date)} - ${escapeCalendar(event.title)}</strong><br><small>${escapeCalendar(event.type)}${event.notes ? ` | ${escapeCalendar(event.notes)}` : ''}</small></div>
      ${event.editable ? `<button data-delete-event="${event.id}">Delete</button>` : ''}
    </div>
  `).join('') : '<div class="agenda-item"><strong>No upcoming events yet.</strong></div>';
}

function escapeCalendar(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function openEventDialog(date = null) {
  const dialog = document.getElementById('eventDialog');
  const form = document.getElementById('eventForm');
  if (!dialog || !form) return;
  form.reset();
  form.date.value = date || formatDate(new Date());
  dialog.showModal();
}

function handleEventSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form).entries());
  const events = getUserEvents();
  events.push({
    id: `user-${crypto.randomUUID()}`,
    title: data.title,
    date: data.date,
    type: data.type,
    notes: data.notes || ''
  });
  saveUserEvents(events);
  document.getElementById('eventDialog').close();
  renderCalendar();
}

document.addEventListener('click', event => {
  if (event.target.id === 'prevMonthBtn') {
    calendarDate.setMonth(calendarDate.getMonth() - 1);
    renderCalendar();
  }
  if (event.target.id === 'nextMonthBtn') {
    calendarDate.setMonth(calendarDate.getMonth() + 1);
    renderCalendar();
  }
  if (event.target.id === 'todayBtn') {
    calendarDate = new Date();
    calendarDate.setDate(1);
    renderCalendar();
  }
  if (event.target.id === 'addEventBtn') openEventDialog();
  if (event.target.id === 'cancelEventBtn') document.getElementById('eventDialog')?.close();
  if (event.target.classList?.contains('calendar-day')) openEventDialog(event.target.dataset.date);
  if (event.target.dataset?.deleteEvent) {
    const events = getUserEvents().filter(item => item.id !== event.target.dataset.deleteEvent);
    saveUserEvents(events);
    renderCalendar();
  }
});

document.addEventListener('submit', event => {
  if (event.target.id === 'eventForm') handleEventSubmit(event);
  window.setTimeout(renderCalendar, 150);
});

document.addEventListener('change', () => window.setTimeout(renderCalendar, 150));
window.addEventListener('load', renderCalendar);
