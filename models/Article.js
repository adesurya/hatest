const { pool } = require('../config/database');
const fs = require('fs');
const path = require('path');
const { slugify } = require('../utils/helpers');

class Article {
  // Get all articles with pagination and filtering
  static async getAll(options = {}) {
    try {
      let query = `
        SELECT a.*, ac.name as category_name, u.full_name as author_name
        FROM articles a
        JOIN article_categories ac ON a.category_id = ac.id
        JOIN users u ON a.created_by = u.id
      `;
      
      const params = [];
      
      // Filter by status
      if (options.status) {
        query += ' WHERE a.status = ?';
        params.push(options.status);
      }
      
      // Filter by category
      if (options.categoryId) {
        query += options.status ? ' AND a.category_id = ?' : ' WHERE a.category_id = ?';
        params.push(options.categoryId);
      }
      
      // Search by title
      if (options.search) {
        const searchTerm = `%${options.search}%`;
        query += options.status || options.categoryId 
          ? ' AND (a.title LIKE ? OR a.content LIKE ?)' 
          : ' WHERE (a.title LIKE ? OR a.content LIKE ?)';
        params.push(searchTerm, searchTerm);
      }
      
      // Sorting
      query += ' ORDER BY ' + (options.sortBy || 'a.created_at') + ' ' + (options.sortOrder || 'DESC');
      
      // Pagination
      if (options.limit && options.page) {
        const offset = (options.page - 1) * options.limit;
        query += ' LIMIT ? OFFSET ?';
        params.push(parseInt(options.limit), parseInt(offset));
      }
      
      const [articles] = await pool.query(query, params);
      
      return articles;
    } catch (error) {
      throw error;
    }
  }
  
  // Count total articles (for pagination)
  static async countTotal(options = {}) {
    try {
      let query = 'SELECT COUNT(*) as total FROM articles a';
      const params = [];
      
      // Filter by status
      if (options.status) {
        query += ' WHERE a.status = ?';
        params.push(options.status);
      }
      
      // Filter by category
      if (options.categoryId) {
        query += options.status ? ' AND a.category_id = ?' : ' WHERE a.category_id = ?';
        params.push(options.categoryId);
      }
      
      // Search by title
      if (options.search) {
        const searchTerm = `%${options.search}%`;
        query += options.status || options.categoryId 
          ? ' AND (a.title LIKE ? OR a.content LIKE ?)' 
          : ' WHERE (a.title LIKE ? OR a.content LIKE ?)';
        params.push(searchTerm, searchTerm);
      }
      
      const [result] = await pool.query(query, params);
      return result[0].total;
    } catch (error) {
      throw error;
    }
  }
  
  // Get article by ID
  static async getById(id) {
    try {
      const [articles] = await pool.query(
        `SELECT a.*, ac.name as category_name, ac.slug as category_slug, u.full_name as author_name
        FROM articles a
        JOIN article_categories ac ON a.category_id = ac.id
        JOIN users u ON a.created_by = u.id
        WHERE a.id = ?`,
        [id]
      );
      
      return articles.length > 0 ? articles[0] : null;
    } catch (error) {
      throw error;
    }
  }
  
  // Get article by slug
  static async getBySlug(slug) {
    try {
      const [articles] = await pool.query(
        `SELECT a.*, ac.name as category_name, ac.slug as category_slug, u.full_name as author_name
        FROM articles a
        JOIN article_categories ac ON a.category_id = ac.id
        JOIN users u ON a.created_by = u.id
        WHERE a.slug = ?`,
        [slug]
      );
      
      return articles.length > 0 ? articles[0] : null;
    } catch (error) {
      throw error;
    }
  }
  
  // Create new article
  static async create(data, file) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const { 
        title, 
        content, 
        excerpt, 
        category_id, 
        status, 
        created_by 
      } = data;
      
      // Generate slug from title
      let slug = slugify(title);
      
      // Check if slug already exists and make unique if needed
      let slugExists = true;
      let counter = 0;
      let uniqueSlug = slug;
      
      while (slugExists) {
        const [articles] = await connection.query(
          'SELECT id FROM articles WHERE slug = ? LIMIT 1',
          [uniqueSlug]
        );
        
        if (articles.length === 0) {
          slugExists = false;
        } else {
          counter += 1;
          uniqueSlug = `${slug}-${counter}`;
        }
      }
      
      slug = uniqueSlug;
      
      let featured_image = null;
      
      // Handle file upload if provided
      if (file) {
        // Generate unique filename
        const fileExt = path.extname(file.originalname);
        const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExt}`;
        const uploadPath = path.join(__dirname, '../uploads/articles', fileName);
        
        // Ensure directory exists
        const dir = path.dirname(uploadPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        // Save file
        fs.writeFileSync(uploadPath, file.buffer);
        featured_image = `/uploads/articles/${fileName}`;
      }
      
      // Set published_at timestamp for published articles
      const published_at = status === 'published' ? new Date() : null;
      
      // Insert into database
      const [result] = await connection.query(
        `INSERT INTO articles 
        (title, slug, content, excerpt, category_id, featured_image, status, created_by, published_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [title, slug, content, excerpt, category_id, featured_image, status, created_by, published_at]
      );
      
      const articleId = result.insertId;
      
      // Get the newly created article
      const [articles] = await connection.query(
        `SELECT a.*, ac.name as category_name, u.full_name as author_name
        FROM articles a
        JOIN article_categories ac ON a.category_id = ac.id
        JOIN users u ON a.created_by = u.id
        WHERE a.id = ?`,
        [articleId]
      );
      
      await connection.commit();
      
      return articles[0];
    } catch (error) {
      await connection.rollback();
      
      // Delete uploaded file if there was an error and the file was uploaded
      if (data.featured_image) {
        const filePath = path.join(__dirname, '..', data.featured_image);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      
      throw error;
    } finally {
      connection.release();
    }
  }
  
  // Update article
  static async update(id, data, file) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Get current article data
      const [currentArticles] = await connection.query('SELECT * FROM articles WHERE id = ?', [id]);
      
      if (currentArticles.length === 0) {
        throw new Error('Artikel tidak ditemukan');
      }
      
      const currentArticle = currentArticles[0];
      
      const { 
        title, 
        content, 
        excerpt, 
        category_id, 
        status
      } = data;
      
      let slug = currentArticle.slug;
      
      // If title changed, generate new slug
      if (title && title !== currentArticle.title) {
        slug = slugify(title);
        
        // Check if slug already exists and make unique if needed
        let slugExists = true;
        let counter = 0;
        let uniqueSlug = slug;
        
        while (slugExists) {
          const [articles] = await connection.query(
            'SELECT id FROM articles WHERE slug = ? AND id != ? LIMIT 1',
            [uniqueSlug, id]
          );
          
          if (articles.length === 0) {
            slugExists = false;
          } else {
            counter += 1;
            uniqueSlug = `${slug}-${counter}`;
          }
        }
        
        slug = uniqueSlug;
      }
      
      let featured_image = currentArticle.featured_image;
      
      // Handle file upload if provided
      if (file) {
        // Delete old image if exists
        if (currentArticle.featured_image) {
          const oldFilePath = path.join(__dirname, '..', currentArticle.featured_image);
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
          }
        }
        
        // Generate unique filename
        const fileExt = path.extname(file.originalname);
        const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExt}`;
        const uploadPath = path.join(__dirname, '../uploads/articles', fileName);
        
        // Ensure directory exists
        const dir = path.dirname(uploadPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        // Save file
        fs.writeFileSync(uploadPath, file.buffer);
        featured_image = `/uploads/articles/${fileName}`;
      }
      
      // Determine if published_at should be updated
      let published_at = currentArticle.published_at;
      if (status === 'published' && currentArticle.status !== 'published') {
        published_at = new Date();
      }
      
      // Update article in database
      await connection.query(
        `UPDATE articles 
        SET title = ?, slug = ?, content = ?, excerpt = ?, category_id = ?, 
        featured_image = ?, status = ?, published_at = ?
        WHERE id = ?`,
        [
          title || currentArticle.title, 
          slug, 
          content || currentArticle.content, 
          excerpt || currentArticle.excerpt, 
          category_id || currentArticle.category_id, 
          featured_image, 
          status || currentArticle.status, 
          published_at,
          id
        ]
      );
      
      // Get the updated article
      const [updatedArticles] = await connection.query(
        `SELECT a.*, ac.name as category_name, u.full_name as author_name
        FROM articles a
        JOIN article_categories ac ON a.category_id = ac.id
        JOIN users u ON a.created_by = u.id
        WHERE a.id = ?`,
        [id]
      );
      
      await connection.commit();
      
      return updatedArticles[0];
    } catch (error) {
      await connection.rollback();
      
      // Delete uploaded file if there was an error and a new file was uploaded
      if (file && data.featured_image && data.featured_image !== currentArticle.featured_image) {
        const filePath = path.join(__dirname, '..', data.featured_image);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      
      throw error;
    } finally {
      connection.release();
    }
  }
  
  // Delete article
  static async delete(id) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Get article data for image deletion
      const [articles] = await connection.query('SELECT * FROM articles WHERE id = ?', [id]);
      
      if (articles.length === 0) {
        throw new Error('Artikel tidak ditemukan');
      }
      
      const article = articles[0];
      
      // Delete article from database
      const [result] = await connection.query('DELETE FROM articles WHERE id = ?', [id]);
      
      // Delete featured image if exists
      if (result.affectedRows > 0 && article.featured_image) {
        const filePath = path.join(__dirname, '..', article.featured_image);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      
      await connection.commit();
      
      return result.affectedRows > 0;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
  
  // Get latest published articles
  static async getLatest(limit = 5) {
    try {
      const [articles] = await pool.query(
        `SELECT a.id, a.title, a.slug, a.excerpt, a.featured_image, a.published_at,
        ac.name as category_name, ac.slug as category_slug, u.full_name as author_name
        FROM articles a
        JOIN article_categories ac ON a.category_id = ac.id
        JOIN users u ON a.created_by = u.id
        WHERE a.status = 'published'
        ORDER BY a.published_at DESC
        LIMIT ?`,
        [limit]
      );
      
      return articles;
    } catch (error) {
      throw error;
    }
  }
  
  // Get articles by category
  static async getByCategory(categoryId, options = {}) {
    try {
      let query = `
        SELECT a.id, a.title, a.slug, a.excerpt, a.featured_image, a.published_at,
        ac.name as category_name, ac.slug as category_slug, u.full_name as author_name
        FROM articles a
        JOIN article_categories ac ON a.category_id = ac.id
        JOIN users u ON a.created_by = u.id
        WHERE a.category_id = ? AND a.status = 'published'
        ORDER BY a.published_at DESC
      `;
      
      const params = [categoryId];
      
      // Pagination
      if (options.limit && options.page) {
        const offset = (options.page - 1) * options.limit;
        query += ' LIMIT ? OFFSET ?';
        params.push(parseInt(options.limit), parseInt(offset));
      }
      
      const [articles] = await pool.query(query, params);
      
      return articles;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Article;