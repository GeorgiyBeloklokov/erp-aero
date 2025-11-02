import pool from './index';

const createSchema = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        login VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS files (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        filename VARCHAR(255) NOT NULL,
        extension VARCHAR(255) NOT NULL,
        mime_type VARCHAR(255) NOT NULL,
        size INT NOT NULL,
        upload_date DATETIME NOT NULL,
        user_id INT,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        token VARCHAR(255) NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);

    console.log('Database schema created successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error creating database schema:', error);
    process.exit(1);
  }
};

createSchema();
