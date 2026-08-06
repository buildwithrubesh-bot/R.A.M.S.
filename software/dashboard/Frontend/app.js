// ── Config ──────────────────────────────────────────────────
const API = 'http://localhost:5000';
const POLL_MS = 10_000;

// ── State ───────────────────────────────────────────────────
let trendChart = null;
let donutChart = null;
let analyticsLine = null;
let statusBar = null;
let liveTimer = null;
let recentSubmissions = [];

// ── Helpers ─────────────────────────────────────────────────
function fmt(dt) {
  if (!dt) return '—';
  const d = new Date(dt);
  return d.toLocaleString('en-IN', { month:'short', day:'2-digit', hour:'2-digit', minute:'2-digit', second:'2-digit' });
}
function fmtTemp(v) { return `${parseFloat(v).toFixed(1)}°C`; }
function classify(t) {
  const n = parseFloat(t);
  if (n >= 90) return 'CRITICAL';
  if (n >= 70) return 'WARNING';
  return 'NORMAL';
}
function badgeHTML(status) {
  const icons = { NORMAL: '✓', WARNING: '⚠', CRITICAL: '🔥' };
  return `<span class="badge ${status}">${icons[status] || ''} ${status}</span>`;
}
function toast(msg, type = 'info') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  document.getElementById('toastContainer').appendChild(el);
  setTimeout(() => el.remove(), 3500);
}
async function apiFetch(path) {
  const res = await fetch(`${API}${path}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ── Health check ────────────────────────────────────────────
async function checkHealth() {
  const dot = document.getElementById('statusDot');
  const txt = document.getElementById('statusText');
  try {
    const data = await apiFetch('/health');
    dot.className = 'status-dot ' + (data.status === 'healthy' ? 'healthy' : 'error');
    txt.textContent = data.status === 'healthy' ? 'Connected' : 'Degraded';
  } catch {
    dot.className = 'status-dot error';
    txt.textContent = 'Offline';
  }
}

// ── Last-updated stamp ───────────────────────────────────────
function stampNow() {
  document.getElementById('lastUpdated').textContent =
    'Updated ' + new Date().toLocaleTimeString('en-IN');
}

// ── Navigation ───────────────────────────────────────────────
function navigate(view) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('view-' + view)?.classList.add('active');
  document.getElementById('nav-' + view)?.classList.add('active');
  const titles = {
    dashboard: ['Dashboard', 'Overview & KPIs'],
    live: ['Live Monitor', 'Real-time axle readings'],
    history: ['History', 'Browse all temperature logs'],
    alerts: ['Alerts', 'Warning & Critical events'],
    analytics: ['Analytics', 'Summary & trends'],
    submit: ['Submit Reading', 'Manual data entry'],
  };
  const [title, sub] = titles[view] || ['RAMS', ''];
  document.getElementById('pageTitle').textContent = title;
  document.getElementById('pageSubtitle').textContent = sub;
  if (view === 'live') startLive(); else stopLive();
  if (view === 'dashboard') loadDashboard();
  if (view === 'history') loadHistory();
  if (view === 'alerts') loadAlerts();
  if (view === 'analytics') loadAnalytics();
}

// ────────────────────────────────────────────────────────────
// DASHBOARD
// ────────────────────────────────────────────────────────────
async function loadDashboard() {
  await Promise.all([loadKPIs(), loadLatest()]);
}

async function loadKPIs() {
  try {
    const { summary, trend } = await apiFetch('/api/analytics/summary');
    document.getElementById('kpiTotal').textContent   = summary.total_logs.toLocaleString();
    document.getElementById('kpiNormal').textContent  = summary.normal_count.toLocaleString();
    document.getElementById('kpiWarning').textContent = summary.warning_count.toLocaleString();
    document.getElementById('kpiCritical').textContent= summary.critical_count.toLocaleString();
    document.getElementById('kpiAvgTemp').textContent = fmtTemp(summary.average_temperature);
    document.getElementById('kpiMaxTemp').textContent = fmtTemp(summary.max_temperature);

    // Update alert badge
    const badge = document.getElementById('alertBadge');
    const alertN = summary.warning_count + summary.critical_count;
    badge.textContent = alertN > 0 ? alertN : '';

    drawTrendChart(trend);
    drawDonutChart(summary);
    stampNow();
  } catch (e) {
    toast('Failed to load analytics: ' + e.message, 'error');
  }
}

async function loadLatest() {
  const tbody = document.getElementById('latestTbody');
  try {
    const { data } = await apiFetch('/api/temperature/latest?limit=20');
    if (!data.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty-cell">No data available.</td></tr>';
      return;
    }
    tbody.innerHTML = data.map(r => `
      <tr>
        <td>${r.train_id}</td>
        <td>${r.coach_id}</td>
        <td>${r.axle_id}</td>
        <td style="color:${tempColor(r.temperature)};font-weight:700">${fmtTemp(r.temperature)}</td>
        <td>${badgeHTML(r.status)}</td>
        <td style="color:var(--text2)">${fmt(r.timestamp)}</td>
      </tr>`).join('');
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-cell">Error: ${e.message}</td></tr>`;
  }
}

function tempColor(t) {
  const n = parseFloat(t);
  if (n >= 90) return 'var(--critical)';
  if (n >= 70) return 'var(--warning)';
  return 'var(--normal)';
}

// ── Charts ────────────────────────────────────────────────────
function chartColors() {
  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  return {
    grid: isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.07)',
    tick: isDark ? '#8b949e' : '#656d76',
  };
}

function drawTrendChart(trend) {
  const labels = trend.map(r => {
    const d = new Date(r.minute);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  });
  const avgData = trend.map(r => r.average_temperature);
  const maxData = trend.map(r => r.max_temperature);
  const meta = document.getElementById('trendMeta');
  meta.textContent = trend.length ? `${trend.length} data points` : 'No data in last hour';

  const ctx = document.getElementById('trendChart').getContext('2d');
  const { grid, tick } = chartColors();
  if (trendChart) trendChart.destroy();
  trendChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'Avg °C', data: avgData, borderColor: '#58a6ff', backgroundColor: 'rgba(88,166,255,.1)', fill: true, tension: 0.4, pointRadius: 2 },
        { label: 'Max °C', data: maxData, borderColor: '#f85149', backgroundColor: 'rgba(248,81,73,.08)', fill: true, tension: 0.4, pointRadius: 2, borderDash: [5,3] },
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { labels: { color: tick, font: { size: 12 }, boxWidth: 12 } } },
      scales: {
        x: { ticks: { color: tick, maxTicksLimit: 8 }, grid: { color: grid } },
        y: { ticks: { color: tick }, grid: { color: grid } }
      }
    }
  });
}

function drawDonutChart(summary) {
  const ctx = document.getElementById('donutChart').getContext('2d');
  const { tick } = chartColors();
  if (donutChart) donutChart.destroy();
  donutChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Normal', 'Warning', 'Critical'],
      datasets: [{ data: [summary.normal_count, summary.warning_count, summary.critical_count],
        backgroundColor: ['rgba(63,185,80,.8)', 'rgba(210,153,34,.8)', 'rgba(248,81,73,.8)'],
        borderColor: 'transparent', hoverOffset: 6 }]
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '70%',
      plugins: { legend: { display: false } }
    }
  });
  const legend = document.getElementById('donutLegend');
  const colors = ['#3fb950','#d29922','#f85149'];
  const labels = ['Normal','Warning','Critical'];
  const vals   = [summary.normal_count, summary.warning_count, summary.critical_count];
  legend.innerHTML = labels.map((l, i) => `
    <div class="legend-item">
      <span class="legend-dot" style="background:${colors[i]}"></span>
      <span>${l}</span>
      <span style="margin-left:auto;font-weight:600">${vals[i]}</span>
    </div>`).join('');
}

// ────────────────────────────────────────────────────────────
// LIVE MONITOR
// ────────────────────────────────────────────────────────────
async function loadLive() {
  const grid = document.getElementById('axleGrid');
  try {
    const { data } = await apiFetch('/api/temperature/latest');
    if (!data.length) { grid.innerHTML = '<div class="loading-placeholder">No live readings yet.</div>'; return; }
    grid.innerHTML = data.map(r => {
      const pct = Math.min((parseFloat(r.temperature) / 120) * 100, 100);
      const highClass = pct > 58 ? 'high' : '';
      return `<div class="axle-card ${r.status}">
        <div class="axle-card-id">${r.train_id} › ${r.coach_id} › ${r.axle_id}</div>
        <div class="axle-temp">${fmtTemp(r.temperature)}</div>
        <div class="therm-bar"><div class="therm-fill ${highClass}" style="width:${pct}%"></div></div>
        <div class="axle-card-footer">
          ${badgeHTML(r.status)}
          <span class="axle-time">${fmt(r.timestamp)}</span>
        </div>
      </div>`;
    }).join('');
    stampNow();
  } catch (e) {
    grid.innerHTML = `<div class="loading-placeholder">Error: ${e.message}</div>`;
  }
}
function startLive() { loadLive(); liveTimer = setInterval(loadLive, POLL_MS); }
function stopLive()  { clearInterval(liveTimer); liveTimer = null; }

// ────────────────────────────────────────────────────────────
// HISTORY
// ────────────────────────────────────────────────────────────
async function loadHistory(params = {}) {
  const tbody = document.getElementById('historyTbody');
  tbody.innerHTML = '<tr><td colspan="7" class="loading-cell"><span class="spinner"></span> Loading…</td></tr>';
  const qs = new URLSearchParams();
  if (params.train_id) qs.set('train_id', params.train_id);
  if (params.coach_id) qs.set('coach_id', params.coach_id);
  if (params.axle_id)  qs.set('axle_id',  params.axle_id);
  qs.set('limit', params.limit || 100);
  try {
    const { data } = await apiFetch(`/api/temperature/history?${qs}`);
    document.getElementById('historyCount').textContent = `${data.length} records`;
    if (!data.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="empty-cell">No records found.</td></tr>';
      return;
    }
    tbody.innerHTML = data.map((r, i) => `
      <tr>
        <td style="color:var(--text3)">${r.id}</td>
        <td>${r.train_id}</td>
        <td>${r.coach_id}</td>
        <td>${r.axle_id}</td>
        <td style="color:${tempColor(r.temperature)};font-weight:700">${fmtTemp(r.temperature)}</td>
        <td>${badgeHTML(r.status)}</td>
        <td style="color:var(--text2)">${fmt(r.timestamp)}</td>
      </tr>`).join('');
    stampNow();
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty-cell">Error: ${e.message}</td></tr>`;
  }
}

// ────────────────────────────────────────────────────────────
// ALERTS
// ────────────────────────────────────────────────────────────
async function loadAlerts() {
  const list = document.getElementById('alertsList');
  list.innerHTML = '<div class="loading-placeholder"><span class="spinner"></span> Loading…</div>';
  try {
    const { data } = await apiFetch('/api/alerts?limit=50');
    document.getElementById('alertsCount').textContent = `${data.length} alerts`;
    if (!data.length) {
      list.innerHTML = '<div class="loading-placeholder" style="color:var(--normal)">✓ No active alerts — all readings are NORMAL.</div>';
      return;
    }
    list.innerHTML = data.map(r => `
      <div class="alert-item ${r.status}">
        <div class="alert-icon"><i data-lucide="${r.status === 'CRITICAL' ? 'flame' : 'alert-triangle'}"></i></div>
        <div class="alert-body">
          <div class="alert-title">${r.train_id} › ${r.coach_id} › ${r.axle_id} — ${fmtTemp(r.temperature)} ${badgeHTML(r.status)}</div>
          <div class="alert-meta">ID #${r.id} &nbsp;·&nbsp; ${fmt(r.timestamp)}</div>
        </div>
      </div>`).join('');
    lucide.createIcons();
    stampNow();
  } catch (e) {
    list.innerHTML = `<div class="loading-placeholder">Error: ${e.message}</div>`;
  }
}

// ────────────────────────────────────────────────────────────
// ANALYTICS
// ────────────────────────────────────────────────────────────
async function loadAnalytics() {
  try {
    const { summary, trend } = await apiFetch('/api/analytics/summary');
    drawGauge(summary);
    drawStatusBar(summary);
    drawAnalyticsLine(trend);
  } catch (e) {
    toast('Analytics error: ' + e.message, 'error');
  }
}

function drawGauge(s) {
  const canvas = document.getElementById('gaugeCanvas');
  const ctx = canvas.getContext('2d');
  const total = s.total_logs || 1;
  const pct = s.normal_count / total;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // Arc background
  ctx.beginPath();
  ctx.arc(120, 120, 90, Math.PI, 2 * Math.PI);
  ctx.lineWidth = 18;
  ctx.strokeStyle = 'var(--border)';
  ctx.stroke();
  // Arc fill
  const endAngle = Math.PI + pct * Math.PI;
  const grad = ctx.createLinearGradient(0, 0, 240, 0);
  grad.addColorStop(0, '#f85149');
  grad.addColorStop(0.5, '#d29922');
  grad.addColorStop(1, '#3fb950');
  ctx.beginPath();
  ctx.arc(120, 120, 90, Math.PI, endAngle);
  ctx.strokeStyle = grad;
  ctx.lineCap = 'round';
  ctx.stroke();
  document.getElementById('gaugeLabel').textContent = `${(pct * 100).toFixed(1)}%`;
}

function drawStatusBar(s) {
  const ctx = document.getElementById('statusBarChart').getContext('2d');
  const { grid, tick } = chartColors();
  if (statusBar) statusBar.destroy();
  statusBar = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Normal', 'Warning', 'Critical'],
      datasets: [{ data: [s.normal_count, s.warning_count, s.critical_count],
        backgroundColor: ['rgba(63,185,80,.7)', 'rgba(210,153,34,.7)', 'rgba(248,81,73,.7)'],
        borderRadius: 6, borderSkipped: false }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { x: { ticks: { color: tick }, grid: { display: false } }, y: { ticks: { color: tick }, grid: { color: grid } } }
    }
  });
}

function drawAnalyticsLine(trend) {
  const ctx = document.getElementById('analyticsLineChart').getContext('2d');
  const { grid, tick } = chartColors();
  if (analyticsLine) analyticsLine.destroy();
  const labels = trend.map(r => new Date(r.minute).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' }));
  analyticsLine = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'Avg °C', data: trend.map(r => r.average_temperature), borderColor: '#58a6ff', tension: 0.4, fill: false, pointRadius: 3 },
        { label: 'Max °C', data: trend.map(r => r.max_temperature), borderColor: '#f85149', tension: 0.4, fill: false, pointRadius: 3, borderDash: [5,3] },
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { labels: { color: tick, font: { size: 12 }, boxWidth: 12 } } },
      scales: { x: { ticks: { color: tick, maxTicksLimit: 10 }, grid: { color: grid } }, y: { ticks: { color: tick }, grid: { color: grid } } }
    }
  });
}

// ────────────────────────────────────────────────────────────
// SUBMIT READING
// ────────────────────────────────────────────────────────────
function renderRecentTable() {
  const tbody = document.getElementById('recentTbody');
  if (!recentSubmissions.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-cell">No submissions yet.</td></tr>';
    return;
  }
  tbody.innerHTML = recentSubmissions.map(r => `
    <tr>
      <td>${r.train_id}</td><td>${r.coach_id}</td><td>${r.axle_id}</td>
      <td style="color:${tempColor(r.temperature)};font-weight:700">${fmtTemp(r.temperature)}</td>
      <td>${badgeHTML(r.status)}</td>
      <td style="color:var(--text2)">${fmt(r.timestamp)}</td>
    </tr>`).join('');
}

// ── Temperature preview ─────────────────────────────────────
document.getElementById('sTemp').addEventListener('input', function () {
  const val = parseFloat(this.value);
  const preview = document.getElementById('tempPreview');
  if (isNaN(val)) { preview.style.display = 'none'; return; }
  preview.style.display = 'flex';
  document.getElementById('previewVal').textContent = fmtTemp(val);
  const status = classify(val);
  const statusEl = document.getElementById('previewStatus');
  statusEl.textContent = status;
  statusEl.className = `badge preview-status ${status}`;
  const therm = document.getElementById('previewTherm');
  const pct = Math.min((val / 120) * 100, 100);
  const color = { NORMAL: 'var(--normal)', WARNING: 'var(--warning)', CRITICAL: 'var(--critical)' }[status];
  therm.style.setProperty('--fill-h', pct + '%');
  therm.style.setProperty('--fill-c', color);
  therm.style.cssText += `; background: linear-gradient(to top, ${color} ${pct}%, var(--border) ${pct}%)`;
});

document.getElementById('submitForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  const btn = document.getElementById('submitBtn');
  const fb  = document.getElementById('formFeedback');
  fb.className = 'form-feedback'; fb.style.display = 'none';

  const train_id    = document.getElementById('sTrain').value.trim();
  const coach_id    = document.getElementById('sCoach').value.trim();
  const axle_id     = document.getElementById('sAxle').value.trim();
  const temperature = parseFloat(document.getElementById('sTemp').value);

  if (!train_id || !coach_id || !axle_id || isNaN(temperature)) {
    fb.textContent = 'All fields are required.';
    fb.className = 'form-feedback error';
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Submitting…';
  try {
    const res = await fetch(`${API}/api/temperature`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ train_id, coach_id, axle_id, temperature })
    });
    if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Server error'); }
    const { data } = await res.json();
    toast(`Logged ${fmtTemp(data.temperature)} — ${data.status}`, 'success');
    fb.textContent = `✓ Stored as ${data.status} (ID #${data.id})`;
    fb.className = 'form-feedback success';
    recentSubmissions.unshift(data);
    if (recentSubmissions.length > 20) recentSubmissions.pop();
    renderRecentTable();
    this.reset();
    document.getElementById('tempPreview').style.display = 'none';
  } catch (err) {
    fb.textContent = '✗ ' + err.message;
    fb.className = 'form-feedback error';
    toast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i data-lucide="send"></i> Submit Reading';
    lucide.createIcons();
  }
});

// ────────────────────────────────────────────────────────────
// GLOBAL SEARCH
// ────────────────────────────────────────────────────────────
document.getElementById('globalSearch').addEventListener('keydown', function (e) {
  if (e.key === 'Enter' && this.value.trim()) {
    const q = this.value.trim();
    navigate('history');
    // Detect what the user typed and pre-fill filters
    document.getElementById('fTrain').value = q;
    loadHistory({ train_id: q, limit: 100 });
    this.value = '';
  }
});

// ────────────────────────────────────────────────────────────
// SIDEBAR TOGGLE
// ────────────────────────────────────────────────────────────
document.getElementById('sidebarToggle').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('collapsed');
  document.getElementById('mainWrapper').classList.toggle('expanded');
});

// ── Nav links ───────────────────────────────────────────────
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', e => {
    e.preventDefault();
    navigate(item.dataset.view);
  });
});

// ── "View all latest" shortcut ───────────────────────────────
document.getElementById('viewAllLatest').addEventListener('click', () => navigate('live'));

// ── History filters ──────────────────────────────────────────
document.getElementById('applyHistoryFilter').addEventListener('click', () => {
  loadHistory({
    train_id: document.getElementById('fTrain').value.trim(),
    coach_id: document.getElementById('fCoach').value.trim(),
    axle_id:  document.getElementById('fAxle').value.trim(),
    limit:    document.getElementById('fLimit').value,
  });
});
document.getElementById('clearHistoryFilter').addEventListener('click', () => {
  ['fTrain','fCoach','fAxle'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('fLimit').value = '100';
  loadHistory();
});

// ── Refresh button ───────────────────────────────────────────
document.getElementById('refreshBtn').addEventListener('click', () => {
  const active = document.querySelector('.view.active')?.id?.replace('view-', '');
  if (active === 'dashboard') loadDashboard();
  else if (active === 'live') loadLive();
  else if (active === 'history') loadHistory();
  else if (active === 'alerts') loadAlerts();
  else if (active === 'analytics') loadAnalytics();
  toast('Refreshed', 'info');
});

// ── Theme toggle ─────────────────────────────────────────────
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('rams-theme', theme);
  document.getElementById('themeIconSun').style.display  = theme === 'dark' ? 'block' : 'none';
  document.getElementById('themeIconMoon').style.display = theme === 'light'? 'block' : 'none';
  // Redraw charts with new colours
  setTimeout(() => {
    const active = document.querySelector('.view.active')?.id?.replace('view-', '');
    if (active === 'dashboard') loadDashboard();
    if (active === 'analytics') loadAnalytics();
  }, 50);
}
document.getElementById('themeToggle').addEventListener('click', () => {
  const cur = document.documentElement.getAttribute('data-theme');
  applyTheme(cur === 'dark' ? 'light' : 'dark');
});

// ── Auto-refresh KPIs every minute ──────────────────────────
setInterval(() => {
  const active = document.querySelector('.view.active')?.id?.replace('view-', '');
  if (active === 'dashboard') loadKPIs();
}, 60_000);

// ── Init ─────────────────────────────────────────────────────
(async function init() {
  const saved = localStorage.getItem('rams-theme') || 'dark';
  applyTheme(saved);
  lucide.createIcons();
  await checkHealth();
  setInterval(checkHealth, 30_000);
  navigate('dashboard');
})();
