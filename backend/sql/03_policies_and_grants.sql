-- ==========================================
-- BẠCH Y CÁC – SQL 03
-- MÔN QUY: KHÓA QUYỀN + RLS POLICIES
-- Mục tiêu:
--  1) KHÓA bảng gốc students (không cho anon/auth select trực tiếp)
--  2) CHỈ cho phép web đọc VIEW inner_disciples
--  3) RLS: chỉ cho anon/auth "thấy" những hàng đủ điều kiện (paid + active + initiated)
--  4) (tuỳ chọn) auth user đọc được hồ sơ của chính mình qua email
-- ==========================================

-- 0) Bật RLS cho bảng students
alter table public.students enable row level security;

-- 1) Thu hồi quyền trực tiếp trên bảng students
-- (Dù có policy, không có privilege thì cũng không query trực tiếp được.)
revoke all on table public.students from anon, authenticated;

-- 2) Cho phép web đọc VIEW inner_disciples
grant select on public.inner_disciples to anon, authenticated;

-- 3) Xóa policy cũ (nếu run lại nhiều lần cho khỏi báo trùng)
drop policy if exists "students_public_read_paid_active" on public.students;
drop policy if exists "students_self_read_own_profile" on public.students;

-- 4) Policy: Cho phép anon/auth "đọc được" các hàng dùng cho VIEW inner_disciples
-- Điều kiện đúng luật mày đặt:
--  - đã bái sư
--  - đã paid
--  - active (chưa xuất môn)
create policy "students_public_read_paid_active"
on public.students
for select
to anon, authenticated
using (
  initiated = true
  and payment_status = 'paid'
  and student_status = 'active'
);

-- 5) (Tuỳ chọn nhưng nên có) Policy: học viên đăng nhập được đọc hồ sơ của chính mình
-- Vì Nội Viện trang cá nhân thường cần hiện đạo danh, avatar, ngày nhập môn...
-- Dựa theo email claim trong JWT.
create policy "students_self_read_own_profile"
on public.students
for select
to authenticated
using (
  email = (auth.jwt() ->> 'email')
);
