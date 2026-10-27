(function () {
  'use strict';

  /* ===== Konstanta & penyimpanan ===== */
  var KEY_ENTRIES = 'jurnalPKL.smkn2cipatujah.entries.v1';
  var KEY_PROFILE = 'jurnalPKL.smkn2cipatujah.profile.v1';
  var memory = {};

  function warnStorage() {
    var w = document.getElementById('storage-warn');
    if (w) w.style.display = 'block';
  }
  function storeSet(key, value) {
    try { localStorage.setItem(key, value); memory[key] = value; return true; }
    catch (e) { memory[key] = value; warnStorage(); return false; }
  }
  function storeGet(key) {
    try {
      var v = localStorage.getItem(key);
      if (v !== null) return v;
    } catch (e) { warnStorage(); }
    return Object.prototype.hasOwnProperty.call(memory, key) ? memory[key] : null;
  }

  /* ===== Data contoh (FIKTIF) ===== */
  var DEFAULT_PROFILE = {
    nama: 'Andi Pratama (contoh)',
    kelas: 'XI RPL',
    instansi: 'CV Nusantara Digital Solusi (contoh fiktif)',
    pembimbing: 'Bapak Rudi Hartono (contoh fiktif)',
    mulai: '2026-07-20',
    selesai: '2026-12-18'
  };

  function dummyEntries() {
    return [
      { id: 'dummy-1', dummy: true, date: '2026-10-19', start: '08:00', end: '16:00',
        uraian: 'Orientasi tim, pengenalan alur kerja pengembangan aplikasi, dan instalasi XAMPP serta VS Code.',
        hasil: 'Memahami struktur tim dan alur kerja. Mampu menyiapkan lingkungan pengembangan web lokal.',
        kendala: 'Port Apache bentrok dengan aplikasi lain.',
        tindak: 'Mengubah port Apache dan mencatat langkahnya sebagai dokumentasi.' },
      { id: 'dummy-2', dummy: true, date: '2026-10-20', start: '08:00', end: '16:00',
        uraian: 'Membuat tampilan halaman daftar produk menggunakan HTML dan CSS sesuai desain dari tim UI.',
        hasil: 'Menguasai CSS Grid dan Flexbox untuk layout responsif.',
        kendala: 'Tampilan belum rapi di layar HP.',
        tindak: 'Mempelajari media query dan menguji di mode responsif browser.' },
      { id: 'dummy-3', dummy: true, date: '2026-10-21', start: '08:00', end: '15:30',
        uraian: 'Membuat basis data sederhana untuk data pelanggan dan menulis query SELECT, INSERT, UPDATE.',
        hasil: 'Memahami relasi antar tabel dan penggunaan JOIN.',
        kendala: '',
        tindak: 'Berlatih query dengan kondisi yang lebih kompleks.' },
      { id: 'dummy-4', dummy: true, date: '2026-10-22', start: '08:00', end: '16:00',
        uraian: 'Memperbaiki bug pada form pendaftaran dan menambahkan validasi input di sisi klien.',
        hasil: 'Mampu menelusuri bug menggunakan console browser dan menulis validasi JavaScript.',
        kendala: 'Sulit menemukan penyebab pesan error yang tidak muncul.',
        tindak: 'Berdiskusi dengan pembimbing dan mempelajari cara debugging yang sistematis.' },
      { id: 'dummy-5', dummy: true, date: '2026-10-23', start: '08:00', end: '14:00',
        uraian: 'Belajar dasar Git: membuat repository, commit, branch, dan menggabungkan perubahan.',
        hasil: 'Memahami alur kerja version control untuk kerja tim.',
        kendala: 'Terjadi konflik saat merge.',
        tindak: 'Berlatih menyelesaikan konflik merge pada repository latihan.' },
      { id: 'dummy-6', dummy: true, date: '2026-10-26', start: '08:00', end: '16:00',
        uraian: 'Menyusun dokumentasi singkat fitur yang telah dikerjakan dan mengikuti rapat evaluasi mingguan.',
        hasil: 'Mampu menulis dokumentasi teknis yang ringkas dan menyampaikan progres kerja.',
        kendala: '',
        tindak: 'Menyiapkan bahan presentasi progres untuk minggu depan.' }
    ];
  }

  /* ===== State ===== */
  var entries = [];
  var profile = {};
  var editingId = null;
  var pendingConfirm = null;

  function loadState() {
    var rawP = storeGet(KEY_PROFILE);
    profile = Object.assign({}, DEFAULT_PROFILE);
    if (rawP) {
      try {
        var p = JSON.parse(rawP);
        if (p && typeof p === 'object') {
          Object.keys(DEFAULT_PROFILE).forEach(function (k) {
            if (typeof p[k] === 'string' && p[k]) profile[k] = p[k];
          });
        }
      } catch (e) { /* abaikan, pakai default */ }
    }

    var rawE = storeGet(KEY_ENTRIES);
    if (rawE === null) {
      entries = dummyEntries();      // pertama kali dibuka: isi data contoh
      saveEntries();
    } else {
      try {
        var arr = JSON.parse(rawE);
        entries = Array.isArray(arr) ? arr.map(sanitizeEntry).filter(Boolean) : [];
      } catch (e) {
        entries = [];
        toast('Data tersimpan tidak terbaca, daftar dimulai kosong.', 'error');
      }
    }
  }
  function saveEntries() { return storeSet(KEY_ENTRIES, JSON.stringify(entries)); }
  function saveProfile() { return storeSet(KEY_PROFILE, JSON.stringify(profile)); }

  function sanitizeEntry(e) {
    if (!e || typeof e !== 'object') return null;
    var date = String(e.date || '');
    var start = String(e.start || '');
    var end = String(e.end || '');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end)) return null;
    return {
      id: String(e.id || uid()),
      dummy: e.dummy === true,
      date: date, start: start, end: end,
      uraian: String(e.uraian || '').slice(0, 1000),
      hasil: String(e.hasil || '').slice(0, 1000),
      kendala: String(e.kendala || '').slice(0, 1000),
      tindak: String(e.tindak || '').slice(0, 1000)
    };
  }

  /* ===== Util ===== */
  function $(id) { return document.getElementById(id); }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function todayISO() {
    var d = new Date();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + day;
  }
  function parseISO(iso) {
    var p = iso.split('-');
    return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
  }
  function validISODate(iso) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
    var d = parseISO(iso);
    return !isNaN(d.getTime()) && d.getFullYear() === Number(iso.slice(0, 4));
  }
  function fmtDate(iso) {
    try {
      return parseISO(iso).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    } catch (e) { return iso; }
  }
  function fmtDateLong(iso) {
    try {
      return parseISO(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch (e) { return iso; }
  }
  function toMin(t) {
    var p = t.split(':');
    return Number(p[0]) * 60 + Number(p[1]);
  }
  function fmtDur(min) {
    if (min <= 0) return '0 menit';
    var h = Math.floor(min / 60), m = min % 60;
    if (h && m) return h + ' jam ' + m + ' menit';
    if (h) return h + ' jam';
    return m + ' menit';
  }
  function fmtHours(min) {
    var h = min / 60;
    return (Math.round(h * 10) / 10).toString().replace('.', ',');
  }

  /* ===== Toast ===== */
  function toast(msg, type) {
    var box = $('toasts');
    var el = document.createElement('div');
    el.className = 'toast ' + (type || 'info');
    el.setAttribute('role', type === 'error' ? 'alert' : 'status');
    el.textContent = msg;
    box.appendChild(el);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, type === 'error' ? 5000 : 3200);
  }

  /* ===== Modal ===== */
  var lastFocus = null;
  function openModal(id) {
    lastFocus = document.activeElement;
    $(id).classList.add('open');
  }
  function closeModal(id) {
    $(id).classList.remove('open');
    if (lastFocus && typeof lastFocus.focus === 'function') { try { lastFocus.focus(); } catch (e) { /* abaikan */ } }
  }
  function askConfirm(title, message, okLabel, onOk) {
    $('mc-title').textContent = title;
    $('mc-msg').textContent = message;
    $('mc-ok').textContent = okLabel || 'Ya, Hapus';
    pendingConfirm = onOk;
    openModal('modal-confirm');
    $('mc-cancel').focus();
  }
  function closeConfirm() { pendingConfirm = null; closeModal('modal-confirm'); }

  /* ===== Identitas ===== */
  function renderProfile() {
    $('id-nama').textContent = profile.nama;
    $('id-kelas').textContent = profile.kelas;
    $('id-instansi').textContent = profile.instansi;
    $('id-pembimbing').textContent = profile.pembimbing;
    $('id-periode').textContent = fmtDateLong(profile.mulai) + ' \u2013 ' + fmtDateLong(profile.selesai);
    $('sign-pembimbing').textContent = profile.pembimbing;
    $('sign-siswa').textContent = profile.nama;
  }

  function setPErr(id, msg) { $('pe-' + id).textContent = msg || ''; }
  function openProfile() {
    $('p-nama').value = profile.nama;
    $('p-kelas').value = profile.kelas;
    $('p-instansi').value = profile.instansi;
    $('p-pembimbing').value = profile.pembimbing;
    $('p-mulai').value = profile.mulai;
    $('p-selesai').value = profile.selesai;
    ['nama', 'kelas', 'instansi', 'pembimbing', 'mulai', 'selesai'].forEach(function (k) { setPErr(k, ''); });
    openModal('modal-profile');
    $('p-nama').focus();
  }
  function submitProfile(ev) {
    ev.preventDefault();
    var v = {
      nama: $('p-nama').value.trim(),
      kelas: $('p-kelas').value.trim(),
      instansi: $('p-instansi').value.trim(),
      pembimbing: $('p-pembimbing').value.trim(),
      mulai: $('p-mulai').value,
      selesai: $('p-selesai').value
    };
    var bad = false;
    ['nama', 'kelas', 'instansi', 'pembimbing'].forEach(function (k) {
      if (!v[k]) { setPErr(k, 'Wajib diisi.'); bad = true; } else setPErr(k, '');
    });
    if (!validISODate(v.mulai)) { setPErr('mulai', 'Tanggal mulai tidak valid.'); bad = true; } else setPErr('mulai', '');
    if (!validISODate(v.selesai)) { setPErr('selesai', 'Tanggal selesai tidak valid.'); bad = true; } else setPErr('selesai', '');
    if (!bad && v.selesai < v.mulai) { setPErr('selesai', 'Tanggal selesai tidak boleh sebelum tanggal mulai.'); bad = true; }
    if (bad) { toast('Gagal menyimpan identitas: periksa isian yang bertanda merah.', 'error'); return; }
    profile = v;
    var ok = saveProfile();
    renderProfile();
    closeModal('modal-profile');
    toast(ok ? 'Identitas berhasil disimpan.' : 'Identitas diperbarui, tetapi tidak dapat disimpan permanen di browser ini.', ok ? 'success' : 'error');
  }

  /* ===== Form jurnal ===== */
  var FIELDS = ['date', 'start', 'end', 'uraian', 'hasil', 'kendala', 'tindak'];
  function fieldEl(k) { return $('f-' + k); }
  function setErr(k, msg) {
    $('e-' + k).textContent = msg || '';
    var el = fieldEl(k);
    if (msg) el.setAttribute('aria-invalid', 'true'); else el.removeAttribute('aria-invalid');
  }
  function clearErrors() { FIELDS.forEach(function (k) { setErr(k, ''); }); }

  function readForm() {
    return {
      date: fieldEl('date').value,
      start: fieldEl('start').value,
      end: fieldEl('end').value,
      uraian: fieldEl('uraian').value.trim(),
      hasil: fieldEl('hasil').value.trim(),
      kendala: fieldEl('kendala').value.trim(),
      tindak: fieldEl('tindak').value.trim()
    };
  }
  function validate(d) {
    var errs = {};
    if (!d.date) errs.date = 'Tanggal wajib diisi.';
    else if (!validISODate(d.date)) errs.date = 'Tanggal tidak valid.';
    if (!d.start) errs.start = 'Jam mulai wajib diisi.';
    if (!d.end) errs.end = 'Jam selesai wajib diisi.';
    if (d.start && d.end && toMin(d.end) <= toMin(d.start)) errs.end = 'Jam selesai harus setelah jam mulai.';
    if (!d.uraian) errs.uraian = 'Uraian pekerjaan wajib diisi.';
    else if (d.uraian.length < 10) errs.uraian = 'Uraian terlalu singkat (minimal 10 karakter).';
    else if (d.uraian.length > 1000) errs.uraian = 'Maksimal 1000 karakter.';
    if (!d.hasil) errs.hasil = 'Hasil/kompetensi wajib diisi.';
    else if (d.hasil.length < 5) errs.hasil = 'Terlalu singkat (minimal 5 karakter).';
    else if (d.hasil.length > 1000) errs.hasil = 'Maksimal 1000 karakter.';
    if (d.kendala.length > 1000) errs.kendala = 'Maksimal 1000 karakter.';
    if (d.tindak.length > 1000) errs.tindak = 'Maksimal 1000 karakter.';
    return errs;
  }

  function resetForm() {
    $('journal-form').reset();
    fieldEl('date').value = todayISO();
    clearErrors();
    editingId = null;
    $('form-title').textContent = 'Tambah Jurnal Harian';
    $('btn-submit').textContent = 'Simpan Jurnal';
    $('btn-cancel').hidden = true;
    $('edit-banner').hidden = true;
  }

  function startEdit(id) {
    var e = findEntry(id);
    if (!e) { toast('Data yang akan diedit tidak ditemukan.', 'error'); return; }
    editingId = id;
    clearErrors();
    FIELDS.forEach(function (k) { fieldEl(k).value = e[k] || ''; });
    $('form-title').textContent = 'Edit Jurnal';
    $('btn-submit').textContent = 'Simpan Perubahan';
    $('btn-cancel').hidden = false;
    $('edit-banner').hidden = false;
    var card = document.querySelector('.form-card');
    if (card && card.scrollIntoView) card.scrollIntoView({ behavior: 'smooth', block: 'start' });
    fieldEl('uraian').focus({ preventScroll: true });
  }

  function findEntry(id) {
    for (var i = 0; i < entries.length; i++) if (entries[i].id === id) return entries[i];
    return null;
  }

  function submitForm(ev) {
    ev.preventDefault();
    var d = readForm();
    var errs = validate(d);
    clearErrors();
    var keys = Object.keys(errs);
    if (keys.length) {
      keys.forEach(function (k) { setErr(k, errs[k]); });
      toast('Gagal menyimpan: periksa isian yang bertanda merah.', 'error');
      var first = FIELDS.filter(function (k) { return errs[k]; })[0];
      if (first) fieldEl(first).focus();
      return;
    }

    var savedId;
    var wasEdit = !!editingId;
    if (editingId) {
      var e = findEntry(editingId);
      if (!e) { toast('Gagal: data yang diedit sudah tidak ada.', 'error'); resetForm(); return; }
      e.date = d.date; e.start = d.start; e.end = d.end;
      e.uraian = d.uraian; e.hasil = d.hasil; e.kendala = d.kendala; e.tindak = d.tindak;
      savedId = e.id;
    } else {
      savedId = uid();
      entries.push({
        id: savedId, dummy: false, date: d.date, start: d.start, end: d.end,
        uraian: d.uraian, hasil: d.hasil, kendala: d.kendala, tindak: d.tindak
      });
    }
    var persisted = saveEntries();
    resetForm();
    render();

    var hidden = getVisible().filter(function (x) { return x.id === savedId; }).length === 0;
    var msg = wasEdit ? 'Jurnal berhasil diperbarui.' : 'Jurnal berhasil ditambahkan.';
    if (hidden) msg += ' (Tidak tampil karena pencarian/filter aktif.)';
    if (!persisted) {
      toast(msg + ' Namun penyimpanan permanen di browser gagal.', 'error');
    } else {
      toast(msg, 'success');
    }
  }

  /* ===== Hapus ===== */
  function requestDelete(id) {
    var e = findEntry(id);
    if (!e) { toast('Data tidak ditemukan.', 'error'); return; }
    var ringkas = e.uraian.length > 80 ? e.uraian.slice(0, 80) + '\u2026' : e.uraian;
    askConfirm(
      'Hapus jurnal ini?',
      'Jurnal tanggal ' + fmtDateLong(e.date) + ' ("' + ringkas + '") akan dihapus permanen dan tidak dapat dikembalikan.',
      'Ya, Hapus',
      function () {
        entries = entries.filter(function (x) { return x.id !== id; });
        if (editingId === id) resetForm();
        var ok = saveEntries();
        render();
        toast(ok ? 'Jurnal berhasil dihapus.' : 'Jurnal dihapus, tetapi penyimpanan permanen gagal.', ok ? 'success' : 'error');
      }
    );
  }
  function requestDeleteDummy() {
    var n = entries.filter(function (e) { return e.dummy; }).length;
    if (!n) { toast('Tidak ada data contoh yang tersisa.', 'info'); return; }
    askConfirm(
      'Hapus semua data contoh?',
      n + ' jurnal contoh (fiktif) akan dihapus. Jurnal yang kamu buat sendiri tidak ikut terhapus.',
      'Ya, Hapus Contoh',
      function () {
        var ids = entries.filter(function (e) { return e.dummy; }).map(function (e) { return e.id; });
        entries = entries.filter(function (e) { return !e.dummy; });
        if (editingId && ids.indexOf(editingId) !== -1) resetForm();
        var ok = saveEntries();
        render();
        toast(ok ? n + ' data contoh berhasil dihapus.' : 'Data contoh dihapus, tetapi penyimpanan permanen gagal.', ok ? 'success' : 'error');
      }
    );
  }

  /* ===== Cari, filter, urut ===== */
  function filterState() {
    return {
      q: $('q').value.trim().toLowerCase(),
      from: $('f-from').value,
      to: $('f-to').value,
      sort: $('sort').value
    };
  }
  function rangeInvalid(s) { return !!(s.from && s.to && s.from > s.to); }

  function getVisible() {
    var s = filterState();
    if (rangeInvalid(s)) return [];
    var list = entries.filter(function (e) {
      if (s.from && e.date < s.from) return false;
      if (s.to && e.date > s.to) return false;
      if (s.q) {
        var hay = [e.uraian, e.hasil, e.kendala, e.tindak, e.date, fmtDate(e.date)].join(' ').toLowerCase();
        if (hay.indexOf(s.q) === -1) return false;
      }
      return true;
    });
    list.sort(function (a, b) {
      var ka = a.date + ' ' + a.start, kb = b.date + ' ' + b.start;
      if (ka === kb) return 0;
      var cmp = ka < kb ? -1 : 1;
      return s.sort === 'asc' ? cmp : -cmp;
    });
    return list;
  }

  /* ===== Render ===== */
  function render() {
    var s = filterState();
    var visible = getVisible();
    var filtering = !!(s.q || s.from || s.to);

    // Rekap
    var days = {};
    var totalMin = 0;
    entries.forEach(function (e) {
      days[e.date] = true;
      totalMin += Math.max(0, toMin(e.end) - toMin(e.start));
    });
    $('st-total').textContent = entries.length;
    $('st-hari').textContent = Object.keys(days).length;
    $('st-jam').textContent = fmtHours(totalMin);
    $('st-tampil').textContent = visible.length;

    // Catatan filter
    var note = $('filter-note');
    note.className = 'toolbar-note';
    var info = [];
    if (s.q) info.push('kata kunci "' + $('q').value.trim() + '"');
    if (s.from) info.push('dari ' + fmtDateLong(s.from));
    if (s.to) info.push('sampai ' + fmtDateLong(s.to));
    if (rangeInvalid(s)) {
      note.classList.add('warn');
      note.textContent = 'Rentang tanggal tidak valid: tanggal "dari" lebih besar daripada "sampai".';
    } else {
      note.textContent = 'Menampilkan ' + visible.length + ' dari ' + entries.length + ' jurnal' +
        (filtering ? ' (' + info.join(', ') + ').' : '.');
    }
    $('print-info').textContent = 'Jumlah jurnal pada cetakan: ' + visible.length + ' dari ' + entries.length +
      (filtering ? ' | Filter: ' + info.join(', ') : '') + ' | Dicetak: ' + fmtDateLong(todayISO());

    var box = $('entries');
    if (!visible.length) {
      if (!entries.length) {
        box.innerHTML =
          '<div class="empty"><div class="emoji" aria-hidden="true">\uD83D\uDCD3</div>' +
          '<h3>Belum ada jurnal</h3>' +
          '<p>Isi formulir untuk menambahkan jurnal PKL pertamamu, atau muat data contoh untuk melihat tampilannya.</p>' +
          '<button type="button" class="btn btn-outline" data-act="seed">Muat Data Contoh</button></div>';
      } else {
        box.innerHTML =
          '<div class="empty"><div class="emoji" aria-hidden="true">\uD83D\uDD0D</div>' +
          '<h3>Tidak ada jurnal yang cocok</h3>' +
          '<p>Coba ubah kata kunci atau rentang tanggal.</p>' +
          '<button type="button" class="btn btn-outline" data-act="reset-filter">Reset Pencarian &amp; Filter</button></div>';
      }
    } else {
      box.innerHTML = visible.map(entryHTML).join('');
    }

    $('btn-del-dummy').disabled = !entries.some(function (e) { return e.dummy; });
    $('btn-print').disabled = false;
  }

  function entryHTML(e) {
    var dur = fmtDur(toMin(e.end) - toMin(e.start));
    return '<article class="entry" data-id="' + esc(e.id) + '">' +
      '<div class="entry-head"><div>' +
        '<h3>' + esc(fmtDate(e.date)) + (e.dummy ? '<span class="badge">Contoh</span>' : '') + '</h3>' +
        '<p class="entry-time">' + esc(e.start) + ' \u2013 ' + esc(e.end) + ' (' + esc(dur) + ')</p>' +
      '</div><div class="actions no-print">' +
        '<button type="button" class="btn btn-outline btn-sm" data-act="edit" aria-label="Edit jurnal tanggal ' + esc(fmtDateLong(e.date)) + '">Edit</button>' +
        '<button type="button" class="btn btn-danger btn-sm" data-act="delete" aria-label="Hapus jurnal tanggal ' + esc(fmtDateLong(e.date)) + '">Hapus</button>' +
      '</div></div>' +
      '<dl>' +
        '<div><dt>Uraian Pekerjaan</dt><dd>' + esc(e.uraian) + '</dd></div>' +
        '<div><dt>Hasil / Kompetensi yang Dipelajari</dt><dd>' + esc(e.hasil) + '</dd></div>' +
        '<div><dt>Kendala</dt><dd>' + (e.kendala ? esc(e.kendala) : '-') + '</dd></div>' +
        '<div><dt>Rencana Tindak Lanjut</dt><dd>' + (e.tindak ? esc(e.tindak) : '-') + '</dd></div>' +
      '</dl></article>';
  }

  /* ===== Ekspor / Impor ===== */
  function exportJSON() {
    if (!entries.length) { toast('Belum ada data untuk diekspor.', 'info'); return; }
    try {
      var payload = JSON.stringify({ aplikasi: 'Jurnal PKL RPL - SMKN 2 Cipatujah', versi: 1, profil: profile, jurnal: entries }, null, 2);
      var blob = new Blob([payload], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'cadangan-jurnal-pkl-' + todayISO() + '.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      toast('Cadangan berhasil dibuat.', 'success');
    } catch (e) {
      toast('Gagal membuat cadangan.', 'error');
    }
  }
  function importJSON(file) {
    if (!file) return;
    var reader = new FileReader();
    reader.onerror = function () { toast('Gagal membaca berkas.', 'error'); };
    reader.onload = function () {
      try {
        var data = JSON.parse(String(reader.result));
        var list = Array.isArray(data) ? data : (data && data.jurnal);
        if (!Array.isArray(list)) throw new Error('format');
        var clean = list.map(sanitizeEntry).filter(Boolean);
        if (!clean.length) { toast('Berkas tidak berisi jurnal yang valid.', 'error'); return; }
        var ids = {};
        entries.forEach(function (e) { ids[e.id] = true; });
        var added = 0;
        clean.forEach(function (e) {
          if (ids[e.id]) e.id = uid();
          ids[e.id] = true;
          entries.push(e);
          added++;
        });
        saveEntries();
        render();
        toast(added + ' jurnal berhasil diimpor.', 'success');
      } catch (e) {
        toast('Gagal impor: berkas bukan cadangan jurnal yang valid.', 'error');
      }
    };
    reader.readAsText(file);
  }

  /* ===== Event ===== */
  function resetFilters() {
    $('q').value = '';
    $('f-from').value = '';
    $('f-to').value = '';
    $('sort').value = 'desc';
    render();
  }

  function init() {
    loadState();
    renderProfile();
    resetForm();
    render();

    $('journal-form').addEventListener('submit', submitForm);
    $('btn-reset').addEventListener('click', function () {
      if (editingId) { fieldEl('uraian').value = ''; }
      var keepId = editingId;
      resetForm();
      if (keepId) startEdit(keepId);
    });
    $('btn-cancel').addEventListener('click', function () {
      resetForm();
      toast('Edit dibatalkan.', 'info');
    });

    // Kolom cari hanya 'input' (bukan 'change'): 'change' terpicu saat blur dan me-render ulang
    // daftar di antara mousedown dan mouseup sehingga klik tombol di daftar bisa hilang.
    $('q').addEventListener('input', render);
    ['input', 'change'].forEach(function (evt) {
      $('f-from').addEventListener(evt, render);
      $('f-to').addEventListener(evt, render);
      $('sort').addEventListener(evt, render);
    });
    $('btn-clear-filter').addEventListener('click', function () { resetFilters(); toast('Pencarian dan filter direset.', 'info'); });

    $('entries').addEventListener('click', function (ev) {
      var btn = ev.target.closest ? ev.target.closest('[data-act]') : null;
      if (!btn) return;
      var act = btn.getAttribute('data-act');
      if (act === 'seed') {
        entries = dummyEntries();
        saveEntries();
        render();
        toast('Data contoh dimuat.', 'success');
        return;
      }
      if (act === 'reset-filter') { resetFilters(); return; }
      var art = btn.closest('.entry');
      if (!art) return;
      var id = art.getAttribute('data-id');
      if (act === 'edit') startEdit(id);
      else if (act === 'delete') requestDelete(id);
    });

    $('btn-del-dummy').addEventListener('click', requestDeleteDummy);
    $('btn-export').addEventListener('click', exportJSON);
    $('btn-import').addEventListener('click', function () { $('file-import').click(); });
    $('file-import').addEventListener('change', function (ev) {
      importJSON(ev.target.files && ev.target.files[0]);
      ev.target.value = '';
    });

    $('btn-print').addEventListener('click', function () {
      if (!getVisible().length) {
        toast('Tidak ada jurnal untuk dicetak. Tambahkan data atau reset filter.', 'error');
        return;
      }
      render();
      window.print();
    });

    $('btn-profile').addEventListener('click', openProfile);
    $('profile-form').addEventListener('submit', submitProfile);
    $('mp-cancel').addEventListener('click', function () { closeModal('modal-profile'); });

    $('mc-cancel').addEventListener('click', closeConfirm);
    $('mc-ok').addEventListener('click', function () {
      var fn = pendingConfirm;
      closeConfirm();
      if (typeof fn === 'function') fn();
    });

    ['modal-confirm', 'modal-profile'].forEach(function (id) {
      $(id).addEventListener('click', function (ev) {
        if (ev.target === $(id)) { if (id === 'modal-confirm') closeConfirm(); else closeModal(id); }
      });
    });
    document.addEventListener('keydown', function (ev) {
      if (ev.key !== 'Escape') return;
      if ($('modal-confirm').classList.contains('open')) closeConfirm();
      else if ($('modal-profile').classList.contains('open')) closeModal('modal-profile');
    });

    window.addEventListener('beforeprint', render);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
