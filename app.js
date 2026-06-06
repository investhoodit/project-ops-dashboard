const STORAGE_KEY = 'investhood_project_ops_dashboard_v1';

const seedData = {
  sbus: [
    {
      id: 'education',
      name: 'Education & Child Development',
      goal: 'Recurring learner-based income',
      projects: ['SmartRise Creche', 'Charisma Creches', 'Investhood Aftercare', 'Charisma School Digitisation']
    },
    {
      id: 'technology',
      name: 'Technology & Software',
      goal: 'B2B contracts and software service revenue',
      projects: ['Signa LMS', 'Recruitment App', 'Investhood LMS', 'School Systems']
    },
    {
      id: 'npo',
      name: 'Youth Skills & NPO',
      goal: 'Grants, sponsors, equipment and community impact',
      projects: ['Investhood Skills Hub', 'SmartRise EdTech', 'SOS Programmes', 'Digital Innovation Programme']
    },
    {
      id: 'agro',
      name: 'Agro-Tech, Camps & Community',
      goal: 'Farm income, camps, events and community development',
      projects: ['Dhlamini Farm', 'Coding Camps', 'Robotics Camps', 'School Camps', 'Church Camps', 'Agro-tourism']
    }
  ],
  projects: [
    {
      id: 'smartcreche',
      name: 'SmartRise Creche',
      sbu: 'education',
      status: 'At Risk',
      priority: 'High',
      owner: 'Operations Manager',
      progress: 38,
      revenueTarget: 'R135,000 pm',
      currentRevenue: 'R1,800 pm',
      targetDate: '2026-09-01',
      nextAction: 'Run direct marketing drive and parent site visits',
      risk: 'Low learner registration numbers'
    },
    {
      id: 'aftercare',
      name: 'Investhood Aftercare',
      sbu: 'education',
      status: 'In Progress',
      priority: 'High',
      owner: 'Programme Lead',
      progress: 48,
      revenueTarget: 'R120,000 pm',
      currentRevenue: 'R20,000 pm',
      targetDate: '2026-07-01',
      nextAction: 'Launch app and start SOS lab visits',
      risk: 'Programme not fully delivering promised coding/robotics services yet'
    },
    {
      id: 'signa',
      name: 'Signa LMS',
      sbu: 'technology',
      status: 'In Progress',
      priority: 'High',
      owner: 'Technical Lead',
      progress: 90,
      revenueTarget: 'Contract + support revenue',
      currentRevenue: 'Pending approval',
      targetDate: '2026-07-01',
      nextAction: 'Complete testing, payroll automation and domain migration',
      risk: 'Pilot delay if testing or documentation is not signed off'
    },
    {
      id: 'recruitment',
      name: 'Recruitment App',
      sbu: 'technology',
      status: 'In Progress',
      priority: 'High',
      owner: 'Sales + Technical Lead',
      progress: 88,
      revenueTarget: '1 paying customer',
      currentRevenue: 'Pipeline',
      targetDate: '2026-07-31',
      nextAction: 'Book demos with learnership and recruitment companies',
      risk: 'Insufficient sales focus after build completion'
    },
    {
      id: 'sos-camps',
      name: 'SOS Coding Camps',
      sbu: 'npo',
      status: 'On Track',
      priority: 'High',
      owner: 'Programme Lead',
      progress: 25,
      revenueTarget: 'R50,000 - R150,000 per camp',
      currentRevenue: 'Planning',
      targetDate: '2026-07-15',
      nextAction: 'Publish camp calendar and send sponsor packs',
      risk: 'No confirmed sponsor or registration pipeline yet'
    },
    {
      id: 'farm',
      name: 'Dhlamini Farm & Farm Camps',
      sbu: 'agro',
      status: 'In Progress',
      priority: 'Medium',
      owner: 'Farm Lead',
      progress: 22,
      revenueTarget: 'Farm sales + camp income',
      currentRevenue: 'Pre-revenue',
      targetDate: '2026-09-30',
      nextAction: 'Complete access, livestock setup, first crop plan and camp concept',
      risk: 'Infrastructure and operating capital constraints'
    }
  ],
  tasks: [
    { id: crypto.randomUUID(), title: 'Complete SmartRise Creche curriculum and timetable', projectId: 'smartcreche', owner: 'BA Team', dueDate: '2026-06-30', status: 'In Progress', priority: 'High', progress: 55, notes: 'Must support parent marketing and compliance.' },
    { id: crypto.randomUUID(), title: 'Arrange social worker assessment for creche compliance', projectId: 'smartcreche', owner: 'Operations Manager', dueDate: '2026-06-12', status: 'Blocked', priority: 'High', progress: 20, notes: 'Required for social development funding process.' },
    { id: crypto.randomUUID(), title: 'Run weekly parent open day for SmartRise Creche', projectId: 'smartcreche', owner: 'Marketing Lead', dueDate: '2026-06-15', status: 'Not Started', priority: 'High', progress: 0, notes: 'Saturday open day with tours and registration promotion.' },
    { id: crypto.randomUUID(), title: 'Update Aftercare Management Plan', projectId: 'aftercare', owner: 'Programme Lead', dueDate: '2026-06-12', status: 'In Progress', priority: 'High', progress: 45, notes: 'Include homework, coding, robotics, AI, computer basics and SOPs.' },
    { id: crypto.randomUUID(), title: 'Schedule SOS computer lab visits', projectId: 'aftercare', owner: 'Operations Manager', dueDate: '2026-06-20', status: 'Not Started', priority: 'High', progress: 0, notes: 'Use code.org, Investhood LMS and STEMulator.' },
    { id: crypto.randomUUID(), title: 'Complete Signa payroll and timesheet automation', projectId: 'signa', owner: 'Technical Lead', dueDate: '2026-06-12', status: 'In Progress', priority: 'High', progress: 70, notes: 'Auto-calculate days attended and generate timesheets.' },
    { id: crypto.randomUUID(), title: 'Prepare Recruitment App client demo list', projectId: 'recruitment', owner: 'Sales Lead', dueDate: '2026-06-25', status: 'In Progress', priority: 'High', progress: 35, notes: 'Target learnership, internship and recruitment companies.' },
    { id: crypto.randomUUID(), title: 'Prepare SOS Coding Camp sponsor pack', projectId: 'sos-camps', owner: 'Programme Lead', dueDate: '2026-06-28', status: 'Not Started', priority: 'High', progress: 0, notes: 'Include coding, robotics, AI and FLL camp packages.' },
    { id: crypto.randomUUID(), title: 'Create Dhlamini Farm camp concept and price package', projectId: 'farm', owner: 'Farm Lead', dueDate: '2026-07-05', status: 'Not Started', priority: 'Medium', progress: 0, notes: 'School camps, church camps, coding camps and agro-tourism.' }
  ],
  weeklyReview: [
    { label: 'Learner growth reviewed', done: false },
    { label: 'App progress reviewed', done: false },
    { label: 'Demos booked and followed up', done: false },
    { label: 'Sponsor pipeline updated', done: false },
    { label: 'Cash flow and revenue checked', done: false },
    { label: 'Top risks escalated', done: false },
    { label: 'Next-week actions assigned', done: false }
  ],
  kpis: [
    { label: 'Leads Captured', value: 25 },
    { label: 'Follow-ups Done', value: 18 },
    { label: 'Active Dev Tasks', value: 32 },
    { label: 'Sponsor Follow-ups', value: 12 },
    { label: 'Staff Attendance', value: '92%' },
    { label: 'Cash Collected', value: 'R18,450' },
    { label: 'Demos Booked', value: 5 },
    { label: 'Overdue Tasks', value: 0 }
  ]
};

let state = loadState();

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return structuredClone(seedData);
  try { return JSON.parse(saved); } catch { return structuredClone(seedData); }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function statusClass(status) {
  return status.toLowerCase().replaceAll(' ', '-');
}

function projectById(id) {
  return state.projects.find(project => project.id === id);
}

function sbuById(id) {
  return state.sbus.find(sbu => sbu.id === id);
}

function renderSummary() {
  const totalProjects = state.projects.length;
  const totalTasks = state.tasks.length;
  const completedTasks = state.tasks.filter(task => task.status === 'Completed').length;
  const atRisk = state.projects.filter(project => ['At Risk', 'Delayed'].includes(project.status)).length;
  const avgProgress = Math.round(state.projects.reduce((sum, project) => sum + Number(project.progress || 0), 0) / totalProjects);
  const cards = [
    ['Projects', totalProjects],
    ['Tasks', totalTasks],
    ['Completed Tasks', completedTasks],
    ['Average Progress', `${avgProgress}%`],
    ['At Risk / Delayed', atRisk],
    ['High Priority Tasks', state.tasks.filter(task => task.priority === 'High').length],
    ['Sponsors Follow-ups', state.kpis.find(k => k.label === 'Sponsor Follow-ups')?.value ?? 0],
    ['Cash Collected', state.kpis.find(k => k.label === 'Cash Collected')?.value ?? 'R0']
  ];
  document.getElementById('summaryCards').innerHTML = cards.map(([label, value]) => `
    <article class="card summary-card"><h3>${label}</h3><strong>${value}</strong></article>
  `).join('');
}

function renderSbus() {
  document.getElementById('sbuGrid').innerHTML = state.sbus.map(sbu => `
    <article class="sbu-card">
      <h3>${sbu.name}</h3>
      <p><strong>Goal:</strong> ${sbu.goal}</p>
      <ul>${sbu.projects.map(project => `<li>${project}</li>`).join('')}</ul>
    </article>
  `).join('');
}

function renderFilters() {
  const filter = document.getElementById('sbuFilter');
  const selected = filter.value || 'all';
  filter.innerHTML = `<option value="all">All SBUs</option>` + state.sbus.map(sbu => `<option value="${sbu.id}">${sbu.name}</option>`).join('');
  filter.value = selected;
}

function renderProjects() {
  const filterValue = document.getElementById('sbuFilter').value || 'all';
  const projects = filterValue === 'all' ? state.projects : state.projects.filter(project => project.sbu === filterValue);
  document.getElementById('projectRows').innerHTML = projects.map(project => `
    <tr>
      <td><strong>${project.name}</strong><br><small>Due: ${project.targetDate}</small></td>
      <td>${sbuById(project.sbu)?.name ?? project.sbu}</td>
      <td><span class="status ${statusClass(project.status)}">${project.status}</span></td>
      <td><div class="progress-bar"><span style="width:${project.progress}%"></span></div><small>${project.progress}%</small></td>
      <td>${project.owner}</td>
      <td><strong>${project.revenueTarget}</strong><br><small>Current: ${project.currentRevenue}</small></td>
      <td>${project.nextAction}</td>
    </tr>
  `).join('');
}

function renderWeeklyReview() {
  document.getElementById('weeklyReview').innerHTML = state.weeklyReview.map((item, index) => `
    <label class="check-item"><input type="checkbox" ${item.done ? 'checked' : ''} data-review-index="${index}" /> <span>${item.label}</span></label>
  `).join('');
}

function renderTasks() {
  const statuses = ['Not Started', 'In Progress', 'Waiting for Feedback', 'Blocked', 'Completed'];
  document.getElementById('taskBoard').innerHTML = statuses.map(status => {
    const tasks = state.tasks.filter(task => task.status === status);
    return `
      <section class="task-column">
        <h3>${status} (${tasks.length})</h3>
        ${tasks.map(task => {
          const project = projectById(task.projectId);
          return `
            <article class="task-card">
              <h4>${task.title}</h4>
              <div class="task-meta">
                <span><strong>Project:</strong> ${project?.name ?? task.projectId}</span>
                <span><strong>Owner:</strong> ${task.owner}</span>
                <span><strong>Due:</strong> ${task.dueDate}</span>
                <span><strong>Priority:</strong> ${task.priority}</span>
                <span><strong>Progress:</strong> ${task.progress}%</span>
              </div>
              <div class="progress-bar"><span style="width:${task.progress}%"></span></div>
              <div class="task-actions">
                <button data-edit-task="${task.id}">Edit</button>
                <button data-complete-task="${task.id}">Complete</button>
              </div>
            </article>
          `;
        }).join('')}
      </section>
    `;
  }).join('');
}

function renderKpis() {
  document.getElementById('kpiGrid').innerHTML = state.kpis.map(kpi => `
    <article class="kpi-card"><small>${kpi.label}</small><strong>${kpi.value}</strong></article>
  `).join('');
}

function renderRisks() {
  document.getElementById('riskList').innerHTML = state.projects
    .filter(project => project.risk)
    .map(project => `<article class="risk"><strong>${project.name}</strong>${project.risk}</article>`)
    .join('');
}

function fillProjectOptions(selectedId = '') {
  const select = document.querySelector('select[name="projectId"]');
  select.innerHTML = state.projects.map(project => `<option value="${project.id}">${project.name}</option>`).join('');
  select.value = selectedId || state.projects[0]?.id;
}

function openTaskDialog(taskId = null) {
  const dialog = document.getElementById('taskDialog');
  const form = document.getElementById('taskForm');
  form.dataset.editingTaskId = taskId || '';
  const task = taskId ? state.tasks.find(item => item.id === taskId) : null;
  fillProjectOptions(task?.projectId);
  form.title.value = task?.title ?? '';
  form.owner.value = task?.owner ?? '';
  form.dueDate.value = task?.dueDate ?? new Date().toISOString().slice(0, 10);
  form.status.value = task?.status ?? 'Not Started';
  form.priority.value = task?.priority ?? 'Medium';
  form.progress.value = task?.progress ?? 0;
  form.notes.value = task?.notes ?? '';
  dialog.showModal();
}

function handleTaskSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form).entries());
  const task = {
    id: form.dataset.editingTaskId || crypto.randomUUID(),
    title: data.title,
    projectId: data.projectId,
    owner: data.owner,
    dueDate: data.dueDate,
    status: data.status,
    priority: data.priority,
    progress: Number(data.progress || 0),
    notes: data.notes || ''
  };
  const existingIndex = state.tasks.findIndex(item => item.id === task.id);
  if (existingIndex >= 0) state.tasks[existingIndex] = task;
  else state.tasks.push(task);
  saveState();
  document.getElementById('taskDialog').close();
  renderAll();
}

function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `project-ops-dashboard-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function importData(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = JSON.parse(reader.result);
      state = imported;
      saveState();
      renderAll();
      alert('Dashboard data imported successfully.');
    } catch {
      alert('Could not import the selected JSON file.');
    }
  };
  reader.readAsText(file);
}

function renderAll() {
  renderSummary();
  renderSbus();
  renderFilters();
  renderProjects();
  renderWeeklyReview();
  renderTasks();
  renderKpis();
  renderRisks();
}

document.addEventListener('click', event => {
  const editTaskId = event.target.dataset?.editTask;
  const completeTaskId = event.target.dataset?.completeTask;
  if (editTaskId) openTaskDialog(editTaskId);
  if (completeTaskId) {
    const task = state.tasks.find(item => item.id === completeTaskId);
    if (task) {
      task.status = 'Completed';
      task.progress = 100;
      saveState();
      renderAll();
    }
  }
});

document.addEventListener('change', event => {
  if (event.target.id === 'sbuFilter') renderProjects();
  if (event.target.dataset?.reviewIndex !== undefined) {
    state.weeklyReview[Number(event.target.dataset.reviewIndex)].done = event.target.checked;
    saveState();
  }
});

document.getElementById('addTaskBtn').addEventListener('click', () => openTaskDialog());
document.getElementById('cancelTaskBtn').addEventListener('click', () => document.getElementById('taskDialog').close());
document.getElementById('taskForm').addEventListener('submit', handleTaskSubmit);
document.getElementById('exportBtn').addEventListener('click', exportData);
document.getElementById('importInput').addEventListener('change', event => event.target.files[0] && importData(event.target.files[0]));
document.getElementById('resetDataBtn').addEventListener('click', () => {
  if (confirm('Reset dashboard to the original demo data?')) {
    state = structuredClone(seedData);
    saveState();
    renderAll();
  }
});

renderAll();
