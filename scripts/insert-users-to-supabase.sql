-- Supabase'e kullanıcıları ekle
-- Bu SQL'i Supabase SQL Editor'de çalıştır

-- Önce mevcut kullanıcıları temizle (varsa)
DELETE FROM "User" WHERE email IN ('admin@biletorg.com', 'organizer@example.com');

-- Admin kullanıcısı ekle
INSERT INTO "User" (id, email, name, password, role, "createdAt", "updatedAt")
VALUES (
  'cmo9t8luu0000xdw5qj06dk2r',
  'admin@biletorg.com',
  'Admin',
  '$2a$12$phK24U5qrGxKrBqn.2jfNOY8rfAUxCaAw7h6.cs0RdTCfhPbxUUvm',
  'ADMIN',
  NOW(),
  NOW()
);

-- Organizer kullanıcısı ekle
INSERT INTO "User" (id, email, name, password, role, "createdAt", "updatedAt")
VALUES (
  'cmo9527an0001r0hz31ueftmv',
  'organizer@example.com',
  'Demo Organizer',
  '$2a$12$Hbv1jZbxvvKCtbpLbOh4e.FOdHxRXqr9mJwb/0j/oEASwd4PeW0r.',
  'ORGANIZER',
  NOW(),
  NOW()
);

-- Kontrol
SELECT id, email, name, role, "createdAt" FROM "User" ORDER BY "createdAt" DESC;
