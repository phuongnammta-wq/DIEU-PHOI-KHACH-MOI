
const guests = Array.isArray(window.GUESTS) ? window.GUESTS.map((item, index) => ({
  id: index + 1,
  ...item,
  normalizedName: normalizeText(item.rank_name),
  normalizedPosition: normalizeText(item.position || ""),
  normalizedSeat: normalizeText(item.seat || "")
})) : [];

const els = {
  input: document.getElementById("searchInput"),
  clearBtn: document.getElementById("clearBtn"),
  recordCount: document.getElementById("recordCount"),
  results: document.getElementById("results"),
  emptyState: document.getElementById("emptyState"),
  featuredResult: document.getElementById("featuredResult"),
  installBtn: document.getElementById("installBtn"),
  offlineStatus: document.getElementById("offlineStatus")
};

els.recordCount.textContent = `Tổng ${guests.length} khách mời`;

let deferredPrompt = null;

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function highlight(text, query) {
  const cleanQuery = query.trim();
  if (!cleanQuery) return escapeHtml(text);

  const normalizedText = normalizeText(text);
  const normalizedQuery = normalizeText(cleanQuery);
  if (!normalizedQuery) return escapeHtml(text);

  const words = normalizedQuery.split(" ").filter(Boolean);
  if (!words.length) return escapeHtml(text);

  // Simpler highlight by whole-text fallback to original when indices are ambiguous due to diacritics.
  // We preserve readability over perfect index mapping.
  const originalWords = String(text).split(/(\s+)/);
  return originalWords.map(token => {
    const tokenNorm = normalizeText(token);
    return words.some(word => tokenNorm.includes(word))
      ? `<mark>${escapeHtml(token)}</mark>`
      : escapeHtml(token);
  }).join("");
}

function rankGuest(guest, q) {
  const exactSeat = guest.normalizedSeat === q ? 100 : 0;
  const exactName = guest.normalizedName === q ? 90 : 0;
  const startsName = guest.normalizedName.startsWith(q) ? 70 : 0;
  const includesName = guest.normalizedName.includes(q) ? 50 : 0;
  const includesPosition = guest.normalizedPosition.includes(q) ? 15 : 0;
  return exactSeat + exactName + startsName + includesName + includesPosition;
}

function searchGuests(query) {
  const q = normalizeText(query);
  if (!q) return [];

  return guests
    .filter(guest =>
      guest.normalizedName.includes(q) ||
      guest.normalizedPosition.includes(q) ||
      guest.normalizedSeat.includes(q)
    )
    .map(guest => ({ ...guest, score: rankGuest(guest, q) }))
    .sort((a, b) => b.score - a.score || a.rank_name.localeCompare(b.rank_name, "vi"))
    .slice(0, 30);
}

function renderFeatured(guest) {
  if (!guest) {
    els.featuredResult.classList.add("hidden");
    els.featuredResult.innerHTML = "";
    return;
  }

  els.featuredResult.classList.remove("hidden");
  els.featuredResult.innerHTML = `
    <div class="seat-pill">${escapeHtml(guest.seat)}</div>
    <div class="name">${escapeHtml(guest.rank_name)}</div>
    <div class="position">${escapeHtml(guest.position || "Không có chức vụ đi kèm")}</div>
    <div class="actions">
      <button type="button" class="action-btn" data-copy-seat="${escapeHtml(guest.seat)}">Sao chép ghế</button>
      <button type="button" class="action-btn" data-copy-name="${escapeHtml(guest.rank_name)}">Sao chép tên</button>
    </div>
  `;
}

function renderResults(matches, query) {
  els.results.innerHTML = "";

  if (!query.trim()) {
    els.emptyState.textContent = "Gõ tên để bắt đầu tra cứu.";
    els.emptyState.hidden = false;
    renderFeatured(null);
    return;
  }

  if (!matches.length) {
    els.emptyState.textContent = "Không tìm thấy khách mời phù hợp.";
    els.emptyState.hidden = false;
    renderFeatured(null);
    return;
  }

  els.emptyState.hidden = true;
  renderFeatured(matches[0]);

  matches.forEach(guest => {
    const card = document.createElement("article");
    card.className = "result-card";
    card.innerHTML = `
      <div>
        <div class="name">${highlight(guest.rank_name, query)}</div>
        <div class="position">${escapeHtml(guest.position || "")}</div>
      </div>
      <div class="seat">${escapeHtml(guest.seat)}</div>
    `;
    els.results.appendChild(card);
  });
}

function onSearch() {
  const query = els.input.value || "";
  const matches = searchGuests(query);
  renderResults(matches, query);
}

async function copyText(value, label) {
  try {
    await navigator.clipboard.writeText(value);
    showStatus(`Đã sao chép ${label}: ${value}`);
  } catch (error) {
    showStatus(`Không sao chép được ${label}.`);
  }
}

function showStatus(message) {
  els.offlineStatus.textContent = message;
  window.clearTimeout(showStatus._t);
  showStatus._t = window.setTimeout(() => {
    if (navigator.onLine) {
      els.offlineStatus.textContent = "Có thể dùng offline sau khi mở app một lần.";
    }
  }, 2200);
}

els.input.addEventListener("input", onSearch);
els.clearBtn.addEventListener("click", () => {
  els.input.value = "";
  els.input.focus();
  onSearch();
});

document.addEventListener("click", (event) => {
  const btn = event.target.closest("button");
  if (!btn) return;
  if (btn.dataset.copySeat) copyText(btn.dataset.copySeat, "ghế");
  if (btn.dataset.copyName) copyText(btn.dataset.copyName, "tên");
});

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredPrompt = event;
  els.installBtn.classList.remove("hidden");
});

els.installBtn.addEventListener("click", async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  els.installBtn.classList.add("hidden");
});

window.addEventListener("online", () => {
  els.offlineStatus.textContent = "Đang online.";
});
window.addEventListener("offline", () => {
  els.offlineStatus.textContent = "Bạn đang offline. Ứng dụng vẫn dùng được.";
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}

els.offlineStatus.textContent = "Có thể dùng offline sau khi mở app một lần.";
onSearch();
