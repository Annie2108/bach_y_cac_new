-- ==========================================
-- BẠCH Y CÁC – SQL 02
-- VIEW: DANH SÁCH ĐỆ TỬ NỘI VIỆN
-- Chỉ hiển thị:
--  - Đã bái sư
--  - Đã đóng phí
--  - Chưa xuất môn
--  - Lọc theo pháp môn
-- ==========================================

create or replace view public.inner_disciples as
select
  id,
  dao_danh_display,
  phap_mon,
  avatar_url,
  joined_at,

  -- Bio mặc định, KHÔNG cho học viên tự ghi
  'Đệ tử nội môn'::text as bio_line

from public.students
where
  initiated = true
  and payment_status = 'paid'
  and student_status = 'active'
order by joined_at desc;
