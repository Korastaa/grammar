/* Öğretmen paneli: bir görevin cevaplarını canlı gösterir (5 sn'de bir yeniler).
   Veri: HAFTA_VERI, HAFTA_ANAHTAR, SINIF_AYAR.url → Sinif.gs doGet (JSONP). */
(function () {
  'use strict';
  var V = window.HAFTA_VERI, A = window.HAFTA_ANAHTAR || {}, ET = window.HAFTA_ETIKET || {}, AYAR = window.SINIF_AYAR || {};
  var KOK = document.getElementById('app');
  var HARF = 'ABCDE';
  var ders = 1, secili = null, zaman = null, anahtarAcik = false, sonVeri = [];
  var sube = '';
  function parola() { try { return localStorage.getItem('sinif_okuma') || ''; } catch (e) { return window.__parola || ''; } }
  function parolaYaz(v) { window.__parola = v; try { localStorage.setItem('sinif_okuma', v); } catch (e) {} }
  function el(t, c, h) { var e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; }
  function kac(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function cek(kod, cb) {
    if (!AYAR.url) { cb({ ok: false, hata: 'ayar.js içinde adres yok' }); return; }
    var ad = 'cb' + Date.now() + Math.floor(Math.random() * 1000);
    var s = document.createElement('script');
    var bitti = false;
    function temizle() { delete window[ad]; if (s.parentNode) s.remove(); }
    window[ad] = function (v) { bitti = true; temizle(); cb(v); };
    s.onerror = function () { temizle(); if (!bitti) cb({ ok: false, hata: 'bağlantı kurulamadı' }); };
    setTimeout(function () { if (!bitti) { temizle(); window[ad] = function () {}; cb({ ok: false, hata: 'yanıt gecikti' }); } }, 12000);
    s.src = AYAR.url + '?gorev=' + encodeURIComponent(kod) + '&hafta=' + V.hafta + '&sube=' + encodeURIComponent(sube) +
      '&anahtar=' + encodeURIComponent(parola()) + '&callback=' + ad + '&_=' + Date.now();
    document.body.appendChild(s);
  }

  function cizIskelet() {
    KOK.innerHTML = '';
    var w = el('div', 'pw' + (anahtarAcik ? '' : ' anahtar-kapali')); w.id = 'pw'; KOK.appendChild(w);
    var u = el('div', 'pust');
    u.appendChild(el('div', null, '<div class="eb">Öğretmen paneli</div><h1 style="margin:2px 0">Hafta ' + V.hafta + ' · ' + kac(V.ad) + '</h1>'));
    var ab = el('button', 'btn ikinci', anahtarAcik ? 'Anahtarı gizle' : 'Anahtarı göster');
    ab.style.width = 'auto';
    ab.onclick = function () { anahtarAcik = !anahtarAcik; ab.textContent = anahtarAcik ? 'Anahtarı gizle' : 'Anahtarı göster'; w.classList.toggle('anahtar-kapali', !anahtarAcik); };
    var pb = el('button', 'btn ikinci', 'Okuma anahtarı'); pb.style.width = 'auto'; pb.style.marginLeft = '8px';
    pb.onclick = function () { var v = window.prompt('Sinif.gs içindeki okuma anahtarı:', parola()); if (v != null) { parolaYaz(v.trim()); if (secili) sec(secili); } };
    var sag = el('div'); sag.appendChild(ab); sag.appendChild(pb); u.appendChild(sag);
    w.appendChild(u);
    if (AYAR.subeler && AYAR.subeler.length) {
      var sd = el('div', 'dersler');
      [''].concat(AYAR.subeler).forEach(function (x) {
        var b = el('button', x === sube ? 'on' : '', x ? kac(x) : 'Bütün şubeler');
        b.onclick = function () { sube = x; if (secili) sec(secili); else cizIskelet(); };
        sd.appendChild(b);
      });
      w.appendChild(sd);
    }
    var dd = el('div', 'dersler');
    [1, 2, 3].forEach(function (d) {
      var b = el('button', d === ders ? 'on' : '', 'Ders ' + d);
      b.onclick = function () { ders = d; cizIskelet(); };
      dd.appendChild(b);
    });
    w.appendChild(dd);
    var gl = el('div', 'gorevler');
    V.gorevler.filter(function (g) { return g.ders === ders; }).forEach(function (g) {
      var b = el('button', secili && secili.kod === g.kod ? 'on' : '', '<span class="k">' + g.kod + '</span><br>' + kac(g.ad));
      b.onclick = function () { sec(g); };
      gl.appendChild(b);
    });
    w.appendChild(gl);
    w.appendChild(el('div', null)).id = 'sonuc';
    if (secili) cizSonuc();
  }

  function sec(g) {
    secili = g; sonVeri = [];
    if (zaman) clearInterval(zaman);
    cizIskelet();
    var yenile = function () { cek(g.kod, function (v) {
      if (secili !== g) return;
      if (v.ok) sonVeri = v.satirlar || [];
      cizSonuc(v.ok ? '' : (v.hata === 'okuma anahtarı yanlış' ? 'okuma anahtarı yanlış ya da girilmedi: sağ üstteki "Okuma anahtarı" düğmesi' : v.hata));
    }); };
    yenile(); zaman = setInterval(yenile, 5000);
  }

  function ayir(c) { var i = c.indexOf(' | '); return i < 0 ? [c, ''] : [c.slice(0, i), c.slice(i + 3)]; }
  function cubuk(kap, etiketler, sayim, dogrular, toplam, tuzak) {
    etiketler.forEach(function (e) {
      var n = sayim[e] || 0;
      var r = el('div', 'cub' + (dogrular.indexOf(e) >= 0 ? ' dogru' : ''));
      r.appendChild(el('div', 'ad', kac(e) + (tuzak && tuzak[e] ? '<span class="tz">' + kac(tuzak[e]) + '</span>' : '')));
      var b = el('div', 'bar'); var i = el('i'); i.style.width = (toplam ? Math.round(100 * n / toplam) : 0) + '%'; b.appendChild(i); r.appendChild(b);
      r.appendChild(el('div', 'n', String(n)));
      kap.appendChild(r);
    });
  }
  function yazilar(kap, liste, baslik) {
    if (!liste.length) return;
    if (baslik) kap.appendChild(el('div', 'kk', baslik));
    var d = el('div', 'yazilar');
    liste.forEach(function (x) { d.appendChild(el('div', null, '<b>' + kac(x[0]) + '</b>' + kac(x[1]))); });
    kap.appendChild(d);
  }
  // karar eşikleri (27 Ekim): %60 altı → beceri sonraki hafta çapa maddeyle yeniden açılır; %80 üstü → destek azaltılabilir
  function esik(d, t) {
    if (t < 5) return '';
    var p = 100 * d / t;
    return p < 60 ? ' · <b class="esik alt">eşik altı: sonraki hafta yeniden aç</b>' : (p >= 80 ? ' · <b class="esik ust">eşik üstü: destek azaltılabilir</b>' : '');
  }
  function oran(kap, d, t) { kap.appendChild(el('div', 'oran', t ? 'Doğru: ' + d + ' / ' + t + ' (%' + Math.round(100 * d / t) + ')' + esik(d, t) : '')); }

  function cizSonuc(hata) {
    var k = document.getElementById('sonuc'); if (!k || !secili) return;
    k.innerHTML = '';
    var g = secili, an = A[g.kod] || {};
    var kisiler = {};
    sonVeri.forEach(function (r) { if (!/-tahmin$/.test(r.madde)) kisiler[(r.ogrenci + '|' + r.no).toLowerCase()] = r.ogrenci; });
    var kisiSay = Object.keys(kisiler).length;
    var b = el('div', 'bas');
    b.appendChild(el('div', 'kod', g.kod));
    b.appendChild(el('div', 'say', kisiSay + ' öğrenci gönderdi'));
    b.appendChild(el('div', 'durum', hata ? 'Uyarı: ' + kac(hata) : 'Her 5 saniyede yenilenir'));
    k.appendChild(b);
    k.appendChild(el('div', 'bilgi-anahtar', 'Doğru cevaplar gizli. Tartışmadan sonra "Anahtarı göster".'));
    if (kisiSay) {
      var ii = el('div', 'isim'); Object.keys(kisiler).forEach(function (x) { ii.appendChild(el('span', null, kac(kisiler[x]))); }); k.appendChild(ii);
    }
    g.maddeler.forEach(function (m) {
      var satir = sonVeri.filter(function (r) { return r.madde === m.id; });
      var kap = el('div', 'madde');
      var et = (ET[g.kod] || {})[m.id] || {};
      kap.appendChild(el('h3', null, kac(m.id) + (m.yildiz ? ' · ek madde' : '') + ' <span class="durum">' + satir.length + ' cevap</span>' +
        (et.beceri ? ' <span class="bec">' + kac(et.beceri) + '</span>' : '')));
      var ozet = m.kok || m.sol || (m.bloklar && m.bloklar.join(' ')) || '';
      kap.appendChild(el('div', 'kk', kac(ozet.length > 150 ? ozet.slice(0, 150) + '…' : ozet)));
      var a = an[m.id], t = satir.length, say = {}, dogru = 0, ekler = [];
      if (m.tur === 'secim' || m.tur === 'tahmin_secim') {
        satir.forEach(function (r) {
          var p = ayir(r.cevap), h = m.tur === 'tahmin_secim' ? p[1] : p[0], e = m.tur === 'tahmin_secim' ? p[0] : p[1];
          say[h] = (say[h] || 0) + 1; if (h === a) dogru++; if (e) ekler.push([r.ogrenci, e]);
        });
        if (m.tur === 'tahmin_secim') {   // kilitlenen tahminler şıklardan önce ayrı kayıtla gelir
          var once = sonVeri.filter(function (r) { return r.madde === m.id + '-tahmin'; });
          var bilinen = {}; ekler.forEach(function (x) { bilinen[x[0]] = 1; });
          once.forEach(function (r) { if (!bilinen[r.ogrenci]) ekler.push([r.ogrenci, r.cevap]); });
          kap.querySelector('h3').innerHTML += ' <span class="durum">· ' + once.length + ' tahmin</span>';
        }
        cubuk(kap, HARF.slice(0, m.siklar.length).split(''), say, [a], t, et.tuzak);
        if (a) kap.appendChild(el('div', 'model', a + ') ' + kac(m.siklar[HARF.indexOf(a)])));
        oran(kap, dogru, t);
        yazilar(kap, ekler, m.tur === 'tahmin_secim' ? 'Tahminler' : m.ek);
      } else if (m.tur === 'iliski_secim') {
        var si = {}, sh = {}, di = 0, dh = 0;
        satir.forEach(function (r) { var p = r.cevap.split('|'); si[p[0]] = (si[p[0]] || 0) + 1; sh[p[1]] = (sh[p[1]] || 0) + 1;
          if (a && a.iliski.indexOf(p[0]) >= 0) di++; if (a && p[1] === a.sik) dh++; });
        kap.appendChild(el('div', 'kk', 'İlişki'));
        cubuk(kap, m.iliskiler, si, a ? a.iliski : [], t);
        kap.appendChild(el('div', 'kk', 'Bağlaç'));
        cubuk(kap, HARF.slice(0, m.siklar.length).split(''), sh, a ? [a.sik] : [], t, et.tuzak);
        if (a) kap.appendChild(el('div', 'model', a.iliski.join(' / ') + ' → ' + a.sik + ') ' + kac(m.siklar[HARF.indexOf(a.sik)])));
        kap.appendChild(el('div', 'oran', t ? 'İlişki doğru ' + di + ' / ' + t + ' · bağlaç doğru ' + dh + ' / ' + t : ''));
      } else if (m.tur === 'karar') {
        satir.forEach(function (r) { var p = ayir(r.cevap); say[p[0]] = (say[p[0]] || 0) + 1; if (a && p[0] === a.karar) dogru++; if (p[1]) ekler.push([r.ogrenci, p[1]]); });
        cubuk(kap, m.secenekler, say, a ? [a.karar] : [], t);
        if (a) kap.appendChild(el('div', 'model', kac(a.karar) + ' · ' + kac(a.model)));
        oran(kap, dogru, t);
        yazilar(kap, ekler, 'Değişen sözcük');
      } else if (m.tur === 'blok') {
        m.bloklar.forEach(function (bl, j) {
          var s2 = {};
          satir.forEach(function (r) { var e = ayir(r.cevap)[0].split(',')[j]; s2[e] = (s2[e] || 0) + 1; });
          kap.appendChild(el('div', 'kk', (j + 1) + ' · ' + kac(bl)));
          cubuk(kap, m.etiketler.filter(function (x) { return s2[x] || (a && a.etiket[j] === x); }), s2, a ? [a.etiket[j]] : [], t);
        });
        satir.forEach(function (r) { var p = ayir(r.cevap); if (a && p[0] === a.etiket.join(',')) dogru++; if (p[1]) ekler.push([r.ogrenci, p[1]]); });
        oran(kap, dogru, t);
        if (a) kap.appendChild(el('div', 'model', kac(a.model)));
        yazilar(kap, ekler, m.ek);
      } else if (m.tur === 'sira') {
        var kabul = a ? [].concat(a.sira) : [];   // kabul edilen bütün doğal sıralar
        satir.forEach(function (r) { var p = ayir(r.cevap); say[p[0]] = (say[p[0]] || 0) + 1; if (kabul.indexOf(p[0]) >= 0) dogru++; if (p[1]) ekler.push([r.ogrenci, p[1]]); });
        var sk = Object.keys(say); kabul.forEach(function (x) { if (sk.indexOf(x) < 0) sk.unshift(x); });
        cubuk(kap, sk, say, kabul, t);
        oran(kap, dogru, t);
        if (a) kap.appendChild(el('div', 'model', (a.kural ? 'Kural: ' + kac(a.kural) + '<br>' : '') + kac(a.model)));
        yazilar(kap, ekler, 'Türkçeleri');
      } else if (m.tur === 'yazi') {
        if (a) kap.appendChild(el('div', 'model', kac(a.model)));
        yazilar(kap, satir.map(function (r) { return [r.ogrenci, r.cevap]; }), '');
      }
      k.appendChild(kap);
    });
  }

  if (!V || !V.gorevler) { KOK.textContent = 'Hafta verisi yüklenemedi.'; return; }
  cizIskelet();
})();
