let data = []; // global

document.addEventListener("DOMContentLoaded", async () => {
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

    // baca semua data raw
    const raw = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

    // cari baris yang berisi header tabel sesungguhnya
    const realHeaderIndex = raw.findIndex(
      r => r.some(c => String(c).toLowerCase().includes("nama"))
    );

    if (realHeaderIndex === -1) {
      console.error("Header tabel tidak ditemukan dalam Excel!");
      data = [];
      render(data);
      return;
    }

    // ambil header dan normalisasi huruf kecil
    const headers = raw[realHeaderIndex].map(h => String(h).toLowerCase().trim());

    // ambil seluruh data setelah header
    const rows = raw.slice(realHeaderIndex + 1);

    // fungsi helper ambil kolom berdasarkan keyword
    function ambil(row, keyword) {
      const idx = headers.findIndex(h => h.includes(keyword));
      return idx !== -1 ? (row[idx] || "") : "";
    }

    // olah data jadi JSON bersih
    data = rows.map(row => ({
      nama: ambil(row, "nama"),
      wilayah: ambil(row, "wilayah"),
      alamat: ambil(row, "alamat"),
      telepon: ambil(row, "tel"),
      jadwal: ambil(row, "jadwal")
      fasilitas_lain: ambil(row, "fasilitas")
    }));

    console.log("HEADER TERDETEKSI:", headers);
    console.log("Contoh data[0]:", data[0]);

    render(data);

  } catch (err) {
    console.error("Gagal memuat Excel:", err);
    data = [];
    render(data);
  }

  // render ke HTML
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
        .split(",")
        .map(f => f.trim())
        .filter(Boolean)
        .map(f => `<span class='fac-item'>${escapeHtml(f)}</span>`)
        .join("");

      card.innerHTML = `
        <h3>${escapeHtml(item.nama || "—")}</h3>
        <p><strong>Wilayah:</strong> ${escapeHtml(item.wilayah || "—")}</p>
        <p><strong>Alamat:</strong> ${escapeHtml(item.alamat || "—")}</p>
        <p><strong>Telepon:</strong> ${escapeHtml(item.telepon || "-")}</p>
        ${item.jam ? `<p><strong>Jam:</strong> ${escapeHtml(item.jam)}</p>` : ""}
        <div class="fasilitas">${fasilitasHTML}</div>
      `;
      listEl.appendChild(card);
    });
  }

  // filter pencarian dan dropdown
  function filter() {
    const q = (searchEl.value || "").toLowerCase();
    const w = filterWilayah.value;
    const j = filterJenis.value;

    const filtered = data.filter(d => {
      const fasilitas = (d.fasilitas_lain || "").toLowerCase();

      const passSearch =
        !q ||
        (d.nama || "").toLowerCase().includes(q) ||
        (d.alamat || "").toLowerCase().includes(q) ||
        (d.telepon || "").toLowerCase().includes(q);

      const passWilayah = !w || (d.wilayah || "") === w;

      let passJenis = true;
      if (j === "PPK I Siswa/Mahasiswa") {
        passJenis = fasilitas.includes("siswa") || fasilitas.includes("mahasiswa");
      } else if (j === "PPK I Gigi") {
        passJenis = fasilitas.includes("gigi") || fasilitas.includes("dental");
      }

      return passSearch && passWilayah && passJenis;
    });

    render(filtered);
  }

  searchEl.addEventListener("input", filter);
  filterWilayah.addEventListener("change", filter);
  filterJenis.addEventListener("change", filter);
});

// helper anti XSS
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

