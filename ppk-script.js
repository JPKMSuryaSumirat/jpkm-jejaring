document.addEventListener("DOMContentLoaded", async () => {
  const listEl = document.getElementById("ppk-list");
  const searchEl = document.getElementById("search");
  const filterWilayah = document.getElementById("filterWilayah");
  const filterJenis = document.getElementById("filterJenis");

  try {
  const res = await fetch("./Daftar PPK Jejaring JPKM (MASTER).xlsx");
  const buf = await res.arrayBuffer();
  const workbook = XLSX.read(buf, { type: "array" });

  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  let data = XLSX.utils.sheet_to_json(sheet);

  // --- NORMALISASI ---
  data = data.map(d => ({
    nama: d["NAMA PPK I"] || "",
    alamat: d["ALAMAT"] || "",
    telepon: d["TELEPON"] || "",
    hari: d["HARI"] || "",
    jam: d["JAM"] || "",
    fasilitas: d["FASILITAS LAINNYA"] || ""
  }));

  console.log(data[0]); // cek apakah sudah terbaca
} catch (err) {
  console.error("Gagal memuat Excel:", err);
}



  const iconMap = {
    "Laboratorium": "lab.svg",
    "Rawat inap": "rawatinap.svg",
    "IGD": "igd.svg",
    "Tindakan ringan": "tindakan.svg"
  };

  function render(items) {
    listEl.innerHTML = "";
    if (!items.length) {
      listEl.innerHTML = "<p>Tidak ada hasil ditemukan.</p>";
      return;
    }
    items.forEach(item => {
      const card = document.createElement("div");
      card.className = "ppk-card";
      const fasilitasHTML = (item.fasilitas || [])
        .map(f => `<span class='fac-item'><img src='/media/ppk/icons/${iconMap[f] || "lab.svg"}'>${f}</span>`)
        .join("");
      card.innerHTML = `
        <h3>${item.nama}</h3>
        <p><strong>Wilayah:</strong> ${item.wilayah}</p>
        <p><strong>Alamat:</strong> ${item.alamat}</p>
        <p><strong>Telepon:</strong> ${item.telepon || "-"}</p>
        ${item.jam ? `<p><strong>Jam:</strong> ${item.jam}</p>` : ""}
        <div class="fasilitas">${fasilitasHTML}</div>
        <div>
          ${item.telepon ? `<button class='call' onclick="window.open('tel:${item.telepon}')">Telepon</button>` : ""}
          ${item.telepon ? `<button class='copy' onclick="navigator.clipboard.writeText('${item.telepon}');alert('Nomor disalin!')">Salin</button>` : ""}
        </div>
      `;
      listEl.appendChild(card);
    });
  }

  function filter() {
    const q = searchEl.value.toLowerCase();
    const w = filterWilayah.value;
    const j = filterJenis.value;
    const filtered = data.filter(d =>
      (!q || d.nama.toLowerCase().includes(q) || d.alamat.toLowerCase().includes(q) || (d.telepon || "").includes(q)) &&
      (!w || d.wilayah === w) &&
      (!j || d.jenis === j)
    );
    render(filtered);
  }

  searchEl.addEventListener("input", filter);
  filterWilayah.addEventListener("change", filter);
  filterJenis.addEventListener("change", filter);

  render(data);
});






