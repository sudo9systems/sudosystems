// ==================== 2. LEADS STORAGE, SUPABASE & VALIDATION ====================
const LEADS_STORAGE_KEY = 'sudo_systems_leads_v1';
const ADMIN_AUTH_KEY = 'sudo_systems_admin_logged_in';

function seedInitialLeadsIfEmpty() {
  if (isSupabaseConfigured) return;
  if (localStorage.getItem(LEADS_STORAGE_KEY) !== null) return;
  const now = Date.now();
  const dayMs = 86400000;
  const initialLeads = [
    {
      id: 'LEAD-1001',
      name: 'Ramesh Babu',
      phone: '9848023411',
      service: 'Data Recovery',
      timing: 'Morning · 10:00 AM (Working Hours)',
      probe1: 'Dead / Clicking HDD (1TB external)',
      probe2: 'Urgent Business Data · Stopped Using Drive',
      label: 'Hot',
      source: 'Ai Assistant',
      createdAt: now - 1 * dayMs,
      summary: 'Ramesh Babu needs urgent data recovery from a clicking 1TB external HDD containing critical business files.\nDrive has been disconnected safely for Morning · 10:00 AM (Working Hours: Mon–Sat: 9:00 AM – 8:00 PM IST).\nHigh conversion urgency for Kadapa recovery evaluation.'
    },
    {
      id: 'LEAD-1002',
      name: 'Divya Lakshmi',
      phone: '9440155678',
      service: 'Laptop/PC Repair',
      timing: 'Evening · 6:00 PM (Working Hours)',
      probe1: 'Laptop · No Power/Display',
      probe2: 'Urgent Work Laptop',
      label: 'Hot',
      source: 'Ai Assistant',
      createdAt: now - 2 * dayMs,
      summary: 'Divya Lakshmi reported a work laptop with no power or display for Evening · 6:00 PM (Working Hours: Mon–Sat: 9:00 AM – 8:00 PM IST).\nProbed details indicate hardware power/display diagnostics needed.\nMarked Hot due to work-device urgency.'
    },
    {
      id: 'LEAD-1003',
      name: 'Srinivas Rao',
      phone: '9701288901',
      service: 'Server Solutions',
      timing: 'Morning · 11:00 AM (Working Hours)',
      probe1: 'New Server Setup (Windows Server)',
      probe2: '5–25 Office PCs',
      label: 'Warm',
      source: 'Ai Assistant',
      createdAt: now - 4 * dayMs,
      summary: 'Srinivas Rao is exploring a new Windows Server setup for an office with 5–25 PCs at Morning · 11:00 AM (Working Hours: Mon–Sat: 9:00 AM – 8:00 PM IST).\nNo active outage reported yet, making it a planned infrastructure enquiry.\nMarked Warm for scheduled consultation and quote.'
    },
    {
      id: 'LEAD-1004',
      name: 'Anitha Chowdary',
      phone: '9391044210',
      service: 'CCTV & Networking',
      timing: 'Afternoon · 4:00 PM (Working Hours)',
      probe1: 'Home Security CCTV',
      probe2: 'Need Site Inspection',
      label: 'Cold',
      source: 'Ai Assistant',
      createdAt: now - 9 * dayMs,
      summary: 'Anitha Chowdary enquired about home CCTV cameras and a site survey around Afternoon · 4:00 PM (Working Hours: Mon–Sat: 9:00 AM – 8:00 PM IST).\nEarly-stage planning in Kadapa.\nMarked Cold for periodic follow-up.'
    }
  ];
  localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(initialLeads));
}

function getLeads() {
  try {
    const raw = localStorage.getItem(LEADS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to read leads:', err);
    return [];
  }
}

function saveLeads(leads) {
  try {
    localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(leads));
  } catch (err) {
    console.error('Failed to save leads:', err);
  }
}

async function addLead(leadObj) {
  const leads = getLeads();
  leads.unshift(leadObj);
  saveLeads(leads);

  if (supabaseClient) {
    const { error } = await supabaseClient.from('leads').insert([{
      id: leadObj.id,
      name: leadObj.name,
      phone: leadObj.phone,
      service: leadObj.service,
      timing: leadObj.timing,
      probe1: leadObj.probe1,
      probe2: leadObj.probe2,
      label: leadObj.label,
      source: leadObj.source,
      summary: leadObj.summary
    }]);
    if (error) {
      console.error('Supabase insert error:', error.message);
    }
  }
}

async function syncLeadsFromCloud(notifyUser) {
  if (!supabaseClient) {
    renderAdminDashboard();
    if (notifyUser) showToast('Refreshed local leads');
    return;
  }

  const { data, error } = await supabaseClient
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Supabase fetch error:', error.message);
    if (notifyUser) showToast('Could not refresh cloud leads: ' + error.message);
    return;
  }

  if (Array.isArray(data)) {
    const mapped = data.map((row) => ({
      id: row.id,
      name: row.name,
      phone: row.phone,
      service: row.service,
      timing: row.timing,
      probe1: row.probe1,
      probe2: row.probe2,
      label: row.label,
      source: row.source,
      summary: row.summary,
      createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now()
    }));
    saveLeads(mapped);
    renderAdminDashboard();
    if (notifyUser) showToast(`Synced ${mapped.length} cloud leads`);
  }
}

async function updateLeadLabelInCloud(leadId, newLabel) {
  if (!supabaseClient) return;
  const { error } = await supabaseClient
    .from('leads')
    .update({ label: newLabel })
    .eq('id', leadId);
  if (error) {
    console.error('Supabase label update error:', error.message);
  }
}

function classifyLeadPriority(service, timing, detailsText) {
  const combined = `${service || ''} ${timing || ''} ${detailsText || ''}`.toLowerCase();
  if (
    combined.includes('today') ||
    combined.includes('urgent') ||
    combined.includes('downtime') ||
    combined.includes('clicking') ||
    combined.includes('no power') ||
    combined.includes('no display') ||
    combined.includes('tomorrow')
  ) {
    return 'Hot';
  }
  if (
    combined.includes('next month') ||
    combined.includes('later') ||
    combined.includes('planning') ||
    combined.includes('ended early')
  ) {
    return 'Cold';
  }
  return 'Warm';
}

function normalizeAndValidatePhone(rawPhone) {
  const cleaned = String(rawPhone || '').trim();
  if (!cleaned) {
    return {
      valid: false,
      formatted: '',
      reason: 'Please enter a valid 10-digit mobile number (e.g., 9848012345) so Sudo Systems can contact you.'
    };
  }

  if (/[a-zA-Z]/.test(cleaned) || !/^[+\d\s\-().]+$/.test(cleaned)) {
    return {
      valid: false,
      formatted: cleaned,
      reason: 'Phone number should contain only valid digits (e.g., 9848012345 or +91 9848012345).'
    };
  }

  const digitsOnly = cleaned.replace(/\D/g, '');
  let tenDigit = null;

  if (digitsOnly.length === 10) {
    tenDigit = digitsOnly;
  } else if (digitsOnly.length === 11 && digitsOnly.startsWith('0')) {
    tenDigit = digitsOnly.slice(1);
  } else if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
    tenDigit = digitsOnly.slice(2);
  }

  if (tenDigit !== null) {
    if (!/^[6-9]\d{9}$/.test(tenDigit)) {
      return {
        valid: false,
        formatted: cleaned,
        reason: 'Indian mobile numbers must be 10 digits starting with 6, 7, 8, or 9 (e.g., 9848012345).'
      };
    }

    const blockedPatterns = [
      /^(\d)\1{9}$/,
      /^1234567890$/,
      /^0123456789$/,
      /^9876543210$/,
      /^6789012345$/
    ];
    if (blockedPatterns.some((rx) => rx.test(tenDigit))) {
      return {
        valid: false,
        formatted: cleaned,
        reason: 'Please enter a real, working 10-digit mobile number rather than a sample or repeated sequence.'
      };
    }

    const formatted = digitsOnly.length === 12 && digitsOnly.startsWith('91')
      ? `+91-${tenDigit}`
      : tenDigit;
    return { valid: true, formatted };
  }

  if (digitsOnly.length >= 10 && digitsOnly.length <= 15 && !/^[1-9]\d{0,2}0{7,}$/.test(digitsOnly) && !/^(\d)\1+$/.test(digitsOnly)) {
    return { valid: true, formatted: cleaned };
  }

  return {
    valid: false,
    formatted: cleaned,
    reason: 'Please enter a valid 10-digit mobile number (e.g., 9848012345 or +91 9848012345) so Sudo Systems can reach you.'
  };
}
