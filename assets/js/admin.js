import { supabase, signedInRedirect } from './supabaseClient.js';

const emailForm = document.getElementById('admin-email-form');
const adminShell = document.getElementById('admin-shell');
const pendingList = document.getElementById('pending-list');
const loadingState = document.getElementById('pending-loading');
const emptyState = document.getElementById('pending-empty');

const PRACTICE_OPTIONS = ['Tử Vi', 'Tứ Trụ', 'Phong Thủy', 'Địa Lý', 'Khác'];

const renderPracticeOptions = (selected = '') => PRACTICE_OPTIONS
  .map((practice) => `<option value="${practice}" ${practice === selected ? 'selected' : ''}>${practice}</option>`)
  .join('');

const renderPending = (items) => {
  pendingList.innerHTML = items.map((item) => {
    const applicationId = item.application_id || item.id;
    const email = item.email || item.contact_email || '';
    const hoTen = item.full_name || item.ho_ten || 'Ứng viên';
    const practice = item.phap_mon_suggested || item.practice_suggested || '';

    return `
      <article class="pending-card" data-id="${applicationId}">
        <header>
          <div>
            <p class="label">Họ tên</p>
            <h3>${hoTen}</h3>
          </div>
          <div>
            <p class="label">Email</p>
            <p>${email}</p>
          </div>
        </header>
        <div class="pending-body">
          <label class="stack">
            <span class="label">Đạo danh sẽ cấp</span>
            <input name="dao_danh" type="text" placeholder="Ví dụ: Thanh Vân – Tử Vi" required />
          </label>
          <label class="stack">
            <span class="label">Pháp môn</span>
            <select name="phap_mon">${renderPracticeOptions(practice)}</select>
          </label>
          <div class="actions">
            <button class="btn" data-action="approve">Approve</button>
            <button class="btn-secondary" data-action="mark-paid">Mark paid</button>
            <button class="btn-danger" data-action="xuat-mon">Xuất môn</button>
          </div>
        </div>
      </article>
    `;
  }).join('');
};

const toggleStates = ({ loading, empty }) => {
  loadingState.hidden = !loading;
  emptyState.hidden = !empty;
};

async function loadPending() {
  toggleStates({ loading: true, empty: false });
  pendingList.innerHTML = '';

  const { data, error } = await supabase
    .from('pending_van_tam')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Không thể tải danh sách pending', error);
    toggleStates({ loading: false, empty: true });
    emptyState.textContent = 'Không tải được danh sách pending. Vui lòng thử lại.';
    return;
  }

  renderPending(data || []);
  toggleStates({ loading: false, empty: (data || []).length === 0 });
}

function getCardPayload(card) {
  const applicationId = card.getAttribute('data-id');
  const daoDanh = card.querySelector('input[name="dao_danh"]').value.trim();
  const phapMon = card.querySelector('select[name="phap_mon"]').value;
  return { applicationId, daoDanh, phapMon };
}

async function handleAction(event) {
  const button = event.target.closest('button[data-action]');
  if (!button) return;

  const card = button.closest('.pending-card');
  const { applicationId, daoDanh, phapMon } = getCardPayload(card);
  const action = button.getAttribute('data-action');

  try {
    button.disabled = true;
    if (action === 'approve') {
      await supabase.rpc('approve_application', {
        application_id: applicationId,
        dao_danh: daoDanh,
        phap_mon: phapMon,
      });
    }
    if (action === 'mark-paid') {
      await supabase.rpc('mark_payment_paid', {
        application_id: applicationId,
      });
    }
    if (action === 'xuat-mon') {
      await supabase.rpc('mark_xuat_mon', {
        application_id: applicationId,
      });
    }
  } catch (error) {
    console.error('Không thể cập nhật', error);
  } finally {
    button.disabled = false;
    loadPending();
  }
}

async function initAuth() {
  const { data } = await supabase.auth.getSession();
  if (data.session) {
    emailForm.hidden = true;
    adminShell.hidden = false;
    loadPending();
  }

  supabase.auth.onAuthStateChange((event, session) => {
    if (session) {
      emailForm.hidden = true;
      adminShell.hidden = false;
      loadPending();
    }
    if (event === 'SIGNED_OUT') {
      adminShell.hidden = true;
      emailForm.hidden = false;
    }
  });
}

emailForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const email = event.target.email.value.trim();
  if (!email) return;
  await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: signedInRedirect,
    },
  });
  event.target.reset();
  emailForm.querySelector('.hint').textContent = 'Đã gửi magic link đến email. Kiểm tra hộp thư để đăng nhập.';
});

pendingList.addEventListener('click', handleAction);
initAuth();
