let data = []; // global

document.addEventListener("DOMContentLoaded", async () => {

  // PENTING — PINDAHKAN KE ATAS
  const loading = document.getElementById("loading");

  const listEl = document.getElementById("ppk-list");
  const searchEl = document.getElementById("search");
  const filterWilayah = document.getElementById("filterWilayah");
  const filterJenis = document.getElementById("filterJenis");

  const EXCEL_FILE = "Daftar PPK Jejaring JPKM (MASTER).xlsx";

  try {
    const res = await fetch(EXCEL_FILE);
    if (!res.ok) throw new Error(`HTTP ${res.status} - ${res.statusText}`);

    const buf = await res.arrayBuffer();
    const workbook = XLSX.read(buf, { type: "array" });

    const sheetName = workbook.SheetNames[0];
    if (!sheetName) throw new Error("Tidak ditemukan sheet dalam file.");
    const sheet = workbook.Sheets[sheetName];

    const raw = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

    const realHeaderIndex = raw.findIndex(
      r => r.some(c => String(c).toLowerCase().includes("nama"))
    );

    if (realHeaderIndex === -1) {
      console.error("Header tabel tidak ditemukan dalam Excel!");
      data = [];
      if (loading) loading.classList.add("loading-hidden");
      render(data);
      return;
    }

    const headers = raw[realHeaderIndex].map(h => String(h).toLowerCase().trim());
    const rows = raw.slice(realHeaderIndex + 1);

    function ambil(row, keyword) {
      const idx = headers.findIndex(h => h.includes(keyword));
      return idx !== -1 ? (row[idx] || "") : "";
    }

    data = rows.map(row => ({
      nama: ambil(row, "nama"),
      wilayah: ambil(row, "wilayah"),
      alamat: ambil(row, "alamat"),
      telepon: ambil(row, "tel"),
      jadwal: ambil(row, "jadwal"),
      fasilitas_lain: ambil(row, "fasilitas"),
      jenis: ambil(row, "jenis")
    }));

    if (loading) loading.classList.add("loading-hidden");

    render(data);

  } catch (err) {
    console.error("Gagal memuat Excel:", err);
    if (loading) loading.classList.add("loading-hidden");
    data = [];
    render(data);
  }

  function render(items) {
    listEl.innerHTML = "";
    if (!items || !items.length) {
      listEl.innerHTML = "<p>Tidak ada hasil ditemukan.</p>";
      return;
    }

    items.forEach(item => {
      const card = document.createElement("div");
      card.className = "ppk-card";

      const fasilitasHTML = (item.fasilitas_lain || "")
        .split(",").map(f => f.trim()).filter(Boolean)
        .map(f => `<span class='fac-item'>${escapeHtml(f)}</span>`).join("");

      card.innerHTML = `
        <h3>${escapeHtml(item.nama || "—")}</h3>
        ${item.jenis && item.jenis.toLowerCase().includes("ppk ii") ? "" :
          `<p><strong>Wilayah:</strong> ${escapeHtml(item.wilayah || "—")}</p>`}
        <p><strong>Alamat:</strong> ${escapeHtml(item.alamat || "—")}</p>
        <p><strong>Telepon:</strong> ${escapeHtml(item.telepon || "-")}</p>
        <p><strong>Jenis:</strong> ${escapeHtml(item.jenis || "—")}</p>
        ${item.jadwal ? `<p><strong>Jadwal:</strong> ${escapeHtml(item.jadwal)}</p>` : ""}
        <div class="fasilitas">${fasilitasHTML}</div>
      `;
      listEl.appendChild(card);
    });
  }

  document.getElementById("btnCari").addEventListener("click", function () {
    
    // Tampilkan loading hanya saat tombol Cari ditekan
    loading.classList.remove("loading-hidden");

    setTimeout(() => {

        const teks = searchEl.value.toLowerCase();
        const w = filterWilayah.value;
        const j = filterJenis.value;

        const filtered = data.filter(item => {
    const cocokNama = item.nama.toLowerCase().includes(teks);
    const cocokAlamat = item.alamat.toLowerCase().includes(teks);
    const cocokTelp = item.telepon.toLowerCase().includes(teks);
    const cocokWilayah = !w || item.wilayah === w;

    // ---------- FILTER JENIS (PPK I / PPK II / KHUSUS) ----------
    let cocokJenis = true;

    if (!j) {
        cocokJenis = true;
    } 
    else if (j === "PPK I" || j === "PPK II") {
        // BIARKAN LOGIKA LAMA — TIDAK DIUBAH
        cocokJenis = item.jenis === j;
    }
    else if (j === "PPK I Siswa") {
        const f = item.fasilitas_lain.toLowerCase();
        cocokJenis = f.includes("siswa") || f.includes("mahasiswa");
    }
    else if (j === "PPK I Gigi") {
        const f = item.fasilitas_lain.toLowerCase();
        cocokJenis = f.includes("gigi") || f.includes("dental");
    }

    return (cocokNama || cocokAlamat || cocokTelp) &&
           cocokWilayah &&
           cocokJenis;
        });

        render(filtered);

        // Sembunyikan loading lagi
        loading.classList.add("loading-hidden");

    }, 600);
  });

});

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


