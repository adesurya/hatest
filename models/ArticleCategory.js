const { pool } = require('../config/database');
const slugify = require('../utils/helpers').slugify;

class ArticleCategory {
  // Get all article categories
  static async getAll() {
    try {
      const [categories] = await pool.query('SELECT * FROM article_categories ORDER BY name ASC');
      return categories;
    } catch (error) {
      throw error;
    }
  }
  
  // Get category by ID
  static async getById(id) {
    try {
      const [categories] = await pool.query('SELECT * FROM article_categories WHERE id = ?', [id]);
      return categories.length > 0 ? categories[0] : null;
    } catch (error) {
      throw error;
    }
  }

  // Get category by slug
  static async getBySlug(slug) {
    try {
      const [categories] = await pool.query('SELECT * FROM article_categories WHERE slug = ?', [slug]);
      return categories.length > 0 ? categories[0] : null;
    } catch (error) {
      throw error;
    }
  }
  
  // Create new category
  static async create(data) {
    try {
      const { name, description } = data;
      const slug = slugify(name);
      
      // Check if slug already exists
      const existingCategory = await this.getBySlug(slug);
      if (existingCategory) {
        throw new Error('Kategori dengan nama serupa sudah ada');
      }
      
      const [result] = await pool.query(
        'INSERT INTO article_categories (name, slug, description) VALUES (?, ?, ?)',
        [name, slug, description]
      );
      
      return {
        id: result.insertId,
        name,
        slug,
        description
      };
    } catch (error) {
      throw error;
    }
  }
  
  // Update category
  static async update(id, data) {
    try {
      const { name, description } = data;
      const slug = slugify(name);
      
      // Check if slug already exists and is not the current category
      const [existingCategories] = await pool.query(
        'SELECT * FROM article_categories WHERE slug = ? AND id != ?',
        [slug, id]
      );
      
      if (existingCategories.length > 0) {
        throw new Error('Kategori dengan nama serupa sudah ada');
      }
      
      const [result] = await pool.query(
        'UPDATE article_categories SET name = ?, slug = ?, description = ? WHERE id = ?',
        [name, slug, description, id]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }
  
  // Delete category
  static async delete(id) {
    try {
      // Check if category has articles associated with it
      const [articles] = await pool.query(
        'SELECT id FROM articles WHERE category_id = ? LIMIT 1',
        [id]
      );
      
      if (articles.length > 0) {
        throw new Error('Kategori tidak dapat dihapus karena memiliki artikel terkait');
      }
      
      const [result] = await pool.query('DELETE FROM article_categories WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = ArticleCategory;