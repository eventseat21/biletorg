-- Admin şifresini güncelle (Mehmetcan21!)
UPDATE users 
SET password = '$2a$12$/gpuDXKr1/f/uTdPXJ5JxOCWKlAhZ8BmrTardCa9Xq3rSlenIz55e'
WHERE email = 'admin@biletorg.com';

-- Organizer şifresini güncelle (Mehmetcan21!)
UPDATE users 
SET password = '$2a$12$/gpuDXKr1/f/uTdPXJ5JxOCWKlAhZ8BmrTardCa9Xq3rSlenIz55e'
WHERE email = 'organizer@example.com';

-- Kontrol
SELECT email, role, LEFT(password, 30) as password_hash FROM users WHERE email IN ('admin@biletorg.com', 'organizer@example.com');
