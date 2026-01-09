-- Create separate databases for each microservice

-- Auth Service Database
CREATE DATABASE auth_db;

-- Project Service Database
CREATE DATABASE project_db;

-- Task Service Database
CREATE DATABASE task_db;

-- Grant privileges (if needed)
GRANT ALL PRIVILEGES ON DATABASE auth_db TO postgres;
GRANT ALL PRIVILEGES ON DATABASE project_db TO postgres;
GRANT ALL PRIVILEGES ON DATABASE task_db TO postgres;