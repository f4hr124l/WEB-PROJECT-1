let currentUser = null;

const daftarVoucher = {
  "DISKON10": 10,
  "HEMAT20": 20
};

let kursiTerpakai = [];

let eventAktif = null;
let kelasAktif = null; 
let kursiDipilih = [];
let diskonAktif = 0;

window.onload = function () {
  muatUserDariStorage();
  if (document.getElementById("searchInput")) {
    document.getElementById("searchInput").addEventListener("input", filterEvent);
    document.getElementById("genreFilter").addEventListener("change", filterEvent);
    document.getElementById("cityFilter").addEventListener("change", filterEvent);
  }
  if (document.getElementById("ticketList")) {
    renderTiketSaya();
  }

  document.getElementById("loginBtn").addEventListener("click", function () {
    tutupSemuaModal();
    document.getElementById("loginModal").classList.remove("hidden");
  });

  document.getElementById("loginForm").addEventListener("submit", function (e) {
    e.preventDefault();
    login();
  });

  document.getElementById("logoutBtn").addEventListener("click", logout);
};
function filterEvent() {
  const kata = document.getElementById("searchInput").value.toLowerCase();
  const genre = document.getElementById("genreFilter").value.toLowerCase();
  const kota = document.getElementById("cityFilter").value.toLowerCase();

  const semuaCard = document.querySelectorAll(".event-card");
  let adaYangKelihatan = false;

  semuaCard.forEach(function (card) {
    const nama = card.dataset.nama.toLowerCase();
    const genreCard = card.dataset.genre.toLowerCase();
    const kotaCard = card.dataset.kota.toLowerCase();

    let cocok = true;

    if (kata && !nama.includes(kata) && !kotaCard.includes(kata) && !genreCard.includes(kata)) {
      cocok = false;
    }
    if (genre !== "all" && genreCard !== genre) {
      cocok = false;
    }
    if (kota !== "all" && kotaCard !== kota) {
      cocok = false;
    }

    card.style.display = cocok ? "" : "none";
    if (cocok) adaYangKelihatan = true;
  });

  document.getElementById("emptyState").classList.toggle("hidden", adaYangKelihatan);
}

function openEvent(id) {
  const card = document.querySelector('.event-card[data-id="' + id + '"]');
  if (!card) return;
  eventAktif = {
    id: id,
    nama: card.dataset.nama,
    genre: card.dataset.genre,
    kota: card.dataset.kota,
    tanggal: card.dataset.tanggal,
    gambar: card.dataset.gambar,
    reguler: Number(card.dataset.reguler),
    vip: Number(card.dataset.vip),
    vvip: Number(card.dataset.vvip)
  };

  const detailBox = document.getElementById("eventDetail");
  detailBox.innerHTML = `
    <img src="${eventAktif.gambar}" style="width:100%;border-radius:8px;margin-bottom:15px;" onerror="this.onerror=null;this.src='https://placehold.co/700x350?text=No+Image';">
    <h2>${eventAktif.nama}</h2>
    <p>${eventAktif.genre} • ${eventAktif.kota}</p>
    <p>Tanggal: ${formatTanggal(eventAktif.tanggal)}</p>
    <hr style="margin:15px 0;">
    <p><b>Reguler:</b> Rp${formatRupiah(eventAktif.reguler)}</p>
    <p><b>VIP:</b> Rp${formatRupiah(eventAktif.vip)}</p>
    <p><b>VVIP:</b> Rp${formatRupiah(eventAktif.vvip)}</p>
    <button class="btn-primary" style="margin-top:15px;border:none;cursor:pointer;" onclick="bukaCheckout()">Pesan Tiket</button>
  `;

  tutupSemuaModal();
  document.getElementById("eventModal").classList.remove("hidden");
}

function bukaCheckout() {
  if (!currentUser) {
    showToast("Login dulu sebelum pesan tiket ya!");
    tutupSemuaModal();
    document.getElementById("loginModal").classList.remove("hidden");
    return;
  }

  tutupSemuaModal();

  kelasAktif = "reguler";
  kursiDipilih = [];
  diskonAktif = 0;
  kursiTerpakai = buatKursiTerpakaiAcak();

  renderCheckout();
  document.getElementById("checkoutModal").classList.remove("hidden");
}

function renderCheckout() {
  const main = document.getElementById("checkoutMain");
  const summary = document.getElementById("checkoutSummary");
  let htmlKelas = `
    <h3>Pilih Kelas Tiket</h3>
    <div class="kelas-tiket ${kelasAktif === "reguler" ? "aktif" : ""}" onclick="pilihKelas('reguler')">
      Reguler - Rp${formatRupiah(eventAktif.reguler)}
    </div>
    <div class="kelas-tiket ${kelasAktif === "vip" ? "aktif" : ""}" onclick="pilihKelas('vip')">
      VIP - Rp${formatRupiah(eventAktif.vip)}
    </div>
    <div class="kelas-tiket ${kelasAktif === "vvip" ? "aktif" : ""}" onclick="pilihKelas('vvip')">
      VVIP - Rp${formatRupiah(eventAktif.vvip)}
    </div>
  `;

  let htmlKursi = `<h3 style="margin-top:20px;">Pilih Kursi</h3><div class="seat-grid">`;
  for (let i = 1; i <= 24; i++) {
    let kelasCss = "seat";
    if (kursiTerpakai.includes(i)) kelasCss += " terpakai";
    else if (kursiDipilih.includes(i)) kelasCss += " terpilih";

    htmlKursi += `<div class="${kelasCss}" onclick="pilihKursi(${i})">${i}</div>`;
  }
  htmlKursi += `</div>`;
  let htmlVoucher = `
    <h3 style="margin-top:20px;">Voucher</h3>
    <input id="inputVoucher" type="text" placeholder="Contoh: DISKON10">
    <button onclick="pakaiVoucher()" style="margin-top:8px;">Pakai Voucher</button>
  `;

  main.innerHTML = htmlKelas + htmlKursi + htmlVoucher;
  const hargaSatuan = eventAktif[kelasAktif];
  const jumlahKursi = kursiDipilih.length;
  let subtotal = hargaSatuan * jumlahKursi;
  let potongan = Math.round((subtotal * diskonAktif) / 100);
  let total = subtotal - potongan;

  summary.innerHTML = `
    <h3>Ringkasan</h3>
    <p>${eventAktif.nama}</p>
    <p>Kelas: ${kelasAktif.toUpperCase()}</p>
    <p>Kursi: ${kursiDipilih.length ? kursiDipilih.join(", ") : "-"}</p>
    <p>Subtotal: Rp${formatRupiah(subtotal)}</p>
    <p>Diskon: ${diskonAktif}% (Rp${formatRupiah(potongan)})</p>
    <hr style="margin:10px 0;">
    <p><b>Total: Rp${formatRupiah(total)}</b></p>
    <button class="btn-primary" style="border:none;cursor:pointer;margin-top:10px;width:100%;" onclick="bayarSekarang(${total})" ${jumlahKursi === 0 ? "disabled" : ""}>
      ${jumlahKursi === 0 ? "Pilih Kursi" : "Bayar Sekarang"}
    </button>
  `;
}

function pilihKelas(kelas) {
  kelasAktif = kelas;
  renderCheckout();
}
function pilihKursi(nomor) {
  if (kursiTerpakai.includes(nomor)) return; 

  const index = kursiDipilih.indexOf(nomor);
  if (index === -1) {
    kursiDipilih.push(nomor);
  } else {
    kursiDipilih.splice(index, 1);
  }
  renderCheckout();
}

function pakaiVoucher() {
  const kode = document.getElementById("inputVoucher").value.trim().toUpperCase();
  if (daftarVoucher[kode]) {
    diskonAktif = daftarVoucher[kode];
    showToast("Voucher berhasil dipakai! Diskon " + diskonAktif + "%");
  } else {
    diskonAktif = 0;
    showToast("Kode voucher tidak ditemukan.");
  }
  renderCheckout();
}

function bayarSekarang(total) {
  if (kursiDipilih.length === 0) {
    showToast("Pilih kursi dulu!");
    return;
  }

  const tiketBaru = {
    kodeTiket: "TK" + Date.now(),
    namaEvent: eventAktif.nama,
    kota: eventAktif.kota,
    tanggal: eventAktif.tanggal,
    kelas: kelasAktif,
    kursi: kursiDipilih.slice(),
    total: total,
    pemesan: currentUser.nama
  };

  const semuaTiket = ambilTiketSaya();
  semuaTiket.push(tiketBaru);
  localStorage.setItem("tiketSaya", JSON.stringify(semuaTiket));

  closeModal("checkoutModal");
  showToast("Tiket berhasil dipesan!");

  window.location.href = "tickets.html";
}

function ambilTiketSaya() {
  const data = localStorage.getItem("tiketSaya");
  return data ? JSON.parse(data) : [];
}

function renderTiketSaya() {
  const list = document.getElementById("ticketList");
  const kosong = document.getElementById("ticketEmpty");
  if (!list || !kosong) return; 

  if (!currentUser) {
    list.innerHTML = "";
    kosong.textContent = "Login dulu untuk lihat tiket kamu.";
    kosong.classList.remove("hidden");
    return;
  }

  const semuaTiket = ambilTiketSaya();
  kosong.textContent = "Kamu belum punya tiket. Yuk pesan event dulu!";
  list.innerHTML = "";

  if (semuaTiket.length === 0) {
    kosong.classList.remove("hidden");
    return;
  }
  kosong.classList.add("hidden");

  semuaTiket.forEach(function (tiket, i) {
    const item = document.createElement("div");
    item.className = "ticket-item";
    const sudahLewat = new Date(tiket.tanggal) < new Date();
    const statusHtml = sudahLewat
      ? `<span class="status-badge status-selesai">Selesai</span>`
      : `<span class="status-badge status-upcoming">Upcoming</span>`;

    item.innerHTML = `
      <div class="tiket-utama">
        ${statusHtml}
        <b>${tiket.namaEvent}</b><br>
        ${tiket.kota} • ${formatTanggal(tiket.tanggal)}<br>
        Kelas: ${tiket.kelas.toUpperCase()} • Kursi: ${tiket.kursi.join(", ")}<br>
        Pemesan: ${tiket.pemesan}<br>
        <button class="btn-batal" onclick="batalkanTiket('${tiket.kodeTiket}')">Batalkan Tiket</button>
      </div>
      <div class="tiket-garis"></div>
      <div class="tiket-stub">
        <div id="qr-${i}"></div>
        <small>${tiket.kodeTiket}</small>
      </div>
    `;
    list.appendChild(item);
    new QRCode(document.getElementById("qr-" + i), {
      text: tiket.kodeTiket,
      width: 90,
      height: 90
    });
  });
}

function batalkanTiket(kodeTiket) {
  const konfirmasi = confirm("Yakin mau batalkan tiket ini?");
  if (!konfirmasi) return;

  let semuaTiket = ambilTiketSaya();
  semuaTiket = semuaTiket.filter(function (t) {
    return t.kodeTiket !== kodeTiket;
  });

  localStorage.setItem("tiketSaya", JSON.stringify(semuaTiket));
  renderTiketSaya();
  showToast("Tiket dibatalkan.");
}
function login() {
  const nama = document.getElementById("loginName").value;
  const email = document.getElementById("loginEmail").value;

  currentUser = { nama: nama, email: email };
  localStorage.setItem("currentUser", JSON.stringify(currentUser));

  document.getElementById("loginBtn").classList.add("hidden");
  document.getElementById("profileBox").classList.remove("hidden");
  document.getElementById("profileName").textContent = nama;

  closeModal("loginModal");
  renderTiketSaya();
  showToast("Berhasil login, selamat datang " + nama + "!");
}

function logout() {
  currentUser = null;
  localStorage.removeItem("currentUser");
  document.getElementById("loginBtn").classList.remove("hidden");
  document.getElementById("profileBox").classList.add("hidden");
  renderTiketSaya();
  showToast("Kamu sudah keluar.");
}
function muatUserDariStorage() {
  const data = localStorage.getItem("currentUser");
  if (!data) return;

  currentUser = JSON.parse(data);
  document.getElementById("loginBtn").classList.add("hidden");
  document.getElementById("profileBox").classList.remove("hidden");
  document.getElementById("profileName").textContent = currentUser.nama;
}

function closeModal(idModal) {
  const modal = document.getElementById(idModal);
  if (modal) modal.classList.add("hidden");
}
function tutupSemuaModal() {
  closeModal("eventModal");
  closeModal("checkoutModal");
  closeModal("loginModal");
}

function showToast(pesan) {
  const toast = document.getElementById("toast");
  toast.textContent = pesan;
  toast.classList.add("show");

  setTimeout(function () {
    toast.classList.remove("show");
  }, 2500);
}

function formatRupiah(angka) {
  return angka.toLocaleString("id-ID");
}

function formatTanggal(tanggalStr) {
  const bulan = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  const d = new Date(tanggalStr);
  return d.getDate() + " " + bulan[d.getMonth()] + " " + d.getFullYear();
}

function buatKursiTerpakaiAcak() {

  const jumlah = Math.floor(Math.random() * 3) + 3;
  const hasil = [];
  while (hasil.length < jumlah) {
    const nomor = Math.floor(Math.random() * 24) + 1;
    if (!hasil.includes(nomor)) hasil.push(nomor);
  }
  return hasil;
}