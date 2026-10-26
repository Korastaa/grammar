/* Apps Script web uygulamasının adresi (Sinif.gs → Dağıt → Web uygulaması → …/exec).
   Kurulumda bir kez buraya yapıştırılır; bütün haftalar ve öğretmen paneli bunu kullanır. */
window.SINIF_AYAR = {
  url: 'https://script.google.com/macros/s/AKfycbwWQLgde6jNyHm_3xG6dMehHdQ7sPwmHNM1k9EoCMlVKyX0192JbWwG7XwG8_pgEtCBKw/exec',
  // Aynı haftayı birden çok sınıfta işliyorsan şubeleri yaz (ör. ['Yediiklim', 'Pegem']);
  // öğrenci girişte sınıfını seçer, panel şubeye göre süzer. Tek sınıfsa boş bırak.
  subeler: []
};
