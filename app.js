const RAW_GUESTS = Array.isArray(window.GUESTS) ? window.GUESTS : [];
const searchInput = document.getElementById('searchInput');
const clearBtn = document.getElementById('clearBtn');
const guestList = document.getElementById('guestList');
const totalCount = document.getElementById('totalCount');
const visibleCount = document.getElementById('visibleCount');
const miniMeta = document.getElementById('miniMeta');

const resultEmpty = document.getElementById('resultEmpty');
const resultCard = document.getElementById('resultCard');
const seatBadge = document.getElementById('seatBadge');
const seatNote = document.getElementById('seatNote');
const resultName = document.getElementById('resultName');
const resultSub = document.getElementById('resultSub');
const resultPosition = document.getElementById('resultPosition');
const resultFull = document.getElementById('resultFull');

function normalizeText(value) {
  return (value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildSearchText(item) {
  return [
    item.rank_name,
    item.position,
    item.seat,
    item.seat_span,
    item.row_letter,
    item.seat_number,
    item.title,
    item.name,
    item.full_text
  ].filter(Boolean).join(' ');
}

const GUESTS = RAW_GUESTS.map((item, index) => {
  const searchRaw = buildSearchText(item);
  return {
    ...item,
    _id: index,
    _search: normalizeText(searchRaw),
    _nameNorm: normalizeText(item.rank_name || ''),
    _positionNorm: normalizeText(item.position || ''),
    _fullNorm: normalizeText(item.full_text || ''),
    _seatNorm: normalizeText(`${item.seat || ''} ${item.seat_span || ''}`)
  };
});

let pinnedId = null;

function formatSub(item) {
  const parts = [];
  if (item.title) parts.push(item.title);
  if (item.name) parts.push(item.name);
  if (item.row_letter && item.seat_number !== undefined) parts.push(`Khu ${item.row_letter} · ghế ${item.seat_number}`);
  return parts.join(' · ');
}

function showResult(item, emptyText) {
  if (!item) {
    resultCard.classList.add('hidden');
    resultEmpty.classList.remove('hidden');
    resultEmpty.textContent = emptyText || 'Không tìm thấy kết quả phù hợp.';
    seatNote.classList.add('hidden');
    resultFull.classList.add('hidden');
    return;
  }
  seatBadge.textContent = item.seat || '';
  resultName.textContent = item.rank_name || item.full_text || 'Không có thông tin';
  resultSub.textContent = formatSub(item);
  resultPosition.textContent = item.position || 'Không có thông tin bổ sung.';
  if (item.seat_span) {
    seatNote.textContent = `Ô ghế phủ: ${item.seat_span}`;
    seatNote.classList.remove('hidden');
  } else {
    seatNote.classList.add('hidden');
  }
  if (item.full_text) {
    resultFull.textContent = item.full_text;
    resultFull.classList.remove('hidden');
  } else {
    resultFull.classList.add('hidden');
  }
  resultEmpty.classList.add('hidden');
  resultCard.classList.remove('hidden');
}

function computeScore(item, queryNorm) {
  if (!queryNorm) return 0;
  let score = 0;
  if (item._seatNorm === queryNorm) score += 1200;
  if (item._nameNorm === queryNorm) score += 1000;
  if (item._nameNorm.startsWith(queryNorm)) score += 700;
  if (item._positionNorm.startsWith(queryNorm)) score += 480;
  if (item._fullNorm.startsWith(queryNorm)) score += 320;
  if (item._seatNorm.includes(queryNorm)) score += 280;
  if (item._nameNorm.includes(queryNorm)) score += 220;
  if (item._positionNorm.includes(queryNorm)) score += 120;
  if (item._fullNorm.includes(queryNorm)) score += 80;
  return score;
}

function sortResults(items, queryNorm) {
  if (!queryNorm) return items.slice();
  return items
    .map(item => ({ item, score: computeScore(item, queryNorm) }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.item._id - b.item._id;
    })
    .map(entry => entry.item);
}

function filterGuests(query) {
  const queryNorm = normalizeText(query);
  if (!queryNorm) {
    return { items: GUESTS.slice(), queryNorm };
  }
  const matched = GUESTS.filter(item => item._search.includes(queryNorm));
  return { items: sortResults(matched, queryNorm), queryNorm };
}

function makeGuestItem(item) {
  const article = document.createElement('article');
  article.className = 'guest-item';
  article.dataset.id = String(item._id);
  if (pinnedId === item._id) article.classList.add('is-pinned');

  const seat = document.createElement('div');
  seat.className = 'guest-seat';
  seat.textContent = item.seat || '';

  const body = document.createElement('div');
  const name = document.createElement('h3');
  name.className = 'guest-name';
  name.textContent = item.rank_name || item.full_text || '';
  const sub = document.createElement('p');
  sub.className = 'guest-sub';
  sub.textContent = formatSub(item);
  const position = document.createElement('p');
  position.className = 'guest-position';
  position.textContent = item.position || 'Không có thông tin bổ sung.';
  body.appendChild(name);
  body.appendChild(sub);
  body.appendChild(position);

  if (item.seat_span || item.full_text) {
    const full = document.createElement('p');
    full.className = 'guest-full';
    full.textContent = item.seat_span ? `Ô ghế phủ: ${item.seat_span}` : item.full_text;
    body.appendChild(full);
  }

  article.appendChild(seat);
  article.appendChild(body);

  article.addEventListener('click', () => {
    pinnedId = item._id;
    showResult(item);
    document.querySelectorAll('.guest-item.is-pinned').forEach(node => node.classList.remove('is-pinned'));
    article.classList.add('is-pinned');
  });

  return article;
}

function render(items, queryNorm) {
  guestList.innerHTML = '';
  totalCount.textContent = String(GUESTS.length);
  visibleCount.textContent = String(items.length);
  miniMeta.textContent = queryNorm ? `${items.length} kết quả` : `Hiện toàn bộ ${GUESTS.length} dòng`;

  if (!items.length) {
    const empty = document.createElement('div');
    empty.className = 'no-result';
    empty.textContent = 'Không tìm thấy kết quả phù hợp. Bạn có thể thử tên, chức danh, đơn vị, khu hoặc mã ghế.';
    guestList.appendChild(empty);
    showResult(null, 'Không tìm thấy kết quả phù hợp.');
    return;
  }

  const frag = document.createDocumentFragment();
  items.forEach(item => frag.appendChild(makeGuestItem(item)));
  guestList.appendChild(frag);

  const pinnedItem = items.find(item => item._id === pinnedId);
  showResult(pinnedItem || items[0], queryNorm ? 'Không tìm thấy kết quả phù hợp.' : 'Mở ra là thấy toàn bộ danh sách. Gõ tên hoặc bất kỳ thông tin nào để lọc nhanh.');
}

function refresh() {
  const { items, queryNorm } = filterGuests(searchInput.value);
  if (queryNorm && !items.some(item => item._id === pinnedId)) pinnedId = null;
  render(items, queryNorm);
}

searchInput.addEventListener('input', () => {
  pinnedId = null;
  refresh();
});

clearBtn.addEventListener('click', () => {
  searchInput.value = '';
  pinnedId = null;
  refresh();
  searchInput.focus();
});

refresh();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}
