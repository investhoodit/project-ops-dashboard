const AI_DASHBOARD_KEY = 'investhood_project_ops_dashboard_v1';

function getAssistantData() {
  try {
    return JSON.parse(localStorage.getItem(AI_DASHBOARD_KEY)) || { sbus: [], projects: [], tasks: [], kpis: [] };
  } catch {
    return { sbus: [], projects: [], tasks: [], kpis: [] };
  }
}

function moneyOrText(value) {
  return value || 'Not captured';
}

function answerQuestion(question) {
  const data = getAssistantData();
  const q = question.toLowerCase();
  const projects = data.projects || [];
  const tasks = data.tasks || [];
  const sbus = data.sbus || [];

  if (!question.trim()) return 'Please type a question about an SBU, project, task, risk, KPI or revenue item.';

  if (q.includes('risk') || q.includes('at risk') || q.includes('delayed')) {
    const risky = projects.filter(project => ['At Risk', 'Delayed'].includes(project.status) || project.risk);
    if (!risky.length) return 'No major project risks are currently captured.';
    return risky.map(project => `• ${project.name}: ${project.status}. Risk: ${project.risk || 'No risk note captured.'}`).join('\n');
  }

  if (q.includes('overdue')) {
    const today = new Date().toISOString().slice(0, 10);
    const overdue = tasks.filter(task => task.dueDate < today && task.status !== 'Completed');
    return overdue.length ? overdue.map(task => `• ${task.title} (${task.owner}) was due ${task.dueDate}`).join('\n') : 'There are no overdue tasks based on the current local dashboard data.';
  }

  if (q.includes('task')) {
    const total = tasks.length;
    const completed = tasks.filter(task => task.status === 'Completed').length;
    const blocked = tasks.filter(task => task.status === 'Blocked').length;
    const inProgress = tasks.filter(task => task.status === 'In Progress').length;
    return `Task summary: ${total} total tasks, ${completed} completed, ${inProgress} in progress and ${blocked} blocked.`;
  }

  if (q.includes('progress')) {
    return projects.map(project => `• ${project.name}: ${project.progress}% (${project.status})`).join('\n');
  }

  if (q.includes('revenue') || q.includes('money') || q.includes('income')) {
    return projects.map(project => `• ${project.name}: target ${moneyOrText(project.revenueTarget)}, current ${moneyOrText(project.currentRevenue)}`).join('\n');
  }

  if (q.includes('sbu') || q.includes('business unit')) {
    return sbus.map(sbu => `• ${sbu.name}: ${sbu.goal}. Projects: ${(sbu.projects || []).join(', ')}`).join('\n');
  }

  const matchedProject = projects.find(project => q.includes(project.name.toLowerCase().split(' ')[0]) || project.name.toLowerCase().includes(q));
  if (matchedProject) {
    const projectTasks = tasks.filter(task => task.projectId === matchedProject.id);
    return `${matchedProject.name}\nStatus: ${matchedProject.status}\nProgress: ${matchedProject.progress}%\nOwner: ${matchedProject.owner}\nRevenue target: ${moneyOrText(matchedProject.revenueTarget)}\nNext action: ${matchedProject.nextAction}\nOpen tasks: ${projectTasks.filter(task => task.status !== 'Completed').length}`;
  }

  return 'I can answer questions such as: Which projects are at risk? What is the progress? What tasks are overdue? What is the revenue status? Which SBUs are active? For full AI reasoning, deploy on Vercel and connect an AI API route.';
}

document.addEventListener('submit', event => {
  if (event.target.id !== 'aiForm') return;
  event.preventDefault();
  const input = document.getElementById('aiQuestion');
  const output = document.getElementById('aiResponse');
  output.textContent = answerQuestion(input.value);
});
