const DASHBOARD_STORAGE_KEY = 'investhood_project_ops_dashboard_v1';
const palette = ['#1769e0', '#7b2cbf', '#f97316', '#059669', '#dc2626', '#0f766e', '#9333ea', '#0284c7'];

const fallbackChartData = {
  sbus: [
    { id: 'education', name: 'Education & Child Development' },
    { id: 'technology', name: 'Technology & Software' },
    { id: 'npo', name: 'Youth Skills & NPO' },
    { id: 'agro', name: 'Agro-Tech, Camps & Community' }
  ],
  projects: [
    { id: 'smartcreche', name: 'SmartRise Creche', sbu: 'education', status: 'At Risk', progress: 38, currentRevenue: 'R1,800 pm', revenueTarget: 'R135,000 pm' },
    { id: 'aftercare', name: 'Investhood Aftercare', sbu: 'education', status: 'In Progress', progress: 48, currentRevenue: 'R20,000 pm', revenueTarget: 'R120,000 pm' },
    { id: 'signa', name: 'Signa LMS', sbu: 'technology', status: 'In Progress', progress: 90, currentRevenue: 'Pending approval', revenueTarget: 'Contract + support revenue' },
    { id: 'recruitment', name: 'Recruitment App', sbu: 'technology', status: 'In Progress', progress: 88, currentRevenue: 'Pipeline', revenueTarget: '1 paying customer' },
    { id: 'sos-camps', name: 'SOS Coding Camps', sbu: 'npo', status: 'On Track', progress: 25, currentRevenue: 'Planning', revenueTarget: 'R50,000 - R150,000 per camp' },
    { id: 'farm', name: 'Dhlamini Farm & Farm Camps', sbu: 'agro', status: 'In Progress', progress: 22, currentRevenue: 'Pre-revenue', revenueTarget: 'Farm sales + camp income' }
  ],
  tasks: [
    { status: 'In Progress' },
    { status: 'Blocked' },
    { status: 'Not Started' },
    { status: 'In Progress' },
    { status: 'Not Started' },
    { status: 'In Progress' },
    { status: 'In Progress' },
    { status: 'Not Started' },
    { status: 'Not Started' }
  ],
  kpis: [
    { label: 'Leads Captured', value: 25 },
    { label: 'Follow-ups Done', value: 18 },
    { label: 'Sponsor Follow-ups', value: 12 },
    { label: 'Demos Booked', value: 5 },
    { label: 'Cash Collected', value: 'R18,450' }
  ]
};

function readDashboardData() {
  const saved = localStorage.getItem(DASHBOARD_STORAGE_KEY);
  if (!saved) return fallbackChartData;
  try {
    const parsed = JSON.parse(saved);
    return {
      sbus: parsed.sbus?.length ? parsed.sbus : fallbackChartData.sbus,
      projects: parsed.projects?.length ? parsed.projects : fallbackChartData.projects,
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : fallbackChartData.tasks,
      kpis: Array.isArray(parsed.kpis) ? parsed.kpis : fallbackChartData.kpis
    };
  } catch {
    return fallbackChartData;
  }
}

function escapeText(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function truncate(value, max = 24) {
  const text = String(value);
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function countBy(items, key) {
  return items.reduce((acc, item) => {
    const value = item[key] || 'Unknown';
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

function parseMoney(value) {
  const text = String(value ?? '0').replace(/,/g, '');
  const match = text.match(/R\s*([0-9]+(?:\.[0-9]+)?)/i);
  return match ? Number(match[1]) : 0;
}

function renderBarChart(targetId, data, options = {}) {
  const el = document.getElementById(targetId);
  if (!el) return;
  if (!data.length) {
    el.innerHTML = '<div class="empty-chart">No data available yet.</div>';
    return;
  }

  const width = 760;
  const rowHeight = options.rowHeight || 46;
  const height = Math.max(260, data.length * rowHeight + 56);
  const left = options.left || 210;
  const right = 76;
  const max = Math.max(...data.map(item => Number(item.value) || 0), options.max || 0, 1);
  const chartWidth = width - left - right;
  const rows = data.map((item, index) => {
    const y = 32 + index * rowHeight;
    const barWidth = Math.max(4, (Number(item.value) / max) * chartWidth);
    const color = item.color || palette[index % palette.length];
    const valueLabel = options.suffix ? `${item.value}${options.suffix}` : item.displayValue || item.value;
    return `
      <text x="12" y="${y + 19}" class="chart-label">${escapeText(truncate(item.label, 28))}</text>
      <line x1="${left}" y1="${y + 14}" x2="${width - right}" y2="${y + 14}" class="chart-axis" />
      <rect x="${left}" y="${y}" width="${barWidth}" height="28" fill="${color}" class="chart-bar" />
      <text x="${Math.min(width - right + 8, left + barWidth + 10)}" y="${y + 19}" class="chart-value">${escapeText(valueLabel)}</text>
    `;
  }).join('');

  el.innerHTML = `<svg class="chart-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeText(options.title || 'Bar chart')}">${rows}</svg>`;
}

function polarToCartesian(cx, cy, r, angleInDegrees) {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180;
  return { x: cx + (r * Math.cos(angleInRadians)), y: cy + (r * Math.sin(angleInRadians)) };
}

function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`;
}

function renderPieChart(targetId, counts, options = {}) {
  const el = document.getElementById(targetId);
  if (!el) return;
  const entries = Object.entries(counts).filter(([, value]) => value > 0);
  const total = entries.reduce((sum, [, value]) => sum + value, 0);
  if (!entries.length || total === 0) {
    el.innerHTML = '<div class="empty-chart">No data available yet.</div>';
    return;
  }

  let startAngle = 0;
  const slices = entries.map(([label, value], index) => {
    const angle = (value / total) * 360;
    const path = describeArc(150, 150, 118, startAngle, startAngle + angle);
    startAngle += angle;
    return `<path d="${path}" fill="${palette[index % palette.length]}" />`;
  }).join('');

  const legend = entries.map(([label, value], index) => {
    const pct = Math.round((value / total) * 100);
    return `<span class="legend-item"><span class="legend-dot" style="background:${palette[index % palette.length]}"></span>${escapeText(label)}: ${value} (${pct}%)</span>`;
  }).join('');

  el.innerHTML = `
    <div>
      <svg class="chart-svg" viewBox="0 0 300 300" role="img" aria-label="${escapeText(options.title || 'Pie chart')}">
        ${slices}
        <circle cx="150" cy="150" r="66" fill="#ffffff" />
        <text x="150" y="144" text-anchor="middle" class="chart-value" style="font-size:28px">${total}</text>
        <text x="150" y="168" text-anchor="middle" class="chart-label">Total</text>
      </svg>
      <div class="chart-legend">${legend}</div>
    </div>
  `;
}

function buildRevenueIndicators(data) {
  const cash = parseMoney(data.kpis.find(kpi => kpi.label === 'Cash Collected')?.value || 'R0');
  const leads = Number(data.kpis.find(kpi => kpi.label === 'Leads Captured')?.value || 0);
  const followUps = Number(data.kpis.find(kpi => kpi.label === 'Follow-ups Done')?.value || 0);
  const sponsorFollowUps = Number(data.kpis.find(kpi => kpi.label === 'Sponsor Follow-ups')?.value || 0);
  const demos = Number(data.kpis.find(kpi => kpi.label === 'Demos Booked')?.value || 0);
  const highProgressProjects = data.projects.filter(project => Number(project.progress) >= 75).length;

  return [
    { label: 'Cash Collected', value: cash, displayValue: `R${cash.toLocaleString()}`, color: '#059669' },
    { label: 'Leads Captured', value: leads, color: '#1769e0' },
    { label: 'Follow-ups Done', value: followUps, color: '#7b2cbf' },
    { label: 'Sponsor Follow-ups', value: sponsorFollowUps, color: '#f97316' },
    { label: 'Demos Booked', value: demos, color: '#0284c7' },
    { label: 'Projects above 75%', value: highProgressProjects, color: '#dc2626' }
  ];
}

function renderCharts() {
  const data = readDashboardData();

  renderBarChart('projectProgressChart', data.projects.map((project, index) => ({
    label: project.name,
    value: Number(project.progress) || 0,
    color: palette[index % palette.length]
  })), { max: 100, suffix: '%', title: 'Project progress by project' });

  renderPieChart('statusPieChart', countBy(data.projects, 'status'), { title: 'Project status mix' });
  renderPieChart('taskPieChart', countBy(data.tasks, 'status'), { title: 'Task status mix' });

  const sbuProgress = data.sbus.map((sbu, index) => {
    const projects = data.projects.filter(project => project.sbu === sbu.id);
    const avg = projects.length ? Math.round(projects.reduce((sum, project) => sum + Number(project.progress || 0), 0) / projects.length) : 0;
    return { label: sbu.name, value: avg, color: palette[index % palette.length] };
  });
  renderBarChart('sbuProgressChart', sbuProgress, { max: 100, suffix: '%', title: 'SBU average progress' });

  renderBarChart('revenueIndicatorChart', buildRevenueIndicators(data), { title: 'Revenue and KPI indicators', left: 190 });
}

function scheduleChartRefresh() {
  window.setTimeout(renderCharts, 120);
}

window.addEventListener('load', renderCharts);
document.addEventListener('click', scheduleChartRefresh);
document.addEventListener('change', scheduleChartRefresh);
document.addEventListener('submit', scheduleChartRefresh);
