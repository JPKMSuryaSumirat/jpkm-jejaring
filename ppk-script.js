let data = []; // <--- global, mencegah "data is not defined"

document.addEventListener("DOMContentLoaded", async () => {
  const listEl = document.getElementById("ppk-list");
  const searchEl = document.getElementById("search");
  const filterWilayah = document.getElementById("filterWilayah");
  const filterJenis = document.getElementById("filterJenis");

  // Nama file Excel yang sudah Anda letakkan di root proyek (pastikan persis)
  const EXCEL_FILE = "Daftar PPK Jejaring JPKM (MASTER).xlsx";

  try {
    const res = await fetch(EXCEL_FILE);
    if (!res.ok) throw new Error(`HTTP ${res.status} - ${res.statusText}`);

    const buf = await res.arrayBuffer();
    const workbook = XLSX.read(buf, { type: "array" });

    // Ambil sheet pertama (atau ganti nama jika perlu)
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) throw new Error("Tidak ditemukan sheet pada workbook.");
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) throw new Error("Sheet undefined.");

    const raw = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

// baris header nyata (biasanya baris pertama)
const headers = raw[0].map(h => String(h).toLowerCase().trim());

// baris data dimulai dari baris kedua
const rows = raw.slice(1);

function ambil(row, keyword) {
  const idx = headers.findIndex(h => h.includes(keyword));
  return idx !== -1 ? (row[idx] || "") : "";
}

data = rows.map(row => ({
  nama: ambil(row, "nama"),
  wilayah: ambil(row, "wilayah"),
  alamat: ambil(row, "alamat"),
  telepon: ambil(row, "tel"),
  hari: ambil(row, "hari"),
  jam: ambil(row, "jam"),
  fasilitas_lain: ambil(row, "fasilitas")
}));

console.log("HEADER TERDETEKSI:", headers);
console.log("Contoh data[0]:", data[0]);
render(data);


    console.log("Contoh data[0]:", data[0]);
    render(data);

  } catch (err) {
    console.error("Gagal memuat Excel:", err);
    // pastikan data tetap array kosong agar fungsi lain tidak error
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

  function filter() {
    const q = (searchEl.value || "").toLowerCase();
    const w = filterWilayah.value;
    const j = filterJenis.value;

    const filtered = data.filter(d => {
      const fasilitas = (d.fasilitas_lain || "").toLowerCase();
      const jenis = (d.jenis || "").toLowerCase(); // jika ada kolom jenis di Excel

      const passSearch =
        !q ||
        (d.nama || "").toLowerCase().includes(q) ||
        (d.alamat || "").toLowerCase().includes(q) ||
        (d.telepon || "").toLowerCase().includes(q);

      const passWilayah = !w || (d.wilayah || "") === w;

      let passJenis = true;
      if (!j) {
        passJenis = true;
      } else if (j === "PPK I") {
        passJenis = (jenis === "ppk i") || (d.jenis === "PPK I");
      } else if (j === "PPK II") {
        passJenis = (jenis === "ppk ii") || (d.jenis === "PPK II");
      } else if (j === "PPK I Siswa") {
        passJenis =
          (jenis === "ppk i") ||
          (d.jenis === "PPK I") ||
          fasilitas.includes("siswa") ||
          fasilitas.includes("mahasiswa");
      } else if (j === "PPK I Gigi") {
        passJenis =
          (jenis === "ppk i") ||
          (d.jenis === "PPK I") ||
          fasilitas.includes("gigi") ||
          fasilitas.includes("dental");
      } else {
        // fallback: coba cocokkan dengan fasilitas
        passJenis = (fasilitas && fasilitas.includes(j.toLowerCase()));
      }

      return passSearch && passWilayah && passJenis;
    });

    render(filtered);
  }

  searchEl.addEventListener("input", filter);
  filterWilayah.addEventListener("change", filter);
  filterJenis.addEventListener("change", filter);
}); // end DOMContentLoaded

// small helper to avoid XSS if HTML contains unexpected chars (basic)
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


