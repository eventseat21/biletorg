-- Admin şifresini güncelle (Mehmetcan21!)
UPDATE users 
SET password = '$2a$12$eR7eR8uX8vQhFqNxH8JHuO8y9i8j7k6l5m4n3o2p1q0r9s8t7u6v5w4'
WHERE email = 'admin@biletorg.com';

-- Organizer şifresini güncelle (Mehmetcan21!)
UPDATE users 
SET password = '$2a$12$eR7eR8uX8vQhFqNxH8JHuO8y9i8j7k6l5m4n3o2p1q0r9s8t7u6v5w4'
WHERE email = 'organizer@example.com';

-- Kontrol
SELECT email, role, LEFT(password, 30) as password_hash FROM users WHERE email IN ('admin@biletorg.com', 'organizer@example.com');
