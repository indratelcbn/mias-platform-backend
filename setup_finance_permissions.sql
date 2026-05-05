-- ================================================
-- SETUP PERMISSION MODUL FINANCE
-- ================================================
-- File: setup_finance_permissions.sql
-- Deskripsi: Script untuk memberikan akses ke modul Finance
-- Tanggal: 2026-05-04
-- ================================================

-- 1. SUPERADMIN: Full access ke semua modul termasuk Finance
INSERT INTO role_permissions (id, role, menu_key)
VALUES 
  (gen_random_uuid(), 'SUPERADMIN', 'admin-finance')
ON CONFLICT (role, menu_key) DO NOTHING;

-- 2. ADMIN: Full access ke Finance (opsional, sesuaikan kebutuhan)
INSERT INTO role_permissions (id, role, menu_key)
VALUES 
  (gen_random_uuid(), 'ADMIN', 'admin-finance')
ON CONFLICT (role, menu_key) DO NOTHING;

-- ================================================
-- ROLE LAIN (OPSIONAL)
-- ================================================
-- Uncomment jika role lain perlu akses

-- -- 3. SOSIAL: Akses untuk melihat dana program sosial
-- INSERT INTO role_permissions (id, role, menu_key)
-- VALUES 
--   (gen_random_uuid(), 'SOSIAL', 'admin-finance')
-- ON CONFLICT (role, menu_key) DO NOTHING;

-- -- 4. DAKWAH: Akses untuk melihat dana program dakwah
-- INSERT INTO role_permissions (id, role, menu_key)
-- VALUES 
--   (gen_random_uuid(), 'DAKWAH', 'admin-finance')
-- ON CONFLICT (role, menu_key) DO NOTHING;

-- -- 5. PENDIDIKAN: Akses untuk melihat dana program pendidikan
-- INSERT INTO role_permissions (id, role, menu_key)
-- VALUES 
--   (gen_random_uuid(), 'PENDIDIKAN', 'admin-finance')
-- ON CONFLICT (role, menu_key) DO NOTHING;

-- -- 6. USAHA: Akses untuk melihat dana program usaha
-- INSERT INTO role_permissions (id, role, menu_key)
-- VALUES 
--   (gen_random_uuid(), 'USAHA', 'admin-finance')
-- ON CONFLICT (role, menu_key) DO NOTHING;

-- ================================================
-- VERIFY: Check permission yang sudah ditambahkan
-- ================================================
SELECT * FROM role_permissions 
WHERE menu_key = 'admin-finance'
ORDER BY role;

-- ================================================
-- OUTPUT EXPECTED:
-- ================================================
-- role          | menu_key
-- --------------|---------------
-- SUPERADMIN    | admin-finance
-- ADMIN         | admin-finance
-- ================================================
