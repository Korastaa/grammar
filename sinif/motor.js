/* Sınıf görevleri · öğrenci motoru
   Veri: window.HAFTA_VERI (hN-veri.js) · Adres: window.SINIF_AYAR.url (ayar.js)
   Akış: ad + numara → slayttaki kod → görev → Gönder → kod ekranına dönüş.
   Doğru cevap bu sayfada yok; cevaplar öğretmen paneline ve tabloya gider. */
(function () {
  'use strict';
  var V = window.HAFTA_VERI, AYAR = window.SINIF_AYAR || {};
  var KOK = document.getElementById('app');
  if (!V || !V.gorevler) { KOK.textContent = 'Görev verisi yüklenemedi. Sayfayı yenile.'; return; }
  var HARF = 'ABCDE';
  var ON = 'sinif_h' + V.hafta + '_';
  var oturum = Math.random().toString(36).slice(2, 10);
  var BELLEK = {};   // depolama kapalıysa (gizli sekme, çerez engeli) sayfa açık kaldıkça burada tutulur

  function oku(k, d) {
    try { var v = localStorage.getItem(ON + k); if (v != null) return JSON.parse(v); } catch (e) {}
    return Object.prototype.hasOwnProperty.call(BELLEK, k) ? JSON.parse(BELLEK[k]) : d;
  }
  function yaz(k, v) { BELLEK[k] = JSON.stringify(v); try { localStorage.setItem(ON + k, JSON.stringify(v)); } catch (e) {} }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function kac(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function bosluklu(s) { return kac(s).replace(/----/g, '<span class="bos"></span>'); }
  function isaretli(s, w) {
    var i = s.lastIndexOf(w);
    if (i < 0) return kac(s);
    return kac(s.slice(0, i)) + '<span class="isaret">' + kac(w) + '</span>' + kac(s.slice(i + w.length));
  }
  function romen(s) { return kac(s).replace(/\((I{1,3}|IV|V)\)/g, '<b style="color:var(--or)">($1)</b>'); }

  /* ---------- gönderim ve kuyruk ---------- */
  function gonder(paket) {
    var kuyruk = oku('kuyruk', []);
    paket.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    kuyruk.push(paket);
    yaz('kuyruk', kuyruk);
    setTimeout(bosalt, Math.floor(Math.random() * 3000));   // herkes aynı anda basınca istekler yayılsın
  }
  function istek(p, mod) {
    var ctl = window.AbortController ? new AbortController() : null;
    var t = ctl ? setTimeout(function () { ctl.abort(); }, 15000) : null;
    var o = { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(p) };
    if (mod) o.mode = mod;
    if (ctl) o.signal = ctl.signal;
    return fetch(AYAR.url, o).then(function (r) { if (t) clearTimeout(t); return r; }, function (e) { if (t) clearTimeout(t); throw e; });
  }
  var bosaltiliyor = false;
  function bosalt() {
    if (bosaltiliyor || !AYAR.url) return;
    var kuyruk = oku('kuyruk', []);
    if (!kuyruk.length) return;
    bosaltiliyor = true;
    var p = kuyruk[0];
    function tamam() {
      var k = oku('kuyruk', []).filter(function (x) { return x.id !== p.id; }); yaz('kuyruk', k);
      bosaltiliyor = false; if (k.length) setTimeout(bosalt, 300);
    }
    function sonra() { bosaltiliyor = false; }
    istek(p).then(function (r) { return r.text(); }).then(function (txt) {
      if (/^ok/.test(txt)) tamam(); else sonra();          // "hata" (ör. tablo meşgul) → 15 sn sonra yeniden
    }).catch(function (e) {
      if (e && e.name === 'AbortError') { sonra(); return; }
      // yanıt okunamıyorsa (tarayıcı CORS'a izin vermedi) bir kez okunmadan gönder
      istek(p, 'no-cors').then(tamam, sonra);
    });
  }
  setInterval(bosalt, 15000);
  window.addEventListener('online', bosalt);

  /* ---------- ekranlar ---------- */
  function ust() {
    var o = oku('ogr', null);
    var d = el('div', 'top');
    d.appendChild(el('div', null, 'Hafta ' + V.hafta + ' · <b>' + kac(V.ad) + '</b>'));
    if (o) {
      var b = el('button', 'link', kac(o.ad) + ' · ' + kac(o.no) + ' ✎');
      b.onclick = giris; d.appendChild(b);
    }
    return d;
  }

  function giris() {
    var o = oku('ogr', { ad: '', no: '' });
    KOK.innerHTML = '';
    var w = el('div', 'w'); KOK.appendChild(w);
    w.appendChild(ust());
    w.appendChild(el('div', 'eb', 'Sınıf görevleri'));
    w.appendChild(el('h1', null, 'Adın ve numaran'));
    w.appendChild(el('p', 'not', 'Bir kez yazman yeter; bu telefon hatırlar.'));
    var c = el('div', 'card');
    c.appendChild(el('label', null, 'Ad Soyad'));
    var a = el('input'); a.type = 'text'; a.value = o.ad; a.autocomplete = 'name'; c.appendChild(a);
    c.appendChild(el('label', null, 'Numaran'));
    var n = el('input'); n.type = 'text'; n.inputMode = 'numeric'; n.value = o.no; c.appendChild(n);
    var sube = o.sube || '';
    if (AYAR.subeler && AYAR.subeler.length) {
      c.appendChild(el('label', null, 'Sınıfın'));
      var ch = cipler(c, AYAR.subeler, function (t) { sube = t; });
      Array.prototype.forEach.call(ch.children, function (x) { if (x.textContent === sube) x.classList.add('on'); });
    }
    var h = el('div', 'hata'); c.appendChild(h);
    w.appendChild(c);
    var b = el('button', 'btn', 'Devam');
    b.onclick = function () {
      if (a.value.trim().length < 3 || !n.value.trim()) { h.textContent = 'Ad soyad ve numara gerekli.'; return; }
      if (AYAR.subeler && AYAR.subeler.length && !sube) { h.textContent = 'Sınıfını seç.'; return; }
      yaz('ogr', { ad: a.value.trim(), no: n.value.trim(), sube: sube });
      kodEkrani();
    };
    w.appendChild(b);
  }

  function kodEkrani(mesaj) {
    if (!oku('ogr', null)) return giris();
    KOK.innerHTML = '';
    var w = el('div', 'w'); KOK.appendChild(w);
    w.appendChild(ust());
    if (mesaj) {
      var t = el('div', 'tamam');
      t.appendChild(el('div', 'ik', '✓'));
      t.appendChild(el('h1', null, 'Gönderildi'));
      t.appendChild(el('p', 'not', 'Ekrana bak. Sıradaki görevin kodu slaytta çıkınca buraya yaz.'));
      w.appendChild(t);
    } else {
      w.appendChild(el('div', 'eb', 'Görev'));
      w.appendChild(el('h1', null, 'Slayttaki kodu yaz'));
    }
    var c = el('div', 'card');
    var g = el('input', 'kodgir'); g.type = 'text'; g.maxLength = 3; g.autocomplete = 'off'; g.spellcheck = false;
    g.setAttribute('autocapitalize', 'characters'); g.setAttribute('autocorrect', 'off');
    g.setAttribute('aria-label', 'Görev kodu');
    c.appendChild(g);
    var h = el('div', 'hata'); c.appendChild(h);
    var gon = oku('gonderilen', {});
    var bitti = V.gorevler.filter(function (x) { return gon[x.kod]; });
    if (bitti.length) {
      c.appendChild(el('div', 'not', 'Gönderdiklerin:'));
      var l = el('div', 'liste');
      bitti.forEach(function (x) { l.appendChild(el('span', null, 'D' + x.ders + ' · ' + kac(x.ad))); });
      c.appendChild(l);
    }
    var kq = oku('kuyruk', []);
    if (kq.length) c.appendChild(el('div', 'bekle', kq.length + ' gönderim internet bekliyor; bağlantı gelince kendiliğinden gider.'));
    w.appendChild(c);
    var b = el('button', 'btn', 'Aç');
    function ac() {
      var k = g.value.trim().toUpperCase().replace(/[İI]/g, 'I');
      var gr = V.gorevler.filter(function (x) { return x.kod === k; })[0];
      if (!gr) { h.textContent = 'Bu kod yok. Slayttaki kodu tekrar kontrol et.'; return; }
      gorevEkrani(gr);
    }
    b.onclick = ac;
    g.addEventListener('keydown', function (e) { if (e.key === 'Enter') ac(); });
    w.appendChild(b);
    if (!mesaj) setTimeout(function () { g.focus(); }, 50);
  }

  /* ---------- görev ---------- */
  function gorevEkrani(gr) {
    KOK.innerHTML = '';
    var w = el('div', 'w'); KOK.appendChild(w);
    w.appendChild(ust());
    w.appendChild(el('div', 'eb', 'Ders ' + gr.ders + ' · kod ' + gr.kod));
    w.appendChild(el('h1', null, kac(gr.ad)));
    if (oku('gonderilen', {})[gr.kod]) w.appendChild(el('p', 'not', 'Bu görevi daha önce gönderdin. Yeniden gönderirsen son cevabın sayılır.'));
    var durum = gr.maddeler.map(function () { return { cevap: null, bas: Date.now(), sure: 0 }; });
    var gonderBtn = el('button', 'btn', 'Gönder');
    function kontrol() {
      var eksik = gr.maddeler.some(function (m, i) { return !m.yildiz && !durum[i].cevap; });
      gonderBtn.disabled = eksik;
      gonderBtn.textContent = eksik ? 'Eksik var: şıkları seç, yazı alanlarını doldur' : 'Gönder';
    }
    gr.maddeler.forEach(function (m, i) {
      var c = el('div', 'card' + (m.yildiz ? ' yildiz' : ''));
      c.appendChild(el('div', 'not', '<span class="mno">' + kac(m.id) + '</span>' + (m.yildiz ? 'erken bitirene · istersen' : '')));
      var set = function (v) { durum[i].cevap = v; durum[i].sure = Date.now() - durum[i].bas; kontrol(); };
      var anlik = function (madde, cevap) {   // tahmin kilitlenince hemen gider: panel tahminleri şıklardan önce görür
        var o = oku('ogr', {});
        gonder({ hafta: V.hafta, ders: gr.ders, gorev: gr.kod, ogrenci: o.ad, no: o.no, sube: o.sube || '', oturum: oturum, kayitlar: [{ madde: madde, cevap: cevap, sure: Date.now() - durum[i].bas }] });
      };
      CIZ[m.tur](c, m, set, anlik);
      w.appendChild(c);
    });
    var alt = el('div', 'alt'); var ic = el('div', 'in'); alt.appendChild(ic);
    var geri = el('button', 'btn ikinci', 'Kod ekranına dön'); geri.style.marginBottom = '8px';
    geri.onclick = function () {
      if (durum.some(function (d) { return d.cevap; }) && !window.confirm('Cevapların gönderilmedi. Çıkarsan silinecek. Çıkılsın mı?')) return;
      kodEkrani();
    };
    ic.appendChild(gonderBtn);
    w.appendChild(geri);
    KOK.appendChild(alt);
    gonderBtn.onclick = function () {
      var o = oku('ogr', {});
      var kayit = [];
      gr.maddeler.forEach(function (m, i) { if (durum[i].cevap) kayit.push({ madde: m.id, cevap: durum[i].cevap, sure: durum[i].sure }); });
      gonder({ hafta: V.hafta, ders: gr.ders, gorev: gr.kod, ogrenci: o.ad, no: o.no, sube: o.sube || '', oturum: oturum, kayitlar: kayit });
      var gon = oku('gonderilen', {}); gon[gr.kod] = 1; yaz('gonderilen', gon);
      window.scrollTo(0, 0);
      kodEkrani(true);
    };
    kontrol();
    window.scrollTo(0, 0);
  }

  /* ---------- madde türleri ---------- */
  function siklar(kap, m, sec, onSec) {
    var o = el('div', 'opts');
    m.siklar.forEach(function (s, j) {
      var b = el('button', 'opt', '<span class="h">' + HARF[j] + ')</span><span>' + kac(s) + '</span>');
      b.type = 'button';
      b.onclick = function () {
        Array.prototype.forEach.call(o.children, function (x) { x.classList.remove('on'); });
        b.classList.add('on'); onSec(HARF[j]);
      };
      o.appendChild(b);
    });
    kap.appendChild(o);
  }
  function cipler(kap, liste, onSec) {
    var d = el('div', 'chips');
    liste.forEach(function (t) {
      var b = el('button', 'chip', kac(t)); b.type = 'button';
      b.onclick = function () {
        Array.prototype.forEach.call(d.children, function (x) { x.classList.remove('on'); });
        b.classList.add('on'); onSec(t);
      };
      d.appendChild(b);
    });
    kap.appendChild(d);
    return d;
  }
  function ekAlan(kap, etiket, onYaz, cok) {
    kap.appendChild(el('label', null, kac(etiket)));
    var t = el(cok ? 'textarea' : 'input'); if (!cok) t.type = 'text';
    t.addEventListener('input', function () { onYaz(t.value.trim()); });
    kap.appendChild(t);
  }
  function birlestir(a, ek) { return ek ? a + ' | ' + ek : a; }

  var CIZ = {
    secim: function (c, m, set) {
      var html = m.isaret ? isaretli(m.kok, m.isaret) : (/\(I\)/.test(m.kok) ? romen(m.kok) : bosluklu(m.kok));
      c.appendChild(el('p', 'kok', html));
      if (m.soru) c.appendChild(el('div', 'soru', kac(m.soru)));
      var harf = null, ek = '';
      var guncelle = function () { set(harf && (!m.ek || ek) ? birlestir(harf, ek) : null); };
      siklar(c, m, null, function (h) { harf = h; guncelle(); });
      if (m.ek) ekAlan(c, m.ek, function (v) { ek = v; guncelle(); });
    },
    iliski_secim: function (c, m, set) {
      c.appendChild(el('p', 'kok', bosluklu(m.kok)));
      c.appendChild(el('label', null, '1 · İki cümle arasındaki ilişki'));
      var il = null, harf = null;
      var guncelle = function () { set(il && harf ? il + '|' + harf : null); };
      cipler(c, m.iliskiler, function (t) { il = t; guncelle(); });
      c.appendChild(el('label', null, '2 · Bağlaç'));
      siklar(c, m, null, function (h) { harf = h; guncelle(); });
    },
    karar: function (c, m, set) {
      var d = el('div', 'cift');
      d.appendChild(el('div', null, kac(m.sol)));
      d.appendChild(el('div', 'ok', '↓ yeniden yazım'));
      d.appendChild(el('div', null, kac(m.sag)));
      c.appendChild(d);
      c.appendChild(el('label', null, 'Kararın'));
      var k = null, ek = '';
      var guncelle = function () { set(k ? birlestir(k, ek) : null); };
      cipler(c, m.secenekler, function (t) { k = t; guncelle(); });
      ekAlan(c, m.ek + ' (varsa)', function (v) { ek = v; guncelle(); });
    },
    blok: function (c, m, set) {
      var sec = m.bloklar.map(function () { return null; }), ek = '';
      var guncelle = function () { set(sec.every(Boolean) ? birlestir(sec.join(','), ek) : null); };
      m.bloklar.forEach(function (b, j) {
        var d = el('div', 'blok');
        d.appendChild(el('div', 't', '<span class="n">' + (j + 1) + '</span>' + kac(b)));
        cipler(d, m.etiketler, function (t) { sec[j] = t; guncelle(); });
        c.appendChild(d);
      });
      ekAlan(c, m.ek, function (v) { ek = v; guncelle(); }, true);
    },
    sira: function (c, m, set) {
      m.bloklar.forEach(function (b, j) { c.appendChild(el('div', 'blok', '<div class="t"><span class="n">' + (j + 1) + '</span>' + kac(b) + '</div>')); });
      c.appendChild(el('label', null, 'Türkçede blokların sırası: numaralara sırayla dokun'));
      var secilen = [], ek = '';
      var g = el('div', 'sec'); var s = el('div', 'sira');
      var guncelle = function () {
        g.textContent = secilen.join(' – ');
        set(secilen.length === m.bloklar.length ? birlestir(secilen.join('-'), ek) : null);
      };
      m.bloklar.forEach(function (b, j) {
        var bt = el('button', null, String(j + 1)); bt.type = 'button';
        bt.onclick = function () { secilen.push(j + 1); bt.disabled = true; guncelle(); };
        s.appendChild(bt);
      });
      var sil = el('button', null, '↺'); sil.type = 'button'; sil.setAttribute('aria-label', 'Sırayı sil');
      sil.onclick = function () { secilen = []; Array.prototype.forEach.call(s.children, function (x) { x.disabled = false; }); guncelle(); };
      s.appendChild(sil);
      c.appendChild(g); c.appendChild(s);
      if (m.ek) ekAlan(c, m.ek, function (v) { ek = v; guncelle(); }, true);
      else c.appendChild(el('div', 'not', 'Türkçesini sözlü söyleyeceksin; yalnız sırayı gönder.'));
    },
    yazi: function (c, m, set) {
      c.appendChild(el('p', 'kok', '<b>' + kac(m.kok) + '</b>'));
      ekAlan(c, m.ipucu || 'Cevabın', function (v) { set(v || null); }, true);
    },
    tahmin_secim: function (c, m, set, anlik) {
      c.appendChild(el('p', 'kok', bosluklu(m.kok)));
      var t = m.tahminler.map(function () { return ''; });
      var kutu = el('div');
      m.tahminler.forEach(function (et, j) { ekAlan(kutu, (j + 1) + ') ' + et, function (v) { t[j] = v; ac.disabled = !t.every(Boolean); }); });
      c.appendChild(kutu);
      var ac = el('button', 'btn ikinci', 'Tahminimi kilitle, şıkları aç'); ac.disabled = true; ac.style.marginTop = '10px';
      c.appendChild(ac);
      ac.onclick = function () {
        kutu.innerHTML = '';
        kutu.appendChild(el('div', 'kilit', '<b>Tahminin:</b> ' + t.map(kac).join(' · ')));
        if (anlik) anlik(m.id + '-tahmin', t.join(' / '));
        ac.remove();
        c.appendChild(el('div', 'soru', 'Şimdi şıklar: tahminine uyan hangisi?'));
        siklar(c, m, null, function (h) { set(t.join(' / ') + ' | ' + h); });
      };
    }
  };

  bosalt();
  oku('ogr', null) ? kodEkrani() : giris();
})();
