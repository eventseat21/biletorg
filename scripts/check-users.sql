-- Kullanıcıları kontrol et
SELECT id, email, name, role, password, "createdAt" 
FROM "users"
ORDER BY "createdAt" DESC
LIMIT 20;