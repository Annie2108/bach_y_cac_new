-- ===============================
-- BẠCH Y CÁC – SQL 01
-- TẠO KIỂU TRẠNG THÁI + BẢNG STUDENTS
-- ===============================

-- 1. Tạo enum cho trạng thái thanh toán
do $$
begin
  create type payment_status as enum ('unpaid', 'invoiced', 'paid');
exception
  when duplicate_object then null;
end $$;

-- 2. Tạo enum cho trạng thái học viên
do $$
begin
  create type student_status as enum (
    'candidate',   -- đã được duyệt, chưa bái sư
    'initiated',   -- đã bái sư
    'active',      -- đã đóng phí, đang là đệ tử nội viện
    'xuat_mon'     -- đệ tử xuất môn
  );
exception
  when duplicate_object then null;
end $$;

-- 3. Tạo bảng students (sổ bộ Nội Viện)
create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),

  -- Định danh hệ thống
  email text unique not null,
  fullname text,

  -- Đạo danh do Sơn Môn đặt
  dao_danh_core text unique not null,        -- ví dụ: "Thanh Vân"
  phap_mon text not null,                    -- ví dụ: "Tử Vi"
  dao_danh_display text not null,             -- ví dụ: "Thanh Vân – Tử Vi"

  -- Hồ sơ hiển thị
  avatar_url text,

  -- Nghi thức bái sư
  initiated boolean not null default false,
  oath_text text,
  initiated_at timestamptz,
  joined_at timestamptz,

  -- Trạng thái
  payment_status payment_status not null default 'unpaid',
  student_status student_status not null default 'candidate',

  -- Ghi chú nội bộ (thu phí, xuất môn...)
  payment_note text,

  created_at timestamptz not null default now()
);
