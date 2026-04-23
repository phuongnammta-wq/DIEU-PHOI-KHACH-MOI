const guests = (window.GUESTS || []).map((g, index) => ({
  ...g,
  _id: index,
  _search: normalizeText(`${g.rank_name} ${g.position} ${g.seat}`)
}));

const input = document.getElementById('searchInput');
const guestList = document.getElementById('guestList');
const featuredResult = document.getElementById('featuredResult');
const totalCount = document.getElementById('totalCount');
const visibleCount = document.getElementById('visibleCount');

let activeId = null;
let currentItems = guests.slice();

totalCount.textContent = guests.length;

function normalizeText(value) {
  return (value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function rankScore(item, query) {
  if (!query) return 0;
  const name = normalizeText(item.rank_name);
  const seat = normalizeText(item.seat);
  if (seat === query) return 500;
  if (name === query) return 450;
  if (name.startsWith(query)) return 320;
  if (name.includes(` ${query}`)) return 260;
  if (item._search.startsWith(query)) return 220;
  return 120;
}

function setFeatured(item) {
  if (!item) {
    featuredResult.classList.add('empty');
    featuredResult.innerHTML = `<div class='featured-seat'>Chưa chọn</div><div class='featured-content'><div class='featured-name'>Gõ tên để hiện ghế ngồi ngay tại đây</div><div class='featured-position'>Kết quả sẽ luôn cố định phía trên để không bị nhảy khi tìm kiếm.</div></div>`;
    return;
  }
  featuredResult.classList.remove('empty');
  featuredResult.innerHTML = `<div class='featured-seat'>${item.seat}</div><div class='featured-content'><div class='featured-name'>${escapeHtml(item.rank_name)}</div><div class='featured-position'>${escapeHtml(item.position || 'Không có ghi chú chức vụ')}</div></div>`;
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function render(items) {
  visibleCount.textContent = items.length;
  if (!items.length) {
    guestList.innerHTML = `<div class='empty-list'>Không tìm thấy khách mời phù hợp.</div>`;
    setFeatured(null);
    return;
  }
  const first = items[0];
  if (activeId == null || !items.some(item => item._id === activeId)) {
    activeId = first._id;
  }
  const active = items.find(item => item._id === activeId) || first;
  setFeatured(active);
  guestList.innerHTML = items.map(item => `
    <article class='guest-item ${item._id === activeId ? 'active' : ''}' data-id='${item._id}'>
      <div class='guest-seat'>${escapeHtml(item.seat)}</div>
      <div>
        <div class='guest-name'>${escapeHtml(item.rank_name)}</div>
        <div class='guest-position'>${escapeHtml(item.position || 'Không có ghi chú chức vụ')}</div>
      </div>
    </article>
  `).join('');
}

function applyFilter() {
  const query = normalizeText(input.value);
  const items = !query
    ? guests.slice()
    : guests
        .filter(item => item._search.includes(query))
        .sort((a, b) => rankScore(b, query) - rankScore(a, query) || a._id - b._id);
  currentItems = items;
  if (query && items[0]) activeId = items[0]._id;
  render(items);
}

guestList.addEventListener('click', event => {
  const card = event.target.closest('.guest-item');
  if (!card) return;
  activeId = Number(card.dataset.id);
  render(currentItems);
});

input.addEventListener('input', applyFilter);
render(guests.slice());
