document.addEventListener("DOMContentLoaded", async () => {
  const listEl = document.getElementById("ppk-list");
  const searchEl = document.getElementById("search");
  const filterWilayah = document.getElementById("filterWilayah");
  const filterJenis = document.getElementById("filterJenis");

  let data = [];
  try {
    const res = await fetch('./ppk-data.json');
    data = await res.json();
  } catch (err) {
    console.error("Gagal memuat data:", err);
    listEl.innerHTML = "<p>Gagal memuat data. Silakan coba lagi.</p>";
    return;
  }

  // Map icon untuk fasilitas
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

      // Ubah fasilitas string menjadi array jika perlu
      const fasilitasArray = item.fasilitas
        ? (typeof item.fasilitas === "string"
            ? item.fasilitas.split(",").map(f => f.trim())
            : item.fasilitas)
        : [];

      const fasilitasHTML = fasilitasArray
        .map(f => `<span class='fac-item'><img src='/media/ppk/icons/${iconMap[f] || "lab.svg"}'>${f}</span>`)
        .join(" ");

      card.innerHTML = `
        <h3>${item.nama}</h3>
        <p><strong>Wilayah:</strong> ${item.wilayah}</p>
        <p><strong>Alamat:</strong> ${item.alamat}</p>
        <p><strong>Telepon:</strong> ${item.telepon || "-"}</p>
        ${item.jam_operasional ? `<p><strong>Jam:</strong> ${item.jam_operasional}</p>` : ""}
        <div class="fasilitas">${fasilitasHTML}</div>
        <div class="ppk-buttons">
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

  // Render awal semua data
  render(data);
});
