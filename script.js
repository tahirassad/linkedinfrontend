const API_BASE = 'https://linkedinbackend-sj0l.onrender.com';

// ===== NAVIGATION =====
const navItems = document.querySelectorAll('.nav-item');
const sections = document.querySelectorAll('.section');
const pageTitle = document.getElementById('pageTitle');
const pageSubtitle = document.getElementById('pageSubtitle');

const pageMeta = {
  generate: { title: 'Comment Generator', subtitle: 'Craft professional LinkedIn comments powered by AI' },
  analyze:  { title: 'Viral Post Analyzer', subtitle: 'Score your posts and get data-driven improvement tips' },
  reply:    { title: 'Reply Generator', subtitle: 'Generate smart, engaging replies to any LinkedIn comment' },
  history:  { title: 'Saved History', subtitle: 'All your previously generated content in one place' },
};

navItems.forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    const section = item.dataset.section;
    navItems.forEach(n => n.classList.remove('active'));
    item.classList.add('active');
    sections.forEach(s => s.classList.add('hidden'));
    document.getElementById(`section-${section}`)?.classList.remove('hidden');
    pageTitle.textContent = pageMeta[section].title;
    pageSubtitle.textContent = pageMeta[section].subtitle;
    if (section === 'history') loadHistory();
  });
});

// ===== CHARACTER COUNTERS =====
function setupCharCount(textareaId, countId) {
  const ta = document.getElementById(textareaId);
  const ct = document.getElementById(countId);
  if (!ta || !ct) return;
  ta.addEventListener('input', () => {
    ct.textContent = `${ta.value.length} characters`;
  });
}
setupCharCount('generateInput', 'generateCount');
setupCharCount('analyzeInput',  'analyzeCount');
setupCharCount('replyInput',    'replyCount');

// ===== API STATUS CHECK =====
async function checkApiStatus() {
  const dot  = document.querySelector('.status-dot');
  const text = document.querySelector('.status-text');
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (res.ok) {
      dot.classList.add('online');
      dot.classList.remove('offline');
      text.textContent = 'API Connected';
    } else {
      throw new Error();
    }
  } catch {
    dot.classList.add('offline');
    dot.classList.remove('online');
    text.textContent = 'API Offline';
  }
}
checkApiStatus();

// ===== TOAST =====
let toastTimer;
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.add('hidden'), 3000);
}

// ===== LOADING STATE =====
function setLoading(btn, loading) {
  btn.disabled = loading;
  const icon = btn.querySelector('.btn-icon');
  if (loading) {
    btn.classList.add('loading');
    if (icon) icon.textContent = '↻';
  } else {
    btn.classList.remove('loading');
    const section = btn.id.replace('Btn', '');
    const icons = { generate: '✦', analyze: '◈', reply: '◎', refresh: '↻' };
    if (icon) icon.textContent = icons[section] || '✦';
  }
}

// ===== COPY BUTTONS =====
document.querySelectorAll('.copy-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const targetId = btn.dataset.target;
    const el = document.getElementById(targetId);
    if (!el) return;
    navigator.clipboard.writeText(el.textContent).then(() => {
      btn.classList.add('copied');
      btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Copied!`;
      setTimeout(() => {
        btn.classList.remove('copied');
        btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy`;
      }, 2000);
    }).catch(() => showToast('Failed to copy', 'error'));
  });
});

// ===== GENERATE COMMENT =====
document.getElementById('generateBtn').addEventListener('click', async () => {
  const btn = document.getElementById('generateBtn');
  const postText = document.getElementById('generateInput').value.trim();
  const resultBox = document.getElementById('generateResult');
  const resultText = document.getElementById('generateResultText');

  if (!postText) { showToast('Please paste a LinkedIn post first.', 'error'); return; }

  setLoading(btn, true);
  resultBox.classList.add('hidden');

  try {
    const res = await fetch(`${API_BASE}/comments/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postText }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || 'Failed');
    resultText.textContent = data.comment;
    resultBox.classList.remove('hidden');
    showToast('Comment generated successfully!');
  } catch (err) {
    showToast(err.message || 'Something went wrong.', 'error');
  } finally {
    setLoading(btn, false);
  }
});

// ===== ANALYZE POST =====
document.getElementById('analyzeBtn').addEventListener('click', async () => {
  const btn = document.getElementById('analyzeBtn');
  const postText = document.getElementById('analyzeInput').value.trim();
  const resultBox = document.getElementById('analyzeResult');

  if (!postText) { showToast('Please paste a LinkedIn post first.', 'error'); return; }

  setLoading(btn, true);
  resultBox.classList.add('hidden');

  try {
    const res = await fetch(`${API_BASE}/api/comments/analyze`, { // ✅ fixed path
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postText }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || 'Failed');

    const { viralityScore, hookStrength, suggestions } = data.analysis;

    document.getElementById('viralityScore').textContent = `${viralityScore}/10`;
    document.getElementById('hookStrength').textContent = hookStrength;
    document.getElementById('scoreFill').style.width = `${viralityScore * 10}%`;

    const list = document.getElementById('suggestionsList');
    list.innerHTML = '';
    suggestions.forEach(s => {
      const li = document.createElement('li');
      li.textContent = s;
      list.appendChild(li);
    });

    const summaryText = `Virality: ${viralityScore}/10 | Hook: ${hookStrength} | ${suggestions.join(' | ')}`;
    document.getElementById('analyzeResultText').textContent = summaryText;

    resultBox.classList.remove('hidden');
    showToast('Analysis complete!');
  } catch (err) {
    console.error('Error fetching:', err);
    showToast(err.message || 'Something went wrong.', 'error');
  } finally {
    setLoading(btn, false);
  }
});
// ===== GENERATE REPLY =====
document.getElementById('replyBtn').addEventListener('click', async () => {
  const btn = document.getElementById('replyBtn');
  const postText = document.getElementById('replyInput').value.trim();
  const resultBox = document.getElementById('replyResult');
  const resultText = document.getElementById('replyResultText');

  if (!postText) { showToast('Please paste a LinkedIn comment first.', 'error'); return; }

  setLoading(btn, true);
  resultBox.classList.add('hidden');

  try {
    const res = await fetch(`${API_BASE}/comments/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postText }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || 'Failed');
    resultText.textContent = data.reply;
    resultBox.classList.remove('hidden');
    showToast('Reply generated successfully!');
  } catch (err) {
    showToast(err.message || 'Something went wrong.', 'error');
  } finally {
    setLoading(btn, false);
  }
});

// ===== LOAD HISTORY =====
async function loadHistory() {
  const container = document.getElementById('historyList');
  container.innerHTML = `<div class="empty-state"><span class="empty-icon">↻</span><p>Loading history...</p></div>`;

  try {
    const res = await fetch(`${API_BASE}/comments`);
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || 'Failed');

    if (data.comments.length === 0) {
      container.innerHTML = `<div class="empty-state"><span class="empty-icon">▣</span><p>No history yet. Generate some comments first!</p></div>`;
      return;
    }

    container.innerHTML = '';
    data.comments.forEach(item => {
      const el = document.createElement('div');
      el.className = 'history-item';
      const date = new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      const typeLabel = { generate: 'Comment', analyze: 'Analysis', reply: 'Reply' }[item.type] || item.type;
      const badgeClass = `badge-${item.type}`;

      el.innerHTML = `
        <div class="history-item-header">
          <span class="history-type-badge ${badgeClass}">${typeLabel}</span>
          <span class="history-date">${date}</span>
        </div>
        <p class="history-post">"${item.postText.substring(0, 100)}${item.postText.length > 100 ? '…' : ''}"</p>
        <p class="history-comment">${item.generatedComment}</p>
      `;
      container.appendChild(el);
    });
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><span class="empty-icon">⚠</span><p>Failed to load history. Make sure the backend is running.</p></div>`;
  }
}

document.getElementById('refreshHistory').addEventListener('click', loadHistory);
