// ===== إعدادات عامة =====
const API_BASE_URL = 'http://localhost:3001/api';   // عدّليها لو لزم

let currentLang = localStorage.getItem('lang') || 'ar';
function guard(){
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  if (!user || Number(user.RoleID) !== 1){
    window.location.replace('/login/home.html'); // أو صفحة "غير مصرّح"
  }
};


function applyLanguage(lang){
  currentLang = lang;
  localStorage.setItem('lang', lang);
  document.documentElement.lang = lang;
  document.body.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-ar]').forEach(el=>{
    el.textContent = el.getAttribute(`data-${lang}`);
  });
  const langText = document.getElementById('langText');
  if (langText) langText.textContent = lang === 'ar' ? 'العربية | English' : 'English | العربية';
}

// ===== حماية الصفحة: سوبر أدمن فقط =====
function requireSuperAdmin(){
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  // نفس منطق home.js لكن نحصر الدخول على RoleID=1 فقط
  // (home.js يقرأ RoleID/RoleName من localStorage). :contentReference[oaicite:5]{index=5}
  if (!user || Number(user.RoleID) !== 1){
    // رجّعيه لواجهة الهوم العامة أو تسجيل الدخول
    window.location.replace('/login/home.html'); 
    return false;
  }
  return true;
}

// ===== جلب الأرقام من الـ API =====
async function fetchSuperAdminSummary(){
  // عندك روتات overview مفعّلة في الخادم. :contentReference[oaicite:6]{index=6}
  // نحاول مسار خاص، وإن ما وُجد نرجع لملخّص عام.
  const tryEndpoints = [
    `${API_BASE_URL}/overview/superadmin`,           // إن أضفتيه
    `${API_BASE_URL}/overview/summary?scope=all`    // بديل عام
  ];

  for (const url of tryEndpoints){
    try{
      const r = await fetch(url);
      if (!r.ok) continue;
      const data = await r.json();
      if (!data) continue;

      // نتوقّع ستاتس مثل:
      // data.totals.total, data.totals.open, data.totals.in_progress, data.totals.closed
      const totals = data.totals || data || {};
      document.getElementById('kpiTotal').textContent  = totals.total ?? '0';
      document.getElementById('kpiOpen').textContent   = totals.open ?? '0';
      document.getElementById('kpiWip').textContent    = (totals.in_progress ?? totals.processing ?? 0);
      document.getElementById('kpiClosed').textContent = totals.closed ?? '0';

      // لو رجّع عدّاد سجلات اليوم
      document.getElementById('kpiLogsToday').textContent = (data.logs_today ?? data.logsToday ?? '0');

      // لو رجّع سجلات
      if (Array.isArray(data.latest_logs)){
        renderLogs(data.latest_logs);
      }else{
        // نجيب السجلات من مسار logs إن وُجد
        fetchLatestLogs();
      }
      return; // وقف بعد أول مسار ناجح
    }catch(e){ /* جرّبي التالي */ }
  }

  // آخر حل: عبّي القيم بصفر ثم جيبي السجلات مباشرة
  document.getElementById('kpiTotal').textContent  = '0';
  document.getElementById('kpiOpen').textContent   = '0';
  document.getElementById('kpiWip').textContent    = '0';
  document.getElementById('kpiClosed').textContent = '0';
  fetchLatestLogs();
}

async function fetchLatestLogs(){
  // نستفيد من وجود جدول activitylogs في الداتابيس. :contentReference[oaicite:7]{index=7}
  // استخدمي المسار الموجود عندك لسرد السجلات (مثلاً /api/logs/latest?limit=10)
  const urls = [
    `${API_BASE_URL}/logs/latest?limit=10`,
    `${API_BASE_URL}/logs?limit=10` // بديل إن الأول غير موجود
  ];
  for(const url of urls){
    try{
      const r = await fetch(url);
      if(!r.ok) continue;
      const data = await r.json();
      const rows = Array.isArray(data) ? data : (data.data || data.logs || []);
      if (rows.length){
        renderLogs(rows);
        return;
      }
    }catch(e){ /* تجاوز */ }
  }
}

function renderLogs(rows){
  const tbody = document.querySelector('#logsTable tbody');
  tbody.innerHTML = '';
  rows.slice(0,10).forEach(log=>{
    const tr = document.createElement('tr');
    const createdAt = log.CreatedAt || log.created_at || log.time || '';
    const user = log.Username || log.user || log.EmployeeName || '';
    const type = log.ActivityType || log.type || '';
    const desc = log.Description || log.description || '';
    tr.innerHTML = `<td>${createdAt}</td><td>${user}</td><td>${type}</td><td>${desc}</td>`;
    tbody.appendChild(tr);
  });
}

// ===== إشعارات وزر اللغة =====
document.addEventListener('DOMContentLoaded', ()=>{
  if (!requireSuperAdmin()) return;
  applyLanguage(currentLang);

  const toggleBtn = document.getElementById('langToggle');
  if (toggleBtn){
    toggleBtn.addEventListener('click', ()=>{
      applyLanguage(currentLang === 'ar' ? 'en' : 'ar');
    });
  }

  // جلب البيانات فورًا
  fetchSuperAdminSummary();

  // تقليل عدّاد الإشعارات مثالياً
  const notifBtn = document.getElementById('notifBtn');
  const notifCount = document.getElementById('notifCount');
  if (notifBtn && notifCount){
    notifBtn.addEventListener('click', ()=>{
      let c = parseInt(notifCount.textContent||'0',10);
      if (c>0) { c--; notifCount.textContent = c; if (c===0) notifCount.style.display='none'; }
    });
  }
});
