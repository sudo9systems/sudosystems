// ==================== 5. UI INTERACTIONS & INITIALIZATION ====================
function toggleMobileMenu(forceState) {
  const menu = document.getElementById('mobileMenu');
  const menuBtn = document.getElementById('mobileMenuBtn');
  if (!menu) return;
  const shouldOpen = typeof forceState === 'boolean' ? forceState : menu.classList.contains('hidden');
  menu.classList.toggle('hidden', !shouldOpen);
  if (menuBtn) {
    menuBtn.setAttribute('aria-expanded', String(shouldOpen));
  }
}

const mobileMenuBtn = document.getElementById('mobileMenuBtn');
if (mobileMenuBtn) {
  mobileMenuBtn.addEventListener('click', () => toggleMobileMenu());
}

function showServiceDetails(serviceKey) {
  const resolved = resolveServiceCatalogEntry(serviceKey);
  const svc = resolved.entry;
  if (!svc) {
    showToast('Service details unavailable');
    return;
  }
  const modal = document.getElementById('serviceModal');
  if (!modal) return;

  const titleEl = document.getElementById('serviceModalTitle');
  const bodyEl = document.getElementById('serviceModalBody');
  if (titleEl) titleEl.textContent = svc.title;
  if (bodyEl) bodyEl.innerHTML = svc.modalHtml;

  const probeBtn = document.getElementById('serviceModalProbeBtn');
  if (probeBtn) {
    probeBtn.onclick = () => {
      closeServiceModal();
      openAiAssistant(resolved.key);
    };
  }

  modal.classList.remove('hidden');
  modal.classList.add('flex');
  modal.style.setProperty('display', 'flex', 'important');
  modal.scrollTop = 0;
  document.body.style.overflow = 'hidden';
}

function closeServiceModal() {
  const modal = document.getElementById('serviceModal');
  if (!modal) return;
  modal.classList.add('hidden');
  modal.classList.remove('flex');
  modal.style.setProperty('display', 'none', 'important');
  document.body.style.overflow = '';
}

document.addEventListener('click', function (e) {
  const learnMoreBtn = e.target.closest('[data-learn-more]');
  if (learnMoreBtn) {
    e.preventDefault();
    const key = learnMoreBtn.getAttribute('data-learn-more');
    if (key) showServiceDetails(key);
  }
});

const serviceModalBackdrop = document.getElementById('serviceModal');
if (serviceModalBackdrop) {
  serviceModalBackdrop.addEventListener('click', function (e) {
    if (e.target === this) {
      closeServiceModal();
    }
  });
}

function openSupportModal() {
  const modal = document.getElementById('supportFormModal');
  if (!modal) return;
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  document.body.style.overflow = 'hidden';
}

function closeSupportModal() {
  const modal = document.getElementById('supportFormModal');
  if (!modal) return;
  modal.classList.add('hidden');
  modal.classList.remove('flex');
  document.body.style.overflow = '';
  const form = document.getElementById('itHelpdeskForm');
  if (form) form.reset();
}

const supportModalBackdrop = document.getElementById('supportFormModal');
if (supportModalBackdrop) {
  supportModalBackdrop.addEventListener('click', function (e) {
    if (e.target === this) {
      closeSupportModal();
    }
  });
}

async function handleHelpdeskSubmit(event) {
  event.preventDefault();
  const formEl = event.target;
  const name = (formEl?.querySelector('[name="hdName"]')?.value || document.getElementById('hdName')?.value || '').trim();
  const rawPhone = (formEl?.querySelector('[name="hdPhone"]')?.value || document.getElementById('hdPhone')?.value || '').trim();
  const phoneCheck = normalizeAndValidatePhone(rawPhone);
  if (!phoneCheck.valid) {
    showToast(phoneCheck.reason);
    const phoneInput = formEl?.querySelector('[name="hdPhone"]') || document.getElementById('hdPhone');
    if (phoneInput) phoneInput.focus();
    return;
  }
  const phone = phoneCheck.formatted;
  const service = formEl?.querySelector('[name="hdService"]')?.value || document.getElementById('hdService')?.value || 'General IT Inquiry';
  const timing = (formEl?.querySelector('[name="hdTiming"]')?.value || document.getElementById('hdTiming')?.value || '').trim() || SUDO_INFO.hours;
  const description = (formEl?.querySelector('[name="hdDescription"]')?.value || document.getElementById('hdDescription')?.value || '').trim();

  const label = classifyLeadPriority(service, timing, description);
  const summary = [
    `${name || 'Visitor'} (${phone || 'N/A'}) booked ${service} for Working Hours: ${timing}.`,
    `Details: ${description || 'No additional details provided'}.`,
    `Captured via Book Your Service Now form (${label} priority) for Sudo Systems (${SUDO_INFO.address}).`
  ].join('\n');

  await addLead({
    id: 'LEAD-' + Math.floor(1000 + Math.random() * 9000),
    name: name || 'Kadapa Visitor',
    phone: phone || 'Not provided',
    service,
    timing,
    probe1: description || 'Service booking request',
    probe2: `Working Hours: ${timing}`,
    label,
    source: 'Book Service Form',
    createdAt: Date.now(),
    summary
  });

  if (sessionStorage.getItem(ADMIN_AUTH_KEY) === 'true') {
    renderAdminDashboard();
  }

  const waText =
    `*SUDO SYSTEMS KADAPA - SERVICE BOOKING*\n` +
    `Name: ${name}\n` +
    `Phone: ${phone}\n` +
    `Service: ${service}\n` +
    `Working Hours: ${timing}\n` +
    `Details: ${description}`;
  const waUrl = `https://wa.me/${SUDO_INFO.whatsappNumber}?text=${encodeURIComponent(waText)}`;

  if (formEl && typeof formEl.reset === 'function') {
    formEl.reset();
  }
  closeSupportModal();
  showToast(`Service booked & saved (${label}) · Opening WhatsApp`);
  window.open(waUrl, '_blank', 'noopener');
}

function formatCurrentIstTimeLabel() {
  try {
    return new Date().toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }) + ' IST';
  } catch (_err) {
    return new Date().toLocaleTimeString();
  }
}

function updateLiveTimeDisplay() {
  const timeLabel = formatCurrentIstTimeLabel();
  const footerEl = document.getElementById('footerYear');
  if (footerEl) {
    footerEl.textContent = String(new Date().getFullYear());
  }
  const chatSub = document.getElementById('aiChatSubtitle');
  if (chatSub) {
    chatSub.textContent = `Sudo Systems · Kadapa · ${timeLabel}`;
  }
}

function initHeroTypewriter() {
  const el = document.getElementById('heroTypewriter');
  if (!el) return;
  const topics = (el.getAttribute('data-topics') || '').split('|').map((s) => s.trim());
  const phrases = (el.getAttribute('data-phrases') || '').split('|').map((s) => s.trim()).filter(Boolean);
  const taglines = (el.getAttribute('data-taglines') || '').split('|').map((s) => s.trim());
  const topicEl = document.getElementById('heroTopicLabel');
  const taglineEl = document.getElementById('heroTypewriterTagline');
  if (!phrases.length) return;

  let phraseIdx = 0;
  let charIdx = 0;
  let deleting = false;

  function tick() {
    const currentPhrase = phrases[phraseIdx];
    if (topicEl && topics[phraseIdx]) {
      topicEl.textContent = topics[phraseIdx];
    }
    if (taglineEl && taglines[phraseIdx]) {
      taglineEl.textContent = taglines[phraseIdx];
    }

    if (!deleting) {
      charIdx++;
      el.textContent = currentPhrase.slice(0, charIdx);
      if (charIdx >= currentPhrase.length) {
        deleting = true;
        setTimeout(tick, 1650);
        return;
      }
      setTimeout(tick, 65);
    } else {
      charIdx--;
      el.textContent = currentPhrase.slice(0, Math.max(0, charIdx));
      if (charIdx <= 0) {
        deleting = false;
        phraseIdx = (phraseIdx + 1) % phrases.length;
        setTimeout(tick, 320);
        return;
      }
      setTimeout(tick, 35);
    }
  }

  tick();
}

updateLiveTimeDisplay();
setInterval(updateLiveTimeDisplay, 1000);
initHeroTypewriter();
seedInitialLeadsIfEmpty();
syncRouteView();
window.addEventListener('hashchange', syncRouteView);
window.addEventListener('popstate', syncRouteView);
