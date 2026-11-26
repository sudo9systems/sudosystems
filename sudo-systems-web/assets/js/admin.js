// ==================== 4. ADMIN DASHBOARD (#/admin) ====================
let selectedAdminLeadId = null;
let currentLabelFilter = 'ALL';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD_HASH = '19d8717903f44df1fa556c243c23309d32fa00368fd0fffa07c3915a3f5741f7';

async function sha256Hex(text) {
  if (window.crypto && window.crypto.subtle && window.TextEncoder) {
    const encoded = new TextEncoder().encode(text);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', encoded);
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  return '';
}

function isAdminRouteRequested() {
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  return path === '/admin' || path.endsWith('/admin') || hash === '#/admin' || hash === '#admin';
}

function navigateToAdmin(event) {
  if (event) event.preventDefault();
  window.location.hash = '#/admin';
  syncRouteView();
}

async function syncRouteView() {
  const adminView = document.getElementById('adminAppView');
  const publicView = document.getElementById('publicAppView');

  if (isAdminRouteRequested()) {
    publicView.classList.add('hidden');
    adminView.classList.remove('hidden');

    let authed = sessionStorage.getItem(ADMIN_AUTH_KEY) === 'true';
    if (supabaseClient) {
      const { data } = await supabaseClient.auth.getSession();
      authed = Boolean(data && data.session);
      if (authed) {
        sessionStorage.setItem(ADMIN_AUTH_KEY, 'true');
      } else {
        sessionStorage.removeItem(ADMIN_AUTH_KEY);
      }
    }

    const syncBadge = document.getElementById('adminSyncBadge');
    if (syncBadge) {
      syncBadge.textContent = supabaseClient ? 'Supabase Cloud' : 'Local Hashed Mode';
    }

    document.getElementById('adminLoginBox').classList.toggle('hidden', authed);
    document.getElementById('adminDashboardBox').classList.toggle('hidden', !authed);
    if (authed) {
      renderAdminDashboard();
      if (supabaseClient) {
        await syncLeadsFromCloud(false);
      }
    }
  } else {
    adminView.classList.add('hidden');
    publicView.classList.remove('hidden');
  }
}

function returnToPublicSite() {
  if (window.location.hash.toLowerCase().includes('admin')) {
    window.location.hash = '';
  } else if (window.location.pathname.toLowerCase().endsWith('/admin')) {
    window.history.pushState({}, '', '/');
  }
  syncRouteView();
}

async function handleAdminLogin(event) {
  event.preventDefault();
  const u = document.getElementById('adminUser').value.trim();
  const p = document.getElementById('adminPass').value;
  const errEl = document.getElementById('adminLoginError');

  if (supabaseClient) {
    const { error } = await supabaseClient.auth.signInWithPassword({
      email: u,
      password: p
    });
    if (error) {
      errEl.textContent = error.message || 'Invalid Supabase admin email or password.';
      errEl.classList.remove('hidden');
      return;
    }
    errEl.classList.add('hidden');
    sessionStorage.setItem(ADMIN_AUTH_KEY, 'true');
    document.getElementById('adminPass').value = '';
    await syncRouteView();
    return;
  }

  const saltedInput = `sudo-systems-kadapa:${p}`;
  const inputHash = await sha256Hex(saltedInput);

  if (u === ADMIN_USERNAME && inputHash === ADMIN_PASSWORD_HASH) {
    errEl.classList.add('hidden');
    sessionStorage.setItem(ADMIN_AUTH_KEY, 'true');
    document.getElementById('adminPass').value = '';
    syncRouteView();
  } else {
    errEl.textContent = 'Invalid admin credentials.';
    errEl.classList.remove('hidden');
  }
}

async function handleAdminLogout() {
  if (supabaseClient) {
    await supabaseClient.auth.signOut();
  }
  sessionStorage.removeItem(ADMIN_AUTH_KEY);
  document.getElementById('adminLoginForm').reset();
  syncRouteView();
}

function setAdminLabelFilter(filter) {
  currentLabelFilter = filter;
  document.querySelectorAll('.admin-filter-btn').forEach((btn) => {
    const active = btn.dataset.filter === filter;
    btn.classList.toggle('ring-2', active);
    btn.classList.toggle('ring-emerald-600', active);
  });
  renderAdminDashboard();
}

function getLabelBadgeClasses(label) {
  if (label === 'Hot') return 'bg-rose-100 text-rose-800 border border-rose-200';
  if (label === 'Warm') return 'bg-amber-100 text-amber-800 border border-amber-200';
  return 'bg-sky-100 text-sky-800 border border-sky-200';
}

function renderAdminDashboard() {
  const leads = getLeads();
  const sevenDaysAgo = Date.now() - 7 * 86400000;
  const hotThisWeek = leads.filter((l) => l.label === 'Hot' && (l.createdAt || 0) >= sevenDaysAgo).length;
  const warmCount = leads.filter((l) => l.label === 'Warm').length;
  const coldCount = leads.filter((l) => l.label === 'Cold').length;

  document.getElementById('statTotalLeads').textContent = String(leads.length);
  document.getElementById('statHotWeek').textContent = String(hotThisWeek);
  document.getElementById('statWarmLeads').textContent = String(warmCount);
  document.getElementById('statColdLeads').textContent = String(coldCount);

  const q = (document.getElementById('adminSearchInput').value || '').trim().toLowerCase();
  const filtered = leads.filter((l) => {
    const labelOk = currentLabelFilter === 'ALL' || l.label === currentLabelFilter;
    const searchOk =
      !q ||
      (l.name || '').toLowerCase().includes(q) ||
      (l.phone || '').toLowerCase().includes(q) ||
      (l.service || '').toLowerCase().includes(q) ||
      (l.summary || '').toLowerCase().includes(q) ||
      (l.probe1 || '').toLowerCase().includes(q);
    return labelOk && searchOk;
  });

  const tbody = document.getElementById('adminLeadsTableBody');
  const emptyEl = document.getElementById('adminEmptyState');
  tbody.innerHTML = '';

  if (filtered.length === 0) {
    emptyEl.classList.remove('hidden');
    return;
  }
  emptyEl.classList.add('hidden');

  filtered.forEach((lead) => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-emerald-50/50 transition-colors cursor-pointer';
    tr.onclick = () => openLeadDetailModal(lead.id);

    const dateStr = lead.createdAt
      ? new Date(lead.createdAt).toLocaleString('en-IN', {
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        })
      : '-';

    const issueSnippet = lead.probe1 && lead.probe1 !== 'No primary symptom captured'
      ? lead.probe1
      : (lead.summary || '').split('\n')[0] || '-';

    tr.innerHTML = `
      <td class="py-3.5 px-4 whitespace-nowrap">
        <span class="px-2.5 py-1 rounded-full text-xs font-extrabold ${getLabelBadgeClasses(lead.label)}">${escapeHtml(lead.label || 'Warm')}</span>
      </td>
      <td class="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">${escapeHtml(lead.name || '')}</td>
      <td class="py-3.5 px-4 font-mono-code text-xs text-slate-700 whitespace-nowrap">${escapeHtml(lead.phone || '')}</td>
      <td class="py-3.5 px-4 font-semibold text-slate-800 whitespace-nowrap">${escapeHtml(lead.service || '')}</td>
      <td class="py-3.5 px-4 text-slate-600 max-w-[14rem] truncate">${escapeHtml(lead.timing || '')}</td>
      <td class="py-3.5 px-4 text-slate-600 max-w-xs truncate">${escapeHtml(issueSnippet)}</td>
      <td class="py-3.5 px-4 text-xs text-slate-400 whitespace-nowrap">${escapeHtml(dateStr)}</td>
    `;
    tbody.appendChild(tr);
  });
}

function buildFriendlyIndianEnglishWhatsapp(lead) {
  const firstName = (lead.name || 'there').split(' ')[0];
  const issueNote = lead.probe1 && lead.probe1 !== 'No primary symptom captured'
    ? ` regarding "${lead.probe1}"`
    : '';
  const hoursNote = lead.timing ? ` during Working Hours (${lead.timing})` : ` during Working Hours (${SUDO_INFO.hours})`;

  return (
    `Namaste ${firstName} ji! Greetings from Sudo Systems, ${SUDO_INFO.address}.\n` +
    `Thank you for reaching out about ${lead.service || 'IT support'}${issueNote}${hoursNote}.\n` +
    `Our technician team is ready to assist you smoothly within our Working Hours (${SUDO_INFO.hours}) — please let us know what works best for you. Warm regards, Sudo Systems (${SUDO_INFO.phone} | ${SUDO_INFO.email}).`
  );
}

function openLeadDetailModal(leadId) {
  const lead = getLeads().find((item) => item.id === leadId);
  if (!lead) return;
  selectedAdminLeadId = lead.id;

  document.getElementById('detailLeadName').textContent = lead.name || 'Lead';
  const badge = document.getElementById('detailLeadBadge');
  badge.textContent = lead.label || 'Warm';
  badge.className = `px-2.5 py-0.5 rounded-full text-xs font-extrabold ${getLabelBadgeClasses(lead.label)}`;

  const createdText = lead.createdAt ? new Date(lead.createdAt).toLocaleString('en-IN') : '';
  document.getElementById('detailLeadMeta').textContent = `${lead.id} · ${lead.source || 'Ai Assistant'} · ${createdText}`;
  document.getElementById('detailLeadPhone').textContent = lead.phone || '-';
  document.getElementById('detailLeadService').textContent = lead.service || '-';
  document.getElementById('detailLeadTiming').textContent = lead.timing || '-';
  document.getElementById('detailLeadSummary').innerHTML = escapeHtml(lead.summary || '').replace(/\n/g, '<br>');

  const waMsg = buildFriendlyIndianEnglishWhatsapp(lead);
  const waTextarea = document.getElementById('detailWhatsappText');
  waTextarea.value = waMsg;

  const cleanPhone = (lead.phone || '').replace(/\D/g, '');
  const waTarget = cleanPhone.length >= 10
    ? (cleanPhone.startsWith('91') && cleanPhone.length >= 12 ? cleanPhone : `91${cleanPhone.slice(-10)}`)
    : SUDO_INFO.whatsappNumber;

  const waLink = document.getElementById('detailOpenWhatsappLink');
  waLink.href = `https://wa.me/${waTarget}?text=${encodeURIComponent(waMsg)}`;

  document.getElementById('copyStatusBadge').classList.add('hidden');
  document.getElementById('leadDetailModal').classList.remove('hidden');
}

function closeLeadDetailModal() {
  document.getElementById('leadDetailModal').classList.add('hidden');
  selectedAdminLeadId = null;
}

async function updateSelectedLeadLabel(newLabel) {
  if (!selectedAdminLeadId) return;
  const leads = getLeads();
  const idx = leads.findIndex((l) => l.id === selectedAdminLeadId);
  if (idx === -1) return;
  leads[idx].label = newLabel;
  saveLeads(leads);
  await updateLeadLabelInCloud(selectedAdminLeadId, newLabel);
  renderAdminDashboard();
  openLeadDetailModal(selectedAdminLeadId);
  showToast(`Label updated to ${newLabel}`);
}

function copyFollowUpMessage() {
  const textarea = document.getElementById('detailWhatsappText');
  textarea.select();
  try {
    document.execCommand('copy');
    document.getElementById('copyStatusBadge').classList.remove('hidden');
    showToast('WhatsApp follow-up copied');
  } catch (err) {
    console.error('Copy failed:', err);
  }
}
