const guests = Array.isArray(window.GUESTS) ? window.GUESTS : [];
const searchInput = document.getElementById('searchInput');
const guestList = document.getElementById('guestList');
const totalCount = document.getElementById('totalCount');
const showingCount = document.getElementById('showingCount');
const resultSeat = document.getElementById('resultSeat');
const resultName = document.getElementById('resultName');
const resultPos = document.getElementById('resultPos');

totalCount.textContent = guests.length.toString();

function renderResult(item){
  if(!item){
    resultSeat.textContent = '—';
    resultName.textContent = 'Chưa chọn khách mời';
    resultPos.textContent = 'Nhập tên bên dưới để lọc danh sách.';
    return;
  }
  resultSeat.textContent = item.seat || '—';
  resultName.textContent = item.rank_name || '';
  resultPos.textContent = item.position || '';
}

function card(item){
  const btn = document.createElement('button');
  btn.className = 'guest-item';
  btn.type = 'button';
  btn.innerHTML = `
    <div class="guest-top">
      <div class="guest-name"></div>
      <div class="guest-seat"></div>
    </div>
    <div class="guest-pos"></div>
  `;
  btn.querySelector('.guest-name').textContent = item.rank_name || '';
  btn.querySelector('.guest-seat').textContent = item.seat || '';
  btn.querySelector('.guest-pos').textContent = item.position || '';
  btn.addEventListener('click', () => renderResult(item));
  return btn;
}

function filterGuests(query){
  const q = query.trim().toLowerCase();
  if(!q) return guests.slice();
  return guests.filter(g => (g.search || '').includes(q));
}

function renderList(items){
  guestList.innerHTML = '';
  showingCount.textContent = items.length.toString();
  if(!items.length){
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.textContent = 'Không tìm thấy khách mời phù hợp.';
    guestList.appendChild(empty);
    renderResult(null);
    return;
  }
  const top = items[0];
  renderResult(top);
  const frag = document.createDocumentFragment();
  items.forEach(item => frag.appendChild(card(item)));
  guestList.appendChild(frag);
}

searchInput.addEventListener('input', (e) => {
  renderList(filterGuests(e.target.value));
});

renderList(guests);
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}
