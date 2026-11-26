// ==================== 1. CONFIG & OPTIONAL SUPABASE SETUP ====================
const SUPABASE_CONFIG = {
  url: 'https://utbjyszqtbocnvbsicvq.supabase.co',
  anonKey: 'sb_publishable_A8519fuwTKF-sJqyU_pywg__IV1Gimy'
};

const isSupabaseConfigured =
  Boolean(window.supabase) &&
  SUPABASE_CONFIG.url.startsWith('https://') &&
  !SUPABASE_CONFIG.url.includes('YOUR_PROJECT_ID') &&
  SUPABASE_CONFIG.anonKey &&
  !SUPABASE_CONFIG.anonKey.includes('YOUR_SUPABASE_ANON_KEY');

const supabaseClient = isSupabaseConfigured
  ? window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey)
  : null;

const SUDO_INFO = {
  brand: 'Sudo Systems',
  city: 'Kadapa, Andhra Pradesh, India',
  address: 'Rajiv Park Road, Kadapa',
  phone: '+91-9030309036',
  whatsappNumber: '919030309036',
  email: 'sudo9systems@gmail.com',
  hours: 'Mon–Sat: 9:00 AM – 8:00 PM IST',
  fallbackReply: 'Sudo Systems will contact shortly'
};

const ASSISTANT_AVATAR_SRC = 'assets/images/image_9f0794c6.jpg';

function renderAssistantAvatarHtml(sizeClass) {
  return `<span class="ai-avatar-wrap ${sizeClass}"><img src="${ASSISTANT_AVATAR_SRC}" alt="Ai Assistant" class="ai-bear-avatar" onerror="handleAssistantImgError(this)"></span>`;
}

const SERVICES_CATALOG = {
  'data-recovery': {
    title: 'Data Recovery Services',
    shortDesc: 'Data recovery from HDDs, SSDs, USB pen-drives, memory cards, RAID/NAS arrays, and mobile devices.',
    probe1Question: 'Which storage device has the issue and what happened (e.g., HDD/SSD/USB/RAID/Phone — clicking noise, dead drive, accidental format/deletion, or water/power surge)?',
    probe1Chips: ['Dead / Clicking HDD', 'SSD / NVMe Not Detecting', 'USB / SD Card Formatted', 'RAID / Server Storage'],
    probe2Question: 'How critical is the data and have you stopped writing/retrying on the drive?',
    probe2Chips: ['Urgent Business Data', 'Personal Photos / Docs', 'Stopped Using Drive', 'Already Tried Tools'],
    modalHtml: `
      <div class="space-y-4 text-slate-700">
        <p class="font-bold text-slate-900 text-base">Professional Data Recovery Solutions</p>
        <p>We specialize in recovering lost, deleted, or corrupted data from all types of storage devices. Our advanced techniques and state-of-the-art equipment ensure maximum recovery success rates.</p>
        <div class="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-1.5 text-sm text-slate-800">
          <div class="font-bold text-blue-900">What We Recover:</div>
          <div>• Hard Drives (HDD &amp; SSD)</div>
          <div>• USB Flash Drives &amp; Memory Cards</div>
          <div>• RAID Arrays &amp; NAS Systems</div>
          <div>• Mobile Phones &amp; Tablets</div>
          <div>• Optical Media (CD/DVD/Blu-ray)</div>
        </div>
        <div class="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-1.5 text-sm text-slate-800">
          <div class="font-bold text-emerald-900">Recovery Process:</div>
          <div>• Free Initial Diagnosis</div>
          <div>• Detailed Recovery Report</div>
          <div>• No Data, No Charge Policy</div>
          <div>• Secure &amp; Confidential Process</div>
          <div>• 24-48 Hour Turnaround</div>
        </div>
        <p class="text-xs text-slate-500">Success Rate: 95% · Working Hours: Mon–Sat: 9:00 AM – 8:00 PM IST</p>
      </div>
    `
  },
  'pc-repair': {
    title: 'Laptop/PC Repair Services',
    shortDesc: 'Hardware and software diagnostics and repair for laptops and desktops across all major brands.',
    probe1Question: 'Is this a Laptop or Desktop, and what exact problem are you seeing (no power/no display, cracked screen/keyboard, overheating/slowness, or OS/virus issue)?',
    probe1Chips: ['Laptop · No Power/Display', 'Screen / Keyboard / Hinge', 'Slow / Overheating / Fan', 'Windows / Virus / Upgrade'],
    probe2Question: 'What is the approximate brand/model and is it needed urgently for work or study?',
    probe2Chips: ['Urgent Work Laptop', 'Office Desktop PC', 'SSD / RAM Upgrade', 'Routine Service'],
    modalHtml: `
      <div class="space-y-4 text-slate-700">
        <p class="font-bold text-slate-900 text-base">Expert Computer Repair &amp; Maintenance</p>
        <p>From hardware failures to software issues, we provide comprehensive repair services for all computer brands and models. Fast, reliable, and affordable solutions.</p>
        <div class="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-1.5 text-sm text-slate-800">
          <div class="font-bold text-emerald-900">Hardware Services:</div>
          <div>• Screen &amp; Keyboard Replacement</div>
          <div>• Motherboard &amp; Component Repair</div>
          <div>• RAM &amp; Storage Upgrades</div>
          <div>• Power Supply &amp; Battery Issues</div>
          <div>• Cooling System Maintenance</div>
        </div>
        <div class="bg-purple-50 border border-purple-200 rounded-2xl p-4 space-y-1.5 text-sm text-slate-800">
          <div class="font-bold text-purple-900">Software Services:</div>
          <div>• Operating System Installation</div>
          <div>• Virus &amp; Malware Removal</div>
          <div>• Performance Optimization</div>
          <div>• Data Backup &amp; Migration</div>
          <div>• Software Installation &amp; Updates</div>
        </div>
        <p class="text-xs text-slate-500">Same Day Service Available · Working Hours: Mon–Sat: 9:00 AM – 8:00 PM IST</p>
      </div>
    `
  },
  'server-solutions': {
    title: 'Server Solutions',
    shortDesc: 'Windows & Linux server setup, Active Directory, shared storage/backups, and ongoing maintenance.',
    probe1Question: 'Are you setting up a new office server or troubleshooting an existing server, and is it Windows Server or Linux?',
    probe1Chips: ['New Server Setup', 'Windows Server Issue', 'Linux Server / File Share', 'Backup & Downtime'],
    probe2Question: 'Roughly how many users/systems connect to it and is there active downtime right now?',
    probe2Chips: ['Active Downtime Today', '5–25 Office PCs', '25+ Users / Rack', 'Planned Upgrade'],
    modalHtml: `
      <div class="space-y-4 text-slate-700">
        <p class="font-bold text-slate-900 text-base">Enterprise Server Management</p>
        <p>Complete server solutions for businesses of all sizes. From setup to maintenance, we ensure your servers run efficiently and securely.</p>
        <div class="bg-purple-50 border border-purple-200 rounded-2xl p-4 space-y-1.5 text-sm text-slate-800">
          <div class="font-bold text-purple-900">Server Services:</div>
          <div>• Server Installation &amp; Configuration</div>
          <div>• Windows &amp; Linux Server Setup</div>
          <div>• Active Directory Management</div>
          <div>• Email Server Configuration</div>
          <div>• Database Server Optimization</div>
        </div>
        <div class="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-1.5 text-sm text-slate-800">
          <div class="font-bold text-amber-900">Monitoring &amp; Support:</div>
          <div>• 24/7 Server Monitoring</div>
          <div>• Automated Backup Solutions</div>
          <div>• Security Updates &amp; Patches</div>
          <div>• Performance Optimization</div>
          <div>• Disaster Recovery Planning</div>
        </div>
        <p class="text-xs text-slate-500">99.9% Uptime Guarantee · Working Hours: Mon–Sat: 9:00 AM – 8:00 PM IST</p>
      </div>
    `
  },
  'cctv-networking': {
    title: 'CCTV & Networking Solutions',
    shortDesc: 'HD/4K CCTV camera installation, DVR/NVR setup, mobile remote viewing, structured LAN cabling, routers/switches, and Wi-Fi optimization.',
    probe1Question: 'Is this for CCTV camera installation/repair (HD/4K/DVR/NVR/mobile view), wired LAN/switches/routers, or office/home Wi-Fi setup — and is the site a home, shop, or office in Kadapa?',
    probe1Chips: ['CCTV Cameras + Mobile View', 'Office Wi-Fi & LAN Cabling', 'DVR / NVR / No Recording', 'Router / Switch / Internet Fix'],
    probe2Question: 'Roughly how many cameras or rooms/floors need coverage, and do you want an on-site inspection or quote?',
    probe2Chips: ['Need Site Inspection', '1–4 Cameras / Home or Shop', '5–16 Cameras / Office', 'Existing Network Upgrade'],
    modalHtml: `
      <div class="space-y-4 text-slate-700">
        <p class="font-bold text-slate-900 text-base">Complete Security &amp; Network Solutions</p>
        <p>Protect your property and ensure reliable connectivity with our professional CCTV and networking services. Custom solutions for homes and businesses.</p>
        <div class="bg-rose-50 border border-rose-200 rounded-2xl p-4 space-y-1.5 text-sm text-slate-800">
          <div class="font-bold text-rose-900">CCTV Services:</div>
          <div>• HD &amp; 4K Camera Installation</div>
          <div>• DVR/NVR System Setup</div>
          <div>• Remote Viewing Configuration</div>
          <div>• Motion Detection &amp; Alerts</div>
          <div>• Night Vision Solutions</div>
        </div>
        <div class="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-1.5 text-sm text-slate-800">
          <div class="font-bold text-blue-900">Networking Services:</div>
          <div>• WiFi Network Setup &amp; Optimization</div>
          <div>• Router &amp; Switch Configuration</div>
          <div>• Network Security Implementation</div>
          <div>• Cable Management &amp; Installation</div>
          <div>• VPN &amp; Remote Access Setup</div>
        </div>
        <p class="text-xs text-slate-500">Free Site Survey · Working Hours: Mon–Sat: 9:00 AM – 8:00 PM IST</p>
      </div>
    `
  }
};

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function showToast(message) {
  const el = document.getElementById('toastBanner');
  if (!el) return;
  el.textContent = message;
  el.classList.remove('hidden');
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => {
    el.classList.add('hidden');
  }, 2800);
}
