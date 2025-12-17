import { supabase, signedInRedirect } from './supabaseClient.js';

const statusBlock = document.getElementById('initiation-status');
const oathForm = document.getElementById('oath-form');
const daoDanhField = document.getElementById('dao-danh');
const emailForm = document.getElementById('ceremony-email-form');

const setStatus = (message) => {
  statusBlock.textContent = message;
};

const formatDaoDanh = (row) => row.dao_danh || row.spiritual_name || '';

async function fetchInitiationState(user) {
  const { data, error } = await supabase
    .from('inner_disciples')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    console.error('Không thể lấy trạng thái bái sư', error);
    setStatus('Không thể kiểm tra trạng thái. Vui lòng thử lại.');
    return null;
  }
  return data;
}

async function recordOath(userId, text) {
  return supabase.rpc('record_bai_su', {
    oath_text: text,
    user_id: userId,
  });
}

async function bootstrap() {
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    emailForm.hidden = false;
    oathForm.hidden = true;
    setStatus('Vui lòng đăng nhập email để tiến hành bái sư.');
    return;
  }

  const disciple = await fetchInitiationState(data.session.user);
  if (!disciple) return;

  const daoDanh = formatDaoDanh(disciple);
  daoDanhField.value = daoDanh;

  if (!disciple.initiated) {
    setStatus('Hồ sơ đã được duyệt. Hãy đọc kỹ lời thệ và bấm hoàn tất.');
    oathForm.hidden = false;
  } else {
    setStatus('Bạn đã hoàn tất bái sư. Hẹn gặp tại Nội Viện.');
    oathForm.hidden = true;
  }
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
  setStatus('Đã gửi magic link đến email. Mở email để tiếp tục.');
});

oathForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    setStatus('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    return;
  }
  const oath = event.target.oath.value.trim();
  if (!oath) return;
  await recordOath(sessionData.session.user.id, oath);
  setStatus('Đã ghi nhận lễ bái sư. Bạn sẽ được chuyển vào Nội Viện khi hoàn tất.');
  event.target.reset();
});

bootstrap();