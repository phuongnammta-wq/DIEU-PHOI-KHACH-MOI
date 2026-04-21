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

function parseSeat(seat) {
  const match = String(seat || "").match(/^([A-Z]+)(\d+)$/i);
  if (!match) {
    return { row: String(seat || ""), number: 0 };
  }
  return {
    row: match[1].toUpperCase(),
    number: Number(match[2])
  };
}

function highlight(text, query) {
  const cleanQuery = query.trim();
  if (!cleanQuery) return escapeHtml(text);

  const normalizedQuery = normalizeText(cleanQuery);
  const words = normalizedQuery.split(" ").filter(Boolean);
  if (!words.length) return escapeHtml(text);

  return String(text)
    .split(/(\s+)/)
    .map((token) => {
      const tokenNorm = normalizeText(token);
      return words.some((word) => tokenNorm.includes(word))
        ? `<mark>${escapeHtml(token)}</mark>`
        : escapeHtml(token);
    })
    .join("");
}

const guests = Array.isArray(window.GUESTS)
  ? window.GUESTS
      .map((item, index) => ({
        id: index + 1,
        ...item,
        normalizedName: normalizeText(item.rank_name),
        normalizedPosition: normalizeText(item.position || ""),
        normalizedSeat: normalizeText(item.seat || ""),
        seatMeta: parseSeat(item.seat || "")
      }))
      .sort((a, b) => {
        const rowCompare = a.seatMeta.row.localeCompare(b.seatMeta.row, "vi");
        if (rowCompare !== 0) return rowCompare;
        return a.seatMeta.number - b.seatMeta.number;
      })
  : [];

const els = {
  input: document.getElementById("searchInput"),
  clearBtn: document.getElementById("clearBtn"),
  recordCount: document.getElementById("recordCount"),
  totalGuests: document.getElementById("totalGuests"),
  visibleGuests: document.getElementById("visibleGuests"),
  results: document.getElementById("results"),
  emptyState: document.getElementById("emptyState"),
  featuredResult: document.getElementById("featuredResult"),
  installBtn: document.getElementById("installBtn"),
  offlineStatus: document.getElementById("offlineStatus"),
  sectionSubtitle: document.getElementById("sectionSubtitle")
};

els.totalGuests.textContent = guests.length;
els.recordCount.textContent = `Nhập tên để hiện ghế nhanh nhất`;

let deferredPrompt = null;
let selectedGuestId = null;

function rankGuest(guest, q) {
  const exactSeat = guest.normalizedSeat === q ? 120 : 0;
  const exactName = guest.normalizedName === q ? 100 : 0;
  const startsName = guest.normalizedName.startsWith(q) ? 70 : 0;
  const includesName = guest.normalizedName.includes(q) ? 50 : 0;
  const includesPosition = guest.normalizedPosition.includes(q) ? 15 : 0;
  return exactSeat + exactName + startsName + includesName + includesPosition;
}

function searchGuests(query) {
  const q = normalizeText(query);

  if (!q) {
    return guests.map((guest) => ({ ...guest, score: 0 }));
  }

  return guests
    .filter(
      (guest) =>
        guest.normalizedName.includes(q) ||
        guest.normalizedPosition.includes(q) ||
        guest.normalizedSeat.includes(q)
    )
    .map((guest) => ({ ...guest, score: rankGuest(guest, q) }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const rowCompare = a.seatMeta.row.localeCompare(b.seatMeta.row, "vi");
      if (rowCompare !== 0) return rowCompare;
      return a.seatMeta.number - b.seatMeta.number;
    });
}

function renderFeatured(guest, query = "") {
  if (!guest) {
    const cleanQuery = query.trim();
    els.featuredResult.classList.add("is-empty");
    els.featuredResult.innerHTML = `
      <div class="featured-topline">Kết quả nổi bật</div>
      <div class="featured-empty">
        <div class="featured-empty-seat">?</div>
        <div>
          <div class="featured-empty-title">${cleanQuery ? "Chưa tìm thấy khách mời phù hợp" : "Kết quả sẽ hiện ở đây"}</div>
          <div class="featured-empty-text">${cleanQuery ? `Không có kết quả cho “${escapeHtml(cleanQuery)}”. Hãy thử gõ ít ký tự hơn hoặc bỏ dấu tiếng Việt.` : "Gõ tên khách mời, hệ thống sẽ lọc ngay và giữ kết quả nổi bật ở phía trên để bạn xem ghế nhanh, không bị nhảy màn hình."}</div>
        </div>
      </div>
    `;
    return;
  }

  els.featuredResult.classList.remove("is-empty");
  els.featuredResult.innerHTML = `
    <div class="featured-topline">Kết quả nổi bật</div>
    <div class="featured-layout">
      <div class="featured-seat-wrap">
        <div class="seat-caption">Ghế</div>
        <div class="seat-pill">${escapeHtml(guest.seat)}</div>
      </div>
      <div class="featured-info">
        <div class="name">${escapeHtml(guest.rank_name)}</div>
        <div class="position">${escapeHtml(guest.position || "Không có chức vụ đi kèm")}</div>
        <div class="actions">
          <button type="button" class="action-btn" data-copy-seat="${escapeHtml(guest.seat)}">Sao chép ghế</button>
          <button type="button" class="action-btn" data-copy-name="${escapeHtml(guest.rank_name)}">Sao chép tên</button>
        </div>
      </div>
    </div>
  `;
}

function renderResults(matches, query) {
  els.results.innerHTML = "";
  const cleanQuery = query.trim();
  els.visibleGuests.textContent = matches.length;

  if (!matches.length) {
    els.emptyState.hidden = false;
    els.sectionSubtitle.textContent = cleanQuery
      ? `Không tìm thấy kết quả cho “${cleanQuery}”.`
      : "Chưa có dữ liệu để hiển thị.";
    renderFeatured(null, query);
    return;
  }

  els.emptyState.hidden = true;

  if (cleanQuery) {
    els.sectionSubtitle.textContent = `Tìm thấy ${matches.length} khách mời phù hợp với “${cleanQuery}”.`;
  } else {
    els.sectionSubtitle.textContent = `Đang hiển thị đầy đủ ${matches.length} khách mời.`;
  }

  const activeGuest = matches.find((guest) => guest.id === selectedGuestId) || matches[0] || null;
  renderFeatured(activeGuest, query);

  matches.forEach((guest) => {
    const card = document.createElement("article");
    const isActive = activeGuest && guest.id === activeGuest.id;
    card.className = `result-card${isActive ? " active" : ""}`;
    card.setAttribute("role", "button");
    card.setAttribute("tabindex", "0");
    card.dataset.id = String(guest.id);

    card.innerHTML = `
      <div class="result-main">
        <div class="result-meta-row">
          <span class="row-badge">Dãy ${escapeHtml(guest.seatMeta.row)}</span>
          <span class="tap-hint">Chạm để xem nhanh</span>
        </div>
        <div class="name">${highlight(guest.rank_name, query)}</div>
        <div class="position">${escapeHtml(guest.position || "")}</div>
      </div>
      <div class="seat-block">
        <div class="seat-label">Ghế</div>
        <div class="seat">${escapeHtml(guest.seat)}</div>
      </div>
    `;
    els.results.appendChild(card);
  });
}

function onSearch() {
  const query = els.input.value || "";
  if (!query.trim()) {
    selectedGuestId = null;
  }
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
  window.clearTimeout(showStatus._timer);
  showStatus._timer = window.setTimeout(() => {
    els.offlineStatus.textContent = navigator.onLine
      ? "Có thể dùng offline sau khi mở app một lần."
      : "Bạn đang offline. Ứng dụng vẫn dùng được.";
  }, 2200);
}

function focusGuestCard(guestId) {
  selectedGuestId = guestId;
  const currentMatches = searchGuests(els.input.value || "");
  const guest = currentMatches.find((item) => item.id === guestId);
  renderResults(currentMatches, els.input.value || "");
  if (guest) {
    renderFeatured(guest, els.input.value || "");
  }
}

els.input.addEventListener("input", onSearch);
els.clearBtn.addEventListener("click", () => {
  els.input.value = "";
  selectedGuestId = null;
  els.input.focus();
  onSearch();
});

document.addEventListener("click", (event) => {
  const btn = event.target.closest("button");
  if (btn?.dataset.copySeat) {
    copyText(btn.dataset.copySeat, "ghế");
    return;
  }
  if (btn?.dataset.copyName) {
    copyText(btn.dataset.copyName, "tên");
    return;
  }

  const card = event.target.closest(".result-card");
  if (card?.dataset.id) {
    focusGuestCard(Number(card.dataset.id));
  }
});

document.addEventListener("keydown", (event) => {
  const card = event.target.closest?.(".result-card");
  if (!card?.dataset.id) return;
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    focusGuestCard(Number(card.dataset.id));
  }
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
