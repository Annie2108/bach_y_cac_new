import { supabase } from './supabaseClient.js';

const listContainer = document.getElementById('disciple-list');
const filterSelect = document.getElementById('practice-filter');
const emptyState = document.getElementById('disciple-empty');
const loadingState = document.getElementById('disciple-loading');

const formatDate = (value) => {
  if (!value) return '';
  const dt = new Date(value);
  return dt.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const normalizeDisciple = (row) => ({
  id: row.id,
  daoDanh: row.dao_danh || row.spiritual_name || '',
  phapMon: row.phap_mon || row.practice || row.practice_name || '',
  avatar: row.avatar_url || row.avatar || '',
  joinedAt: row.initiated_at || row.joined_at || row.ngay_nhap_mon || row.created_at,
  bio: row.bio || 'Đệ tử nội môn',
});

const renderFilter = (items) => {
  const practices = Array.from(
    new Set(items.map((item) => item.phapMon).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b, 'vi'));

  filterSelect.innerHTML = '<option value="">Tất cả pháp môn</option>' +
    practices.map((p) => `<option value="${p}">${p}</option>`).join('');
};

const renderList = (items) => {
  listContainer.innerHTML = items.map((disciple) => `
    <article class="disciple-card" data-practice="${disciple.phapMon}">
      <div class="disciple-avatar" aria-hidden="true">
        <img src="${disciple.avatar || 'assets/img/avatar-placeholder.svg'}" alt="Ảnh đại diện của ${disciple.daoDanh || 'đệ tử'}">
      </div>
      <div class="disciple-meta">
        <h3>${disciple.daoDanh || 'Đạo danh đang cập nhật'}</h3>
        <p class="practice">${disciple.phapMon || 'Pháp môn đang cập nhật'}</p>
        <p class="bio">${disciple.bio}</p>
        <p class="joined">Ngày nhập môn: ${formatDate(disciple.joinedAt) || 'Đang xác nhận'}</p>
      </div>
    </article>
  `).join('');
};

const toggleStates = ({ loading, empty }) => {
  loadingState.hidden = !loading;
  emptyState.hidden = !empty;
};

async function loadInnerDisciples() {
  toggleStates({ loading: true, empty: false });
  listContainer.innerHTML = '';

  const { data, error } = await supabase
    .from('inner_disciples')
    .select('*')
    .order('initiated_at', { ascending: false });

  if (error) {
    console.error('Không thể tải danh sách nội viện', error);
    toggleStates({ loading: false, empty: true });
    emptyState.textContent = 'Không thể tải danh sách lúc này. Vui lòng thử lại sau.';
    return;
  }

  const normalized = (data || []).map(normalizeDisciple);

  renderFilter(normalized);
  renderList(normalized);

  toggleStates({ loading: false, empty: normalized.length === 0 });
}

function setupFiltering() {
  filterSelect.addEventListener('change', () => {
    const value = filterSelect.value;
    const cards = listContainer.querySelectorAll('.disciple-card');
    cards.forEach((card) => {
      const practice = card.getAttribute('data-practice');
      const visible = !value || practice === value;
      card.hidden = !visible;
    });
    const visibleCount = Array.from(cards).some((card) => !card.hidden);
    toggleStates({ loading: false, empty: !visibleCount });
  });
}

loadInnerDisciples();
setupFiltering();