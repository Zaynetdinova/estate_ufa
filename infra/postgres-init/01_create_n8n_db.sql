-- Создаём базу для n8n если не существует
SELECT 'CREATE DATABASE n8n_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'n8n_db')\gexec
