const DETAIL_DATA_KEY = 'investhood_project_ops_dashboard_v1';

function getDetailData() {
  try {
    return JSON.parse(localStorage.getItem(DETAIL_DATA_KEY)) || { sbus: [], projects: [], tasks: [], kpis: [], weeklyReview: [] };
  } catch {
    return { sbus: [], projects: [], tasks: [], kpis: [], weeklyReview: [] };
  }
}

function esc(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function projectName(data, projectId) {
  return data.projects.find(project => project.id === projectId)?.name || projectId;
}

function sbuName(data, sbuId) {
  return data.sbus.find(sbu => sbu.id === sbuId)?.name || sbuId;
}

function table(headers, rows) {
  if (!rows.length) return '<div class="empty-state">No detailed records available for this indicator yet.</div>';
  return `
    <div class="detail-table-wrap">
      <table class="detail-table">
        <thead><tr>${headers.map(header => `<th>${esc(header)}</th>`).join('')}</tr></thead>
        <tbody>${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody>
      </table>
    </div>
  `;
}

function projectRows(data, projects = data.projects) {
  return projects.map(project => [
    `<strong>${esc(project.name)}</strong>`,
    esc(sbuName(data, project.sbu)),
    `<span class="status ${String(project.status).toLowerCase().replaceAll(' ', '-')}">${esc(project.status)}</span>`,
    `${esc(project.progress)}%`,
    esc(project.owner),
    esc(project.revenueTarget),
    esc(project.currentRevenue),
    esc(project.nextAction),
    esc(project.risk)
  ]);
}

function taskRows(data, tasks = data.tasks) {
  return tasks.map(task => [
    `<strong>${esc(task.title)}</strong>`,
    esc(projectName(data, task.projectId)),
    esc(task.owner),
    esc(task.dueDate),
    `<span class="status ${String(task.status).toLowerCase().replaceAll(' ', '-')}">${esc(task.status)}</span>`,
    esc(task.priority),
    `${esc(task.progress)}%`,
    esc(task.notes)
  ]);
}

function cards(items) {
  if (!items.length) return '<div class="empty-state">No records available.</div>';
  return `<div class="detail-grid">${items.join('')}</div>`;
}

function buildDetail(detailType) {
  const data = getDetailData();
  const today = new Date().toISOString().slice(0, 10);
  const overdue = data.tasks.filter(task => task.dueDate < today && task.status !== 'Completed');

  const views = {
    'project-progress': ['Project Progress Details', table(['Project', 'SBU', 'Status', 'Progress', 'Owner', 'Revenue Target', 'Current Revenue', 'Next Action', 'Risk'], projectRows(data))],
    'project-status': ['Project Status Details', table(['Project', 'SBU', 'Status', 'Progress', 'Owner', 'Revenue Target', 'Current Revenue', 'Next Action', 'Risk'], projectRows(data))],
    'task-status': ['Task Status Details', table(['Task', 'Project', 'Owner', 'Due Date', 'Status', 'Priority', 'Progress', 'Notes'], taskRows(data))],
    'sbu-progress': ['SBU Progress Details', cards(data.sbus.map(sbu => {
      const projects = data.projects.filter(project => project.sbu === sbu.id);
      const avg = projects.length ? Math.round(projects.reduce((sum, project) => sum + Number(project.progress || 0), 0) / projects.length) : 0;
      return `<article class="detail-card"><h3>${esc(sbu.name)}</h3><p><strong>Average progress:</strong> ${avg}%</p><p><strong>Goal:</strong> ${esc(sbu.goal)}</p><p><strong>Projects:</strong> ${projects.map(project => esc(project.name)).join(', ') || 'None captured'}</p></article>`;
    }))],
    'revenue-kpis': ['Revenue & KPI Details', cards([
      ...data.kpis.map(kpi => `<article class="detail-card"><h3>${esc(kpi.label)}</h3><p><strong>Current value:</strong> ${esc(kpi.value)}</p></article>`),
      ...data.projects.map(project => `<article class="detail-card"><h3>${esc(project.name)}</h3><p><strong>Revenue target:</strong> ${esc(project.revenueTarget)}</p><p><strong>Current revenue:</strong> ${esc(project.currentRevenue)}</p><p><strong>Status:</strong> ${esc(project.status)}</p></article>`)
    ])],
    'sbus': ['Strategic Business Unit Details', cards(data.sbus.map(sbu => `<article class="detail-card"><h3>${esc(sbu.name)}</h3><p><strong>Goal:</strong> ${esc(sbu.goal)}</p><p><strong>Projects:</strong> ${(sbu.projects || []).map(esc).join(', ')}</p></article>`))],
    'projects': ['Full Project List', table(['Project', 'SBU', 'Status', 'Progress', 'Owner', 'Revenue Target', 'Current Revenue', 'Next Action', 'Risk'], projectRows(data))],
    'tasks': ['Full Task List', table(['Task', 'Project', 'Owner', 'Due Date', 'Status', 'Priority', 'Progress', 'Notes'], taskRows(data))],
    'kpis': ['Daily KPI Details', cards(data.kpis.map(kpi => `<article class="detail-card"><h3>${esc(kpi.label)}</h3><p><strong>Current value:</strong> ${esc(kpi.value)}</p></article>`))],
    'risks': ['Risk Register', table(['Project', 'SBU', 'Status', 'Progress', 'Owner', 'Revenue Target', 'Current Revenue', 'Next Action', 'Risk'], projectRows(data, data.projects.filter(project => project.risk || ['At Risk', 'Delayed'].includes(project.status))))],
    'weekly-review': ['Weekly CEO Review Checklist', cards(data.weeklyReview.map(item => `<article class="detail-card"><h3>${esc(item.label)}</h3><p><strong>Status:</strong> ${item.done ? 'Done' : 'Pending'}</p></article>`))],
    'Projects': ['All Projects', table(['Project', 'SBU', 'Status', 'Progress', 'Owner', 'Revenue Target', 'Current Revenue', 'Next Action', 'Risk'], projectRows(data))],
    'Tasks': ['All Tasks', table(['Task', 'Project', 'Owner', 'Due Date', 'Status', 'Priority', 'Progress', 'Notes'], taskRows(data))],
    'Completed Tasks': ['Completed Tasks', table(['Task', 'Project', 'Owner', 'Due Date', 'Status', 'Priority', 'Progress', 'Notes'], taskRows(data, data.tasks.filter(task => task.status === 'Completed')))],
    'Average Progress': ['Project Progress Details', table(['Project', 'SBU', 'Status', 'Progress', 'Owner', 'Revenue Target', 'Current Revenue', 'Next Action', 'Risk'], projectRows(data))],
    'At Risk / Delayed': ['At Risk / Delayed Projects', table(['Project', 'SBU', 'Status', 'Progress', 'Owner', 'Revenue Target', 'Current Revenue', 'Next Action', 'Risk'], projectRows(data, data.projects.filter(project => ['At Risk', 'Delayed'].includes(project.status))))],
    'High Priority Tasks': ['High Priority Tasks', table(['Task', 'Project', 'Owner', 'Due Date', 'Status', 'Priority', 'Progress', 'Notes'], taskRows(data, data.tasks.filter(task => task.priority === 'High')))],
    'Sponsors Follow-ups': ['Sponsor Follow-up KPI', cards(data.kpis.filter(kpi => kpi.label === 'Sponsor Follow-ups').map(kpi => `<article class="detail-card"><h3>${esc(kpi.label)}</h3><p><strong>Current value:</strong> ${esc(kpi.value)}</p><p>Use this to track sponsor engagement activity.</p></article>`))],
    'Cash Collected': ['Cash Collection KPI', cards(data.kpis.filter(kpi => kpi.label === 'Cash Collected').map(kpi => `<article class="detail-card"><h3>${esc(kpi.label)}</h3><p><strong>Current value:</strong> ${esc(kpi.value)}</p><p>Use this to track daily or weekly cash received.</p></article>`))],
    'overdue': ['Overdue Tasks', table(['Task', 'Project', 'Owner', 'Due Date', 'Status', 'Priority', 'Progress', 'Notes'], taskRows(data, overdue))]
  };

  return views[detailType] || ['Details', '<div class="empty-state">No drill-down view configured for this item yet.</div>'];
}

function openDetail(detailType) {
  const dialog = document.getElementById('detailDialog');
  const title = document.getElementById('detailTitle');
  const content = document.getElementById('detailContent');
  if (!dialog || !title || !content) return;
  const [heading, body] = buildDetail(detailType);
  title.textContent = heading;
  content.innerHTML = body;
  dialog.showModal();
}

document.addEventListener('click', event => {
  if (event.target.id === 'closeDetailBtn') document.getElementById('detailDialog')?.close();

  const linked = event.target.closest('.linked-block');
  if (linked && !event.target.closest('button, a, input, select, textarea, label')) {
    openDetail(linked.dataset.detail);
    return;
  }

  const summaryCard = event.target.closest('.summary-card');
  if (summaryCard) {
    const label = summaryCard.querySelector('h3')?.textContent?.trim();
    openDetail(label);
    return;
  }

  const kpiCard = event.target.closest('.kpi-card');
  if (kpiCard) {
    openDetail('kpis');
  }
});
