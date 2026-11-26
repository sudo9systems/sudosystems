// ==================== 3. AI ASSISTANT DIAGNOSTIC CHAT ====================
const chatState = {
  step: 'START',
  service: null,
  serviceKey: null,
  probe1: '',
  probe2: '',
  name: '',
  phone: '',
  timing: '',
  qaLog: []
};

const WORKING_HOURS_SLOTS = [
  'Morning · 10:00 AM',
  'Morning · 11:00 AM',
  'Morning · 12:00 PM',
  'Afternoon · 1:00 PM',
  'Afternoon · 2:00 PM',
  'Afternoon · 3:00 PM',
  'Afternoon · 4:00 PM',
  'Evening · 5:00 PM',
  'Evening · 6:00 PM',
  'Evening · 7:00 PM',
  'Evening · 8:00 PM'
];

function resetChatState() {
  chatState.step = 'QA_OR_SERVICE';
  chatState.service = null;
  chatState.serviceKey = null;
  chatState.probe1 = '';
  chatState.probe2 = '';
  chatState.name = '';
  chatState.phone = '';
  chatState.timing = '';
  chatState.qaLog = [];
}

function appendBotMessage(htmlContent) {
  const container = document.getElementById('aiChatMessages');
  if (!container) return;
  const row = document.createElement('div');
  row.className = 'flex items-start gap-2';
  row.innerHTML = `
    ${renderAssistantAvatarHtml('w-7 h-7 mt-0.5')}
    <div class="bg-white border border-slate-200 text-slate-800 rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed shadow-xs max-w-[85%]">
      ${htmlContent}
    </div>
  `;
  container.appendChild(row);
  container.scrollTop = container.scrollHeight;
}

function appendUserMessage(plainText) {
  const container = document.getElementById('aiChatMessages');
  if (!container) return;
  const row = document.createElement('div');
  row.className = 'flex justify-end';
  row.innerHTML = `
    <div class="bg-emerald-700 text-white rounded-2xl rounded-tr-sm px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed shadow-xs max-w-[85%]">
      ${escapeHtml(plainText)}
    </div>
  `;
  container.appendChild(row);
  container.scrollTop = container.scrollHeight;
}

function setQuickChips(chips) {
  const wrap = document.getElementById('aiQuickChips');
  if (!wrap) return;
  wrap.innerHTML = '';
  (chips || []).forEach((label) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'px-2.5 py-1 rounded-full bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-900 border border-slate-200 text-[11px] font-bold transition-colors cursor-pointer';
    btn.textContent = label;
    btn.onclick = () => {
      if (label.startsWith('Start ') && label.endsWith(' Check')) {
        const svcName = label.replace(/^Start\s+/, '').replace(/\s+Check$/, '');
        const resolved = resolveServiceCatalogEntry(svcName);
        appendUserMessage(label);
        beginServiceProbing(resolved.key);
        return;
      }
      processAiUserInput(label);
    };
    wrap.appendChild(btn);
  });
}

function openAiAssistant(preselectedService, forceRestart) {
  const win = document.getElementById('aiChatWindow');
  const launcher = document.getElementById('aiAssistantLauncherBtn');
  if (!win) return;
  win.classList.remove('hidden');
  if (launcher) launcher.setAttribute('aria-expanded', 'true');

  const msgContainer = document.getElementById('aiChatMessages');
  const isFresh = forceRestart || !msgContainer || msgContainer.children.length === 0;

  if (isFresh) {
    if (msgContainer) msgContainer.innerHTML = '';
    resetChatState();
    appendBotMessage(
      `Hello! I am <strong>Ai Assistant</strong> for <strong>Sudo Systems</strong> at <strong>${escapeHtml(SUDO_INFO.address)}</strong> (${escapeHtml(SUDO_INFO.hours)}). Ask about our available services or pick a service below so I can diagnose your issue.`
    );
    setQuickChips(['Laptop/PC Repair', 'Data Recovery', 'Server Solutions', 'CCTV & Networking', 'What services do you offer?']);
  }

  if (preselectedService) {
    const resolved = resolveServiceCatalogEntry(preselectedService);
    if (resolved && resolved.entry) {
      beginServiceProbing(resolved.key);
    }
  }

  const input = document.getElementById('aiChatInput');
  if (input) input.focus();
}

function closeAiAssistant() {
  const win = document.getElementById('aiChatWindow');
  const launcher = document.getElementById('aiAssistantLauncherBtn');
  if (win) win.classList.add('hidden');
  if (launcher) launcher.setAttribute('aria-expanded', 'false');
}

function toggleAiAssistant() {
  const win = document.getElementById('aiChatWindow');
  if (!win) return;
  if (win.classList.contains('hidden')) {
    openAiAssistant();
  } else {
    closeAiAssistant();
  }
}

function detectServiceFromText(lower) {
  if (lower.includes('data') || lower.includes('recover') || lower.includes('hdd') || lower.includes('ssd') || lower.includes('pen') || lower.includes('usb') || lower.includes('raid') || lower.includes('deleted') || lower.includes('format')) {
    return 'Data Recovery';
  }
  if (lower.includes('laptop') || lower.includes('pc') || lower.includes('desktop') || lower.includes('screen') || lower.includes('keyboard') || lower.includes('virus') || lower.includes('repair')) {
    return 'Laptop/PC Repair';
  }
  if (lower.includes('server') || lower.includes('linux') || lower.includes('windows server') || lower.includes('active directory')) {
    return 'Server Solutions';
  }
  if (lower.includes('cctv') || lower.includes('camera') || lower.includes('network') || lower.includes('wifi') || lower.includes('wi-fi') || lower.includes('lan') || lower.includes('dvr') || lower.includes('nvr')) {
    return 'CCTV & Networking';
  }
  return null;
}

function answerAvailableServiceQuestion(rawQuestion) {
  const q = String(rawQuestion || '').toLowerCase();

  if (q.includes('address') || q.includes('location') || q.includes('where') || q.includes('kadapa') || q.includes('rajiv')) {
    return `<strong>Sudo Systems</strong> is located at <strong>${escapeHtml(SUDO_INFO.address)}</strong>. Working hours: <strong>${escapeHtml(SUDO_INFO.hours)}</strong>. Phone/WhatsApp: <strong>${escapeHtml(SUDO_INFO.phone)}</strong> · Email: <strong>${escapeHtml(SUDO_INFO.email)}</strong>.`;
  }
  if (q.includes('hour') || q.includes('time') || q.includes('open') || q.includes('timing')) {
    return `Working hours at <strong>Sudo Systems</strong> (${escapeHtml(SUDO_INFO.brand)}) are <strong>${escapeHtml(SUDO_INFO.hours)}</strong>, with Morning (10:00 AM – 12:00 PM), Afternoon (1:00 PM – 4:00 PM), and Evening (5:00 PM – 8:00 PM) hourly slots.`;
  }
  if (q.includes('phone') || q.includes('contact') || q.includes('call') || q.includes('whatsapp') || q.includes('email') || q.includes('mail')) {
    return `You can reach <strong>Sudo Systems</strong> at <strong>${escapeHtml(SUDO_INFO.address)}</strong>, on phone/WhatsApp at <strong>${escapeHtml(SUDO_INFO.phone)}</strong>, or via email at <strong>${escapeHtml(SUDO_INFO.email)}</strong> during working hours (<strong>${escapeHtml(SUDO_INFO.hours)}</strong>).`;
  }
  if (q.includes('service') || q.includes('offer') || q.includes('do you') || q.includes('help')) {
    return `Available services at <strong>Sudo Systems</strong> (${escapeHtml(SUDO_INFO.address)}):<br>• <strong>Data Recovery</strong>: ${escapeHtml(SERVICES_CATALOG['data-recovery'].shortDesc)}<br>• <strong>Laptop/PC Repair</strong>: ${escapeHtml(SERVICES_CATALOG['pc-repair'].shortDesc)}<br>• <strong>Server Solutions</strong>: ${escapeHtml(SERVICES_CATALOG['server-solutions'].shortDesc)}<br>• <strong>CCTV &amp; Networking</strong>: ${escapeHtml(SERVICES_CATALOG['cctv-networking'].shortDesc)}`;
  }
  if (q.includes('data') || q.includes('recover') || q.includes('hdd') || q.includes('ssd') || q.includes('usb') || q.includes('raid')) {
    return `<strong>Data Recovery</strong>: ${escapeHtml(SERVICES_CATALOG['data-recovery'].shortDesc)}`;
  }
  if (q.includes('laptop') || q.includes('pc') || q.includes('desktop') || q.includes('repair')) {
    return `<strong>Laptop/PC Repair</strong>: ${escapeHtml(SERVICES_CATALOG['pc-repair'].shortDesc)}`;
  }
  if (q.includes('server') || q.includes('linux') || q.includes('windows server')) {
    return `<strong>Server Solutions</strong>: ${escapeHtml(SERVICES_CATALOG['server-solutions'].shortDesc)}`;
  }
  if (q.includes('cctv') || q.includes('camera') || q.includes('network') || q.includes('wifi') || q.includes('wi-fi') || q.includes('lan') || q.includes('dvr') || q.includes('nvr') || q.includes('router') || q.includes('switch')) {
    return `<strong>CCTV &amp; Networking Solutions (Sudo Systems, ${escapeHtml(SUDO_INFO.address)})</strong>:<br>• <strong>CCTV</strong>: HD &amp; 4K IP/analog camera installation, DVR/NVR setup, night vision, playback/recording fixes, and mobile remote viewing.<br>• <strong>Networking</strong>: Cat6 structured LAN cabling, managed/unmanaged switches, business routers, and home/office Wi-Fi dead-zone &amp; speed optimization.`;
  }

  return SUDO_INFO.fallbackReply;
}

function resolveServiceCatalogEntry(serviceKey) {
  const normalizedKey = String(serviceKey || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9/&-]+/g, ' ')
    .trim();
  const aliasMap = {
    'data-recovery': 'data-recovery',
    'data recovery': 'data-recovery',
    'datarecovery': 'data-recovery',
    'pc-repair': 'pc-repair',
    'pc repair': 'pc-repair',
    'pcrepair': 'pc-repair',
    'laptop/pc repair': 'pc-repair',
    'laptop/pc-repair': 'pc-repair',
    'laptop-pc-repair': 'pc-repair',
    'laptop pc repair': 'pc-repair',
    'server-solutions': 'server-solutions',
    'server solutions': 'server-solutions',
    'serversolutions': 'server-solutions',
    'cctv & networking': 'cctv-networking',
    'cctv and networking': 'cctv-networking',
    'cctv-networking': 'cctv-networking',
    'cctv&networking': 'cctv-networking',
    'cctv-and-networking': 'cctv-networking',
    'cctv': 'cctv-networking',
    'networking': 'cctv-networking'
  };
  const resolvedKey = aliasMap[normalizedKey] || (SERVICES_CATALOG[serviceKey] ? serviceKey : 'pc-repair');
  return {
    key: resolvedKey,
    entry: SERVICES_CATALOG[resolvedKey] || SERVICES_CATALOG['pc-repair']
  };
}

function beginServiceProbing(serviceOrKey) {
  const resolved = resolveServiceCatalogEntry(serviceOrKey);
  chatState.serviceKey = resolved.key;
  chatState.service = resolved.key === 'cctv-networking'
    ? 'CCTV & Networking'
    : resolved.entry.title.replace(/\s+Services$/i, '');
  chatState.probe1 = '';
  chatState.probe2 = '';
  chatState.step = 'PROBE_1';

  if (resolved.key === 'cctv-networking') {
    appendBotMessage(
      `<strong>CCTV &amp; Networking</strong> at <strong>Sudo Systems (${escapeHtml(SUDO_INFO.address)})</strong> covers HD/4K CCTV cameras, DVR/NVR setup &amp; mobile viewing, Cat6 LAN cabling, routers/switches, and office/home Wi-Fi.<br><br>${resolved.entry.probe1Question}`
    );
  } else {
    appendBotMessage(
      `Let's check <strong>${escapeHtml(chatState.service)}</strong>. ${resolved.entry.probe1Question}`
    );
  }
  setQuickChips(resolved.entry.probe1Chips || []);
}

function processAiUserInput(rawInput) {
  const text = (rawInput || '').trim();
  if (!text) return;

  appendUserMessage(text);
  const lower = text.toLowerCase();

  if (chatState.step === 'QA_OR_SERVICE' || chatState.step === 'START') {
    const detected = detectServiceFromText(lower);

    const isDirectServiceSelection =
      lower === 'cctv & networking' ||
      lower === 'cctv and networking' ||
      lower === 'cctv' ||
      lower === 'networking' ||
      lower === 'data recovery' ||
      lower === 'laptop/pc repair' ||
      lower === 'laptop pc repair' ||
      lower === 'server solutions';

    if (isDirectServiceSelection && detected) {
      beginServiceProbing(detected);
      return;
    }

    const isPureQuestion =
      lower.endsWith('?') ||
      lower.startsWith('what') ||
      lower.startsWith('where') ||
      lower.startsWith('when') ||
      lower.startsWith('do you') ||
      lower.startsWith('can you') ||
      lower.startsWith('price') ||
      lower.startsWith('cost') ||
      lower.startsWith('address') ||
      lower.startsWith('hour') ||
      lower.includes('available services');

    if (isPureQuestion && !lower.includes('need') && !lower.includes('issue') && !lower.includes('problem') && !lower.includes('broken')) {
      const reply = answerAvailableServiceQuestion(text);
      chatState.qaLog.push({ q: text, a: reply });
      appendBotMessage(reply);
      if (detected && reply !== SUDO_INFO.fallbackReply) {
        setQuickChips([`Start ${detected} Check`, 'Laptop/PC Repair', 'Data Recovery', 'Server Solutions', 'CCTV & Networking']);
      } else {
        setQuickChips(['Laptop/PC Repair', 'Data Recovery', 'Server Solutions', 'CCTV & Networking']);
      }
      return;
    }

    if (detected) {
      beginServiceProbing(detected);
      return;
    }

    const fallback = answerAvailableServiceQuestion(text);
    chatState.qaLog.push({ q: text, a: fallback });
    appendBotMessage(fallback);
    setQuickChips(['Laptop/PC Repair', 'Data Recovery', 'Server Solutions', 'CCTV & Networking']);
    return;
  }

  if (chatState.step === 'PROBE_1') {
    chatState.probe1 = text;
    chatState.step = 'PROBE_2';
    const { entry: svc } = resolveServiceCatalogEntry(chatState.serviceKey || chatState.service);
    appendBotMessage(svc.probe2Question);
    setQuickChips(svc.probe2Chips || []);
    return;
  }

  if (chatState.step === 'PROBE_2') {
    chatState.probe2 = text;
    chatState.step = 'ASK_NAME';
    appendBotMessage(`Thanks for those technical details. May I have your <strong>name</strong>?`);
    setQuickChips([]);
    return;
  }

  if (chatState.step === 'ASK_NAME') {
    chatState.name = text;
    chatState.step = 'ASK_PHONE';
    appendBotMessage(`Nice to meet you, <strong>${escapeHtml(chatState.name)}</strong>. What is your <strong>phone number</strong> so Sudo Systems can reach you?`);
    setQuickChips([]);
    return;
  }

  if (chatState.step === 'ASK_PHONE') {
    const phoneCheck = normalizeAndValidatePhone(text);
    if (!phoneCheck.valid) {
      appendBotMessage(escapeHtml(phoneCheck.reason));
      setQuickChips(['9848012345', '+91 9030309036']);
      return;
    }
    chatState.phone = phoneCheck.formatted;
    chatState.step = 'ASK_TIMING';
    appendBotMessage(
      `Our <strong>Working Hours</strong> are <strong>Mon–Sat: 9:00 AM – 8:00 PM IST</strong>. Pick a <strong>Morning</strong>, <strong>Afternoon</strong>, or <strong>Evening</strong> slot (<strong>10:00 AM</strong> through <strong>8:00 PM</strong>) below or type your preferred hour:`
    );
    setQuickChips(WORKING_HOURS_SLOTS);
    return;
  }

  if (chatState.step === 'ASK_TIMING') {
    chatState.timing = text;
    finalizeAndSaveAiLead();
    return;
  }

  if (chatState.step === 'COMPLETED') {
    const reply = answerAvailableServiceQuestion(text);
    appendBotMessage(`${reply}<br><span class="text-xs text-slate-500">Click the restart icon above to log another enquiry.</span>`);
  }
}

function handleAiChatSubmit(event) {
  event.preventDefault();
  const input = document.getElementById('aiChatInput');
  const val = input.value;
  input.value = '';
  processAiUserInput(val);
}

async function finalizeAndSaveAiLead(partialEnd) {
  if (chatState.step === 'COMPLETED') return;

  const name = chatState.name || 'Kadapa Visitor';
  const phone = chatState.phone || 'Not provided';
  const service = chatState.service || (chatState.qaLog.length ? 'Service Enquiry' : 'General IT Inquiry');
  const timing = chatState.timing || (partialEnd ? `Ended early · ${SUDO_INFO.hours}` : `Flexible · ${SUDO_INFO.hours}`);
  const p1 = chatState.probe1 || 'No primary symptom captured';
  const p2 = chatState.probe2 || 'No secondary detail captured';

  const label = partialEnd
    ? 'Cold'
    : classifyLeadPriority(service, timing, `${p1} ${p2}`);

  const summaryLine1 = `${name} (${phone}) enquired for ${service} during Working Hours (${timing}).`;
  const summaryLine2 = `Diagnostic details — Issue/Device: ${p1}; Context/Urgency: ${p2}.`;
  const summaryLine3 = partialEnd
    ? `Chat ended before all fields were completed; follow up during Working Hours (${SUDO_INFO.hours}).`
    : `Classified as ${label} lead for Sudo Systems (${SUDO_INFO.address}) follow-up.`;

  const summary = `${summaryLine1}\n${summaryLine2}\n${summaryLine3}`;

  await addLead({
    id: 'LEAD-' + Math.floor(1000 + Math.random() * 9000),
    name,
    phone,
    service,
    timing,
    probe1: p1,
    probe2: p2,
    label,
    source: 'Ai Assistant',
    createdAt: Date.now(),
    summary
  });

  chatState.step = 'COMPLETED';
  setQuickChips([]);
  appendBotMessage(
    `Thank you, <strong>${escapeHtml(name)}</strong>! Your enquiry has been saved with label <strong>${label}</strong>.<br><span class="text-xs text-slate-600">${escapeHtml(summaryLine1)} ${escapeHtml(summaryLine2)}</span>`
  );
  showToast(`Lead saved (${label})`);
}

function endAiChatSession() {
  if (chatState.step === 'COMPLETED') {
    showToast('This chat session is already saved');
    return;
  }
  finalizeAndSaveAiLead(true);
}
