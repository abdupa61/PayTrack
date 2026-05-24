// ═══════════════════════════════════════════════════
//  PayTrack — Budget & Debt Tracker
//  Data stored in browser localStorage
//  Export/Import via JSON backup
// ═══════════════════════════════════════════════════

const DB_KEY = 'paytrack_debts';
const MONTHS   = ['','Ocak','Şubat','Mart','Nisan','Mayıs','Haziran',
                  'Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];

// ── STATE ────────────────────────────────────────────
const S = {
  records:  [],
  filter:   'all',
  sortCol:  'tarih',
  sortDir:  'asc',
  donem_ay: null,
  donem_yil:null,
  delId:    null,
  selectedIds: new Set(),
};

// ── LOCALSTORAGE ─────────────────────────────────────
function dbLoad() {
  try {
    S.records = JSON.parse(localStorage.getItem(DB_KEY)) || [];
  } catch { S.records = []; }
  if (!S.records.length) dbSeed();
}

function dbSave() {
  localStorage.setItem(DB_KEY, JSON.stringify(S.records));
}

function nextId() {
  return S.records.length ? Math.max(...S.records.map(r => r.id)) + 1 : 1;
}

function dbSeed() {
  // Ekran görüntüsündeki örnek veriler
  S.records = [
    {id:1, odendi:true,  tarih:'2025-12-07', kalem:'Enpara',                         tutar:5892,      donem_ay:12, donem_yil:2025, notlar:''},
    {id:2, odendi:true,  tarih:'2025-12-25', kalem:'Axess Ertele',                   tutar:500000,    donem_ay:12, donem_yil:2025, notlar:''},
    {id:3, odendi:true,  tarih:'2026-01-01', kalem:'Axess ertele',                   tutar:820000,    donem_ay:1,  donem_yil:2026, notlar:''},
    {id:4, odendi:true,  tarih:'2026-01-05', kalem:'QNB',                            tutar:27500,     donem_ay:1,  donem_yil:2026, notlar:''},
    {id:5, odendi:true,  tarih:'2026-01-07', kalem:'Enpara',                         tutar:3300,      donem_ay:1,  donem_yil:2026, notlar:''},
    {id:6, odendi:true,  tarih:'2026-01-14', kalem:'Benim Kuveyttürk Aktar-Döndür',  tutar:200000,    donem_ay:1,  donem_yil:2026, notlar:''},
    {id:7, odendi:true,  tarih:'2026-01-15', kalem:'Akbank Kredi',                   tutar:15000,     donem_ay:1,  donem_yil:2026, notlar:''},
    {id:8, odendi:true,  tarih:'2026-05-04', kalem:'axess 9272',                     tutar:447039,    donem_ay:5,  donem_yil:2026, notlar:''},
    {id:9, odendi:false, tarih:'2026-06-01', kalem:'5580 Axess',                     tutar:6935,      donem_ay:6,  donem_yil:2026, notlar:''},
    {id:10,odendi:false, tarih:'2026-06-01', kalem:'Balkon Takımı Taksit',            tutar:10000,     donem_ay:6,  donem_yil:2026, notlar:''},
    {id:11,odendi:false, tarih:'2026-06-02', kalem:'7170 Wings',                     tutar:3418,      donem_ay:6,  donem_yil:2026, notlar:''},
    {id:12,odendi:false, tarih:'2026-06-03', kalem:'9272 Axess',                     tutar:94016,     donem_ay:6,  donem_yil:2026, notlar:''},
    {id:13,odendi:false, tarih:'2026-06-05', kalem:'4261 Axess',                     tutar:10331,     donem_ay:6,  donem_yil:2026, notlar:''},
    {id:14,odendi:false, tarih:'2026-06-05', kalem:'QNB',                            tutar:1440,      donem_ay:6,  donem_yil:2026, notlar:''},
    {id:15,odendi:false, tarih:'2026-06-11', kalem:'9997 Axess',                     tutar:7707,      donem_ay:6,  donem_yil:2026, notlar:''},
    {id:16,odendi:false, tarih:'2026-06-18', kalem:'0723 Wings',                     tutar:6984,      donem_ay:6,  donem_yil:2026, notlar:''},
    {id:17,odendi:false, tarih:'2026-07-05', kalem:'axess 2523',                     tutar:900000,    donem_ay:7,  donem_yil:2026, notlar:''},
  ];
  dbSave();
}

// ── FORMAT ───────────────────────────────────────────
function fmtTL(v) {
  return new Intl.NumberFormat('tr-TR',{minimumFractionDigits:2,maximumFractionDigits:2}).format(v||0) + ' ₺';
}
function fmtDate(iso) {
  if (!iso) return '—';
  const [y,m,d] = iso.split('-');
  return `${d}.${m}.${y}`;
}
function escH(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') }

// ── VADE DURUMU ───────────────────────────────────────
// Dönür: { cls, tag }
function rowStatus(r) {
  if (r.odendi) return { cls: 'is-paid', tag: '' };
  const today = new Date(); today.setHours(0,0,0,0);
  const due   = new Date(r.tarih); due.setHours(0,0,0,0);
  const diff  = Math.round((due - today) / 86400000); // gün farkı

  if (diff < 0)  return { cls: 'row-overdue',  tag: `<span class="vade-tag vade-gecmis">⚠ ${Math.abs(diff)} gün geçti</span>` };
  if (diff <= 7) return { cls: 'row-due-soon', tag: `<span class="vade-tag vade-yakin">⏰ ${diff === 0 ? 'Bugün!' : diff + ' gün kaldı'}</span>` };
  return { cls: '', tag: '' };
}


// ── TOAST ────────────────────────────────────────────
function toast(msg, type='ok') {
  const icons = {ok:'✅', err:'❌', info:'ℹ️'};
  const el = document.createElement('div');
  el.className = `toast t-${type}`;
  el.innerHTML = `<span>${icons[type]||'•'}</span><span>${msg}</span>`;
  document.getElementById('toastBox').appendChild(el);
  setTimeout(()=>{ el.style.animation='tOut .3s ease forwards'; setTimeout(()=>el.remove(),300); }, 3000);
}

// ── OVERLAY ──────────────────────────────────────────
function showOverlay(){
  const o=document.getElementById('overlay');
  o.classList.remove('hidden');
  requestAnimationFrame(()=>o.classList.add('visible'));
}
function hideOverlay(){
  const o=document.getElementById('overlay');
  o.classList.remove('visible');
  setTimeout(()=>{ if(!document.querySelector('.modal.open') && !document.getElementById('sidebar').classList.contains('open')) o.classList.add('hidden'); },200);
}
document.getElementById('overlay').addEventListener('click',()=>{
  closeModal();
  closeDelModal();
  closeAnalytics();
  const sb = document.getElementById('sidebar');
  if (sb.classList.contains('open')) {
    sb.classList.remove('open');
    hideOverlay();
  }
});

// ── SIDEBAR ──────────────────────────────────────────
function toggleSidebar(){
  const sb = document.getElementById('sidebar');
  const isOpen = sb.classList.toggle('open');
  if (isOpen) {
    showOverlay();
  } else {
    hideOverlay();
  }
}

// ── PERIOD NAV ───────────────────────────────────────
function buildDonemList() {
  const periods = {};
  S.records.forEach(r => {
    const k = `${r.donem_yil}-${String(r.donem_ay).padStart(2,'0')}`;
    if (!periods[k]) periods[k] = {ay:r.donem_ay, yil:r.donem_yil, total:0, pending:0};
    periods[k].total++;
    if (!r.odendi) periods[k].pending++;
  });

  const keys = Object.keys(periods).sort();
  const list = document.getElementById('donemList');
  list.innerHTML = '';

  keys.forEach(k => {
    const p = periods[k];
    const el = document.createElement('div');
    el.className = 'donem-item' + (S.donem_ay==p.ay && S.donem_yil==p.yil ? ' active' : '');
    el.innerHTML = `<span>${MONTHS[p.ay]} ${p.yil}</span>
      <span class="donem-badge">${p.pending>0 ? p.pending+' bekl.' : '✓'}</span>`;
    el.onclick = () => selectDonem(p.ay, p.yil);
    list.appendChild(el);
  });
}

function selectDonem(ay, yil) {
  S.donem_ay  = ay;
  S.donem_yil = yil;
  document.getElementById('pageTitle').textContent = (ay&&yil) ? `${MONTHS[ay]} ${yil}` : 'Tüm Dönemler';
  buildDonemList();
  render();
  calcBudget(); // Paneli seçili döneme göre güncelle

  // Mobil görünüm için: Seçim yapıldıktan sonra menüyü kapat
  const sb = document.getElementById('sidebar');
  if (sb.classList.contains('open')) {
    sb.classList.remove('open');
    hideOverlay();
  }
}

// ── FILTER / SORT ─────────────────────────────────────
function setFilter(f, el) {
  S.filter = f;
  document.querySelectorAll('.ftab').forEach(b=>b.classList.remove('active'));
  el.classList.add('active');
  render();
}

function sortBy(col) {
  S.sortDir = (S.sortCol===col && S.sortDir==='asc') ? 'desc' : 'asc';
  S.sortCol = col;
  render();
}

document.getElementById('searchInput').addEventListener('input', render);

// ── KPI ──────────────────────────────────────────────
function updateKPI(rows) {
  const toplam   = rows.reduce((s,r)=>s+r.tutar,0);
  const odenen   = rows.filter(r=>r.odendi).reduce((s,r)=>s+r.tutar,0);
  const bekleyen = toplam - odenen;
  const oran     = toplam>0 ? (odenen/toplam*100) : 0;

  document.getElementById('kpiToplam').textContent   = fmtTL(toplam);
  document.getElementById('kpiOdendi').textContent   = fmtTL(odenen);
  document.getElementById('kpiBekleyen').textContent = fmtTL(bekleyen);
  document.getElementById('kpiOran').textContent     = oran.toFixed(1)+'%';

  document.getElementById('barToplam').style.width   = '100%';
  document.getElementById('barOdendi').style.width   = (toplam>0?(odenen/toplam*100):0)+'%';
  document.getElementById('barBekleyen').style.width = (toplam>0?(bekleyen/toplam*100):0)+'%';

  const fill = oran.toFixed(1);
  document.getElementById('donutSeg').setAttribute('stroke-dasharray', `${fill} ${(100-fill).toFixed(1)}`);
}

// ── RENDER ───────────────────────────────────────────
function render() {
  // 1. Period filter
  let rows = S.records.filter(r =>
    (!S.donem_ay  || r.donem_ay  == S.donem_ay) &&
    (!S.donem_yil || r.donem_yil == S.donem_yil)
  );

  // 2. KPI on period rows
  updateKPI(rows);

  // 3. Status filter
  if (S.filter==='paid')    rows = rows.filter(r=>r.odendi);
  if (S.filter==='pending') rows = rows.filter(r=>!r.odendi);

  // 4. Search
  const q = document.getElementById('searchInput').value.toLowerCase();
  if (q) rows = rows.filter(r => r.kalem.toLowerCase().includes(q) || (r.notlar||'').toLowerCase().includes(q));

  // 5. Sort
  rows.sort((a,b)=>{
    let va=a[S.sortCol], vb=b[S.sortCol];
    if (S.sortCol==='tutar'){va=+va;vb=+vb;}
    if(va<vb) return S.sortDir==='asc'?-1:1;
    if(va>vb) return S.sortDir==='asc'?1:-1;
    return 0;
  });

  // 6. Render rows
  const tbody = document.getElementById('tableBody');
  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty-row">📭 Kayıt bulunamadı</td></tr>`;
    document.getElementById('tableFooter').innerHTML = '0 kayıt';
    updateBulkDeleteButton();
    return;
  }

  tbody.innerHTML = rows.map(r => {
    const { cls, tag } = rowStatus(r);
    const notIcon = (r.notlar && r.notlar.trim())
      ? `<span class="not-icon" data-not="${escH(r.notlar)}">📝</span>`
      : '';
    return `
    <tr class="${cls}" id="row-${r.id}">
      <td class="col-sel">
        <input type="checkbox" class="row-sel-cb" data-id="${r.id}" onchange="toggleSelectRow(${r.id}, this)" ${S.selectedIds.has(r.id)?'checked':''}>
      </td>
      <td class="col-check">
        <button class="check-btn ${r.odendi?'checked':''}" onclick="toggleOdeme(${r.id})" title="${r.odendi?'Ödendi — geri al':'Öde'}">✓</button>
      </td>
      <td>${fmtDate(r.tarih)}</td>
      <td class="kalem-cell">${escH(r.kalem)}${tag}${notIcon}</td>
      <td><span class="donem-pill">${MONTHS[r.donem_ay]} ${r.donem_yil}</span></td>
      <td class="tutar-cell ${r.odendi?'tutar-paid':''}">${fmtTL(r.tutar)}</td>
      <td class="col-act">
        <div class="action-btns">
          <button class="btn-copy" onclick="copyToNextMonth(${r.id})" title="Gelecek aya kopyala">📋</button>
          <button class="btn-edit" onclick="openModal(${r.id})" title="Düzenle">✏️</button>
          <button class="btn-del"  onclick="openDelModal(${r.id})" title="Sil">🗑️</button>
        </div>
      </td>
    </tr>`;
  }).join('');


  const total = rows.reduce((s,r)=>s+r.tutar,0);
  const odenen = rows.filter(r=>r.odendi).reduce((s,r)=>s+r.tutar,0);
  const bekleyen = total - odenen;

  let footerRightHTML = '';
  if (S.filter === 'all') {
    footerRightHTML = `
      <span style="display:inline-flex;gap:12px;align-items:center;flex-wrap:wrap">
        <span>Ödenen: <strong style="color:var(--green)">${fmtTL(odenen)}</strong></span>
        <span style="color:var(--border-h)">|</span>
        <span>Bekleyen: <strong style="color:var(--rose)">${fmtTL(bekleyen)}</strong></span>
        <span style="color:var(--border-h)">|</span>
        <span>Toplam: <strong style="color:var(--t1)">${fmtTL(total)}</strong></span>
      </span>
    `;
  } else if (S.filter === 'paid') {
    footerRightHTML = `<span>Toplam Ödenen: <strong style="color:var(--green)">${fmtTL(total)}</strong></span>`;
  } else if (S.filter === 'pending') {
    footerRightHTML = `<span>Toplam Bekleyen: <strong style="color:var(--rose)">${fmtTL(total)}</strong></span>`;
  }

  document.getElementById('tableFooter').innerHTML =
    `<span>${rows.length} kayıt</span>${footerRightHTML}`;

  updateBulkDeleteButton();
}

// ── TOGGLE PAYMENT ────────────────────────────────────
function toggleOdeme(id) {
  const r = S.records.find(x=>x.id===id);
  if (!r) return;
  r.odendi = !r.odendi;
  dbSave();

  // Smooth fade
  const tr = document.getElementById(`row-${id}`);
  if (tr) { tr.style.transition='opacity .25s'; tr.style.opacity='0.2'; }
  setTimeout(()=>{ buildDonemList(); render(); calcBudget(); }, 260);


}

// ── MODAL ADD/EDIT ────────────────────────────────────
let editId = null;

function openModal(id=null) {
  editId = id;
  document.getElementById('modalTitle').textContent = id ? 'Borcu Düzenle' : 'Yeni Borç Ekle';
  document.getElementById('borcForm').reset();
  document.getElementById('toggleLabel').textContent = 'Ödenmedi';

  document.getElementById('fTaksit').value = 1;
  if (id) {
    document.getElementById('taksitGroup').style.display = 'none';
  } else {
    document.getElementById('taksitGroup').style.display = 'flex';
  }

  const now = new Date();
  document.getElementById('fTarih').value = now.toISOString().slice(0,10);
  document.getElementById('fAy').value    = now.getMonth()+1;
  document.getElementById('fYil').value   = now.getFullYear();

  if (id) {
    const r = S.records.find(x=>x.id===id);
    if (r) {
      document.getElementById('fKalem').value  = r.kalem;
      document.getElementById('fTutar').value  = r.tutar;
      document.getElementById('fTarih').value  = r.tarih;
      document.getElementById('fAy').value     = r.donem_ay;
      document.getElementById('fYil').value    = r.donem_yil;
      document.getElementById('fNotlar').value = r.notlar||'';
      document.getElementById('fOdendi').checked = r.odendi;
      document.getElementById('toggleLabel').textContent = r.odendi?'Ödendi':'Ödenmedi';
    }
  }
  showOverlay();
  document.getElementById('modal').classList.add('open');
  document.getElementById('fKalem').focus();
}

function closeModal(){
  document.getElementById('modal').classList.remove('open');
  hideOverlay();
  editId=null;
}

function updateToggleLabel(){
  document.getElementById('toggleLabel').textContent =
    document.getElementById('fOdendi').checked ? 'Ödendi' : 'Ödenmedi';
}

function submitForm(e) {
  e.preventDefault();
  const data = {
    kalem:     document.getElementById('fKalem').value.trim(),
    tutar:     parseFloat(document.getElementById('fTutar').value),
    tarih:     document.getElementById('fTarih').value,
    donem_ay:  parseInt(document.getElementById('fAy').value),
    donem_yil: parseInt(document.getElementById('fYil').value),
    notlar:    document.getElementById('fNotlar').value.trim(),
    odendi:    document.getElementById('fOdendi').checked,
  };

  if (editId) {
    const idx = S.records.findIndex(x=>x.id===editId);
    if (idx>-1) S.records[idx] = {...S.records[idx], ...data};
    toast('Kayıt güncellendi!','ok');
  } else {
    const taksit = parseInt(document.getElementById('fTaksit').value) || 1;
    if (taksit > 1) {
      let startAy = data.donem_ay;
      let startYil = data.donem_yil;
      let currentId = nextId();

      // Aylık taksit tutarını kuruş hassasiyetinde hesapla
      const aylikTutar = Math.round((data.tutar / taksit) * 100) / 100;

      for (let i = 1; i <= taksit; i++) {
        // Calculate month and year for this installment
        let ay = startAy + i - 1;
        let yil = startYil;
        while (ay > 12) {
          ay -= 12;
          yil += 1;
        }

        // Calculate due date (vade tarihi) with safe day clamping
        const [yVal, mVal, dVal] = data.tarih.split('-').map(Number);
        const targetMonthIndex = mVal - 1 + (i - 1);
        const date = new Date(yVal, targetMonthIndex, 1);
        const maxDays = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
        const targetDay = Math.min(dVal, maxDays);
        date.setDate(targetDay);

        const rY = date.getFullYear();
        const rM = String(date.getMonth() + 1).padStart(2, '0');
        const rD = String(date.getDate()).padStart(2, '0');
        const formattedDate = `${rY}-${rM}-${rD}`;

        // Son taksitte kuruş farklarını yansıtarak toplam tutarı birebir eşitle
        const tutarThisMonth = (i === taksit) 
          ? parseFloat((data.tutar - (aylikTutar * (taksit - 1))).toFixed(2))
          : aylikTutar;

        S.records.push({
          id: currentId++,
          kalem: `${data.kalem} (${i}/${taksit})`,
          tutar: tutarThisMonth,
          tarih: formattedDate,
          donem_ay: ay,
          donem_yil: yil,
          notlar: data.notlar,
          odendi: data.odendi
        });
      }
      toast(`${taksit} taksitli borç eklendi!`, 'ok');
    } else {
      S.records.push({id:nextId(), ...data});
      toast('Yeni borç eklendi!','ok');
    }
  }

  dbSave();
  closeModal();
  buildDonemList();
  render();
}

// ── SELECTION & BULK ACTIONS ──────────────────────────
function toggleSelectRow(id, cb) {
  if (cb.checked) {
    S.selectedIds.add(id);
  } else {
    S.selectedIds.delete(id);
  }
  updateBulkDeleteButton();
}

function toggleSelectAll(cb) {
  const visibleCheckboxes = document.querySelectorAll('.row-sel-cb');
  visibleCheckboxes.forEach(el => {
    const id = parseInt(el.getAttribute('data-id'));
    el.checked = cb.checked;
    if (cb.checked) {
      S.selectedIds.add(id);
    } else {
      S.selectedIds.delete(id);
    }
  });
  updateBulkDeleteButton();
}

function updateBulkDeleteButton() {
  const btn = document.getElementById('btnBulkDelete');
  const countSpan = document.getElementById('bulkDelCount');
  if (!btn) return;
  
  const visibleIds = Array.from(document.querySelectorAll('.row-sel-cb')).map(el => parseInt(el.getAttribute('data-id')));
  const selectedVisibleCount = visibleIds.filter(id => S.selectedIds.has(id)).length;
  
  if (selectedVisibleCount > 0) {
    btn.style.display = 'inline-flex';
    countSpan.textContent = selectedVisibleCount;
  } else {
    btn.style.display = 'none';
  }
  
  const selectAllCb = document.getElementById('selectAll');
  if (selectAllCb) {
    if (visibleIds.length > 0) {
      selectAllCb.checked = visibleIds.every(id => S.selectedIds.has(id));
      selectAllCb.indeterminate = selectedVisibleCount > 0 && selectedVisibleCount < visibleIds.length;
    } else {
      selectAllCb.checked = false;
      selectAllCb.indeterminate = false;
    }
  }
}

// ── DELETE ────────────────────────────────────────────
function openDelModal(id) {
  S.delId = id;
  const r = S.records.find(x=>x.id===id);
  document.getElementById('delMsg').textContent =
    `"${r?.kalem}" kaydını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`;
  showOverlay();
  document.getElementById('delModal').classList.add('open');
}

function openBulkDelModal() {
  S.delId = 'bulk';
  const visibleIds = Array.from(document.querySelectorAll('.row-sel-cb')).map(el => parseInt(el.getAttribute('data-id')));
  const selectedVisibleCount = visibleIds.filter(id => S.selectedIds.has(id)).length;
  
  document.getElementById('delMsg').textContent =
    `Seçilen ${selectedVisibleCount} kaydı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`;
  showOverlay();
  document.getElementById('delModal').classList.add('open');
}

function closeDelModal(){
  document.getElementById('delModal').classList.remove('open');
  hideOverlay();
  S.delId=null;
}

function confirmDelete(){
  if (!S.delId) return;
  if (S.delId === 'bulk') {
    const visibleIds = Array.from(document.querySelectorAll('.row-sel-cb')).map(el => parseInt(el.getAttribute('data-id')));
    const toDelete = visibleIds.filter(id => S.selectedIds.has(id));
    
    S.records = S.records.filter(x => !toDelete.includes(x.id));
    toDelete.forEach(id => S.selectedIds.delete(id));
    
    toast(`${toDelete.length} kayıt silindi.`, 'info');
  } else {
    const r = S.records.find(x=>x.id===S.delId);
    S.records = S.records.filter(x=>x.id!==S.delId);
    S.selectedIds.delete(S.delId);
    toast(`"${r?.kalem}" silindi.`,'info');
  }
  dbSave();
  closeDelModal();
  updateBulkDeleteButton();
  buildDonemList();
  render();
}

// ── BORÇ KOPYALA (Gelecek Ay) ─────────────────────────
function copyToNextMonth(id) {
  const r = S.records.find(x => x.id === id);
  if (!r) return;
  let ay  = r.donem_ay  + 1;
  let yil = r.donem_yil;
  if (ay > 12) { ay = 1; yil++; }

  // Vade tarihini de bir ay ilerlet
  const d = new Date(r.tarih);
  d.setMonth(d.getMonth() + 1);

  const kopya = {
    id: nextId(),
    odendi:    false,
    tarih:     d.toISOString().slice(0,10),
    kalem:     r.kalem,
    tutar:     r.tutar,
    donem_ay:  ay,
    donem_yil: yil,
    notlar:    r.notlar || '',
  };
  S.records.push(kopya);
  dbSave();
  buildDonemList();
  render();
  toast(`📋 ${MONTHS[ay]} ${yil}'e kopyalandı`, 'ok');
}

// ── KLAVYE KISAYOLLARI ────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
  if (e.key === 'n' || e.key === 'N') openModal();
  if (e.key === 'Escape') { closeModal(); closeDelModal(); closeAnalytics(); }
});

// ── YAZDIR / PDF ──────────────────────────────────────
function printDonem() { window.print(); }

// ── ANALİZLER ─────────────────────────────────────────
let trendChart = null;

function openAnalytics() {
  showOverlay();
  document.getElementById('analyticsModal').classList.add('open');
  switchTab('trend', document.querySelector('.atab'));
}

function closeAnalytics() {
  document.getElementById('analyticsModal').classList.remove('open');
  hideOverlay();
}

function switchTab(tab, el) {
  document.querySelectorAll('.atab').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));
  document.getElementById('tab' + tab.charAt(0).toUpperCase() + tab.slice(1)).classList.remove('hidden');
  if (tab === 'trend')  renderTrendChart();
  if (tab === 'kalem')  renderKalemOzet();
  if (tab === 'yillik') renderYillikOzet();
}

// Aylık trend bar chart
function renderTrendChart() {
  const ayMap = {};
  S.records.forEach(r => {
    const k = `${r.donem_yil}-${String(r.donem_ay).padStart(2,'0')}`;
    if (!ayMap[k]) ayMap[k] = { label: MONTHS[r.donem_ay] + ' ' + r.donem_yil, odenen: 0, bekleyen: 0 };
    if (r.odendi) ayMap[k].odenen  += r.tutar;
    else          ayMap[k].bekleyen += r.tutar;
  });
  const keys   = Object.keys(ayMap).sort();
  const labels = keys.map(k => ayMap[k].label);
  const odenen = keys.map(k => ayMap[k].odenen);
  const bekl   = keys.map(k => ayMap[k].bekleyen);

  if (trendChart) trendChart.destroy();
  const ctx = document.getElementById('chartTrend').getContext('2d');
  trendChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'Ödenen ₺',  data: odenen, backgroundColor: 'rgba(34,197,94,.7)',  borderRadius: 6 },
        { label: 'Bekleyen ₺',data: bekl,   backgroundColor: 'rgba(244,63,94,.7)', borderRadius: 6 },
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'top' } },
      scales: {
        y: { ticks: { callback: v => (v/1000).toFixed(0) + 'K ₺' }, grid: { color: '#f1f5f9' } },
        x: { grid: { display: false } }
      }
    }
  });
}

// Kalem bazlı özet
function renderKalemOzet() {
  const map = {};
  S.records.forEach(r => {
    const k = r.kalem.trim();
    if (!map[k]) map[k] = { tutar: 0, adet: 0 };
    map[k].tutar += r.tutar;
    map[k].adet++;
  });
  const sorted = Object.entries(map).sort((a,b) => b[1].tutar - a[1].tutar);
  const maxT = sorted[0]?.[1].tutar || 1;

  document.getElementById('kalemList').innerHTML = sorted.map(([ad, d]) => `
    <div class="kalem-row">
      <div class="kalem-name">${escH(ad)}</div>
      <div class="kalem-bar-wrap"><div class="kalem-bar" style="width:${(d.tutar/maxT*100).toFixed(1)}%"></div></div>
      <div class="kalem-tutar">${fmtTL(d.tutar)}</div>
      <div class="kalem-adet">${d.adet} kayıt</div>
    </div>`).join('');
}

// Yıllık özet
function renderYillikOzet() {
  const yMap = {};
  S.records.forEach(r => {
    const y = r.donem_yil;
    if (!yMap[y]) yMap[y] = { odenen: 0, bekleyen: 0 };
    if (r.odendi) yMap[y].odenen  += r.tutar;
    else          yMap[y].bekleyen += r.tutar;
  });
  const years = Object.keys(yMap).sort();
  document.getElementById('yillikList').innerHTML = years.map(y => {
    const d = yMap[y];
    const top = d.odenen + d.bekleyen;
    const pO = top > 0 ? (d.odenen / top * 100).toFixed(1) : 0;
    const pB = top > 0 ? (d.bekleyen / top * 100).toFixed(1) : 0;
    return `
    <div class="yillik-row">
      <div class="yillik-label">${y}</div>
      <div class="yillik-bar-group">
        <div class="yillik-bar-row">
          <div class="yillik-bar-label">Ödenen</div>
          <div class="yillik-bar-wrap"><div class="yillik-bar-fill bar-paid" style="width:${pO}%"></div></div>
          <div style="font-size:12px;color:#16a34a;font-weight:600;min-width:100px;text-align:right">${fmtTL(d.odenen)}</div>
        </div>
        <div class="yillik-bar-row">
          <div class="yillik-bar-label">Bekleyen</div>
          <div class="yillik-bar-wrap"><div class="yillik-bar-fill bar-pend" style="width:${pB}%"></div></div>
          <div style="font-size:12px;color:#e11d48;font-weight:600;min-width:100px;text-align:right">${fmtTL(d.bekleyen)}</div>
        </div>
      </div>
      <div class="yillik-total">${fmtTL(top)}</div>
    </div>`;
  }).join('');
}

// ── BÜTÇE HESAPLAMA ──────────────────────────────────
function calcBudget() {
  const nakitVal = document.getElementById('nakit').value;
  localStorage.setItem('paytrack_nakit', nakitVal);
  const nakit = parseFloat(nakitVal) || 0;

  // Sadece görüntülenen dönemin bekleyen borçları
  const bekleyenler = S.records
    .filter(r =>
      !r.odendi &&
      (!S.donem_ay  || r.donem_ay  == S.donem_ay) &&
      (!S.donem_yil || r.donem_yil == S.donem_yil)
    )
    .sort((a, b) => a.tarih.localeCompare(b.tarih)); // Tarihe göre sırala

  const toplamBekleyen = bekleyenler.reduce((s, r) => s + r.tutar, 0);

  // Greedy: tarih sırasıyla öde
  let kalan = nakit;
  let kapananToplam = 0;
  let kapananAdet = 0;

  const detay = bekleyenler.map(r => {
    if (kalan >= r.tutar) {
      kalan -= r.tutar;
      kapananToplam += r.tutar;
      kapananAdet++;
      return { ...r, odenebilir: true };
    }
    return { ...r, odenebilir: false };
  });

  const fark = nakit - toplamBekleyen;

  // Sonuçları güncelle
  document.getElementById('bresBekleyen').textContent = fmtTL(toplamBekleyen);
  document.getElementById('bresNakit').textContent    = nakit > 0 ? fmtTL(nakit) : '—';
  document.getElementById('bresKapanir').textContent  = nakit > 0 ? fmtTL(kapananToplam) : '—';

  // Fark kartı
  const farkCard  = document.getElementById('bresFarkCard');
  const farkLabel = document.getElementById('bresFarkLabel');
  const farkVal   = document.getElementById('bresFark');

  if (nakit <= 0) {
    farkCard.className = 'bres-card bres-fark';
    farkLabel.textContent = 'Fark';
    farkVal.textContent = '—';
  } else if (fark >= 0) {
    farkCard.className = 'bres-card bres-fark surplus';
    farkLabel.textContent = '✅ Fazla Kalan';
    farkVal.textContent = fmtTL(fark);
  } else {
    farkCard.className = 'bres-card bres-fark deficit';
    farkLabel.textContent = '❌ Eksik';
    farkVal.textContent = fmtTL(Math.abs(fark));
  }

  // Detay listesi
  const detail = document.getElementById('budgetDetail');
  const list   = document.getElementById('bdetailList');
  const note   = document.getElementById('bdetailNote');

  if (nakit <= 0 || bekleyenler.length === 0) {
    detail.style.display = 'none';
    return;
  }

  detail.style.display = 'block';
  note.textContent = kapananAdet === bekleyenler.length
    ? '— Tümü ödenebilir! 🎉'
    : `— ${kapananAdet} tanesi ödenebilir`;

  if (detay.length === 0) {
    list.innerHTML = '<div class="bdetail-empty">Bekleyen borç yok</div>';
    return;
  }

  list.innerHTML = detay.map(r => `
    <div class="bdetail-item ${r.odenebilir ? 'can-pay' : 'cant-pay'}">
      <div class="bdetail-left">
        <div class="bdetail-dot ${r.odenebilir ? 'pay' : 'nopay'}"></div>
        <span class="bdetail-kalem">${escH(r.kalem)}</span>
        <span class="bdetail-tarih">${fmtDate(r.tarih)}</span>
      </div>
      <div style="display:flex;align-items:center;gap:10px">
        <span class="bdetail-tutar">${fmtTL(r.tutar)}</span>
        <span style="font-size:12px;padding:2px 8px;border-radius:99px;font-weight:600;
          background:${r.odenebilir ? '#dcfce7' : '#ffedd5'};
          color:${r.odenebilir ? '#16a34a' : '#ea580c'}">
          ${r.odenebilir ? '✓ Ödenebilir' : '✗ Yetersiz'}
        </span>
      </div>
    </div>`).join('');
}

// ── INIT ─────────────────────────────────────────────
dbLoad();

// Restore nakit (elimdeki para) from localStorage
const savedNakit = localStorage.getItem('paytrack_nakit');
if (savedNakit !== null) {
  document.getElementById('nakit').value = savedNakit;
}

buildDonemList();

// Sayfa açılınca güncel ayı seç
const _now = new Date();
const _ay  = _now.getMonth() + 1;
const _yil = _now.getFullYear();

// Eğer o ay kayıt varsa onu aç, yoksa tüm dönemleri göster
const _varMi = S.records.some(r => r.donem_ay === _ay && r.donem_yil === _yil);
if (_varMi) {
  selectDonem(_ay, _yil);
} else {
  render();
  calcBudget();
}

async function exportJSON() {
  const json = JSON.stringify(S.records, null, 2);
  const fileName = `ekoyonet_yedek_${new Date().toISOString().slice(0,10)}.json`;

  // Modern tarayıcılarda native kaydet diyaloğu
  if (window.showSaveFilePicker) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: fileName,
        types: [{ description: 'JSON Dosyası', accept: { 'application/json': ['.json'] } }],
      });
      const writable = await handle.createWritable();
      await writable.write(json);
      await writable.close();
      toast('Dosya kaydedildi!', 'ok');
    } catch (e) {
      if (e.name !== 'AbortError') toast('Kaydedilemedi: ' + e.message, 'err');
    }
  } else {
    // Eski tarayıcı fallback
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([json], {type:'application/json'}));
    a.download = fileName;
    a.click();
    toast('Dosya indirildi!', 'ok');
  }
}

function importJSON(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const data = JSON.parse(ev.target.result);
      if (!Array.isArray(data)) throw new Error('Geçersiz format');
      S.records = data;
      dbSave();
      buildDonemList();
      selectDonem(null,null);
      toast(`${data.length} kayıt içe aktarıldı!`,'ok');
    } catch(err) {
      toast('İçe aktarma hatası: '+err.message,'err');
    }
    e.target.value='';
  };
  reader.readAsText(file);
}


