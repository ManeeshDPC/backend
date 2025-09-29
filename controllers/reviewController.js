import pool from '../config/db/mysql.js';

// Add a new review
export async function addReview(req, res) {
  const { companyId, userId, rating, reviewText } = req.body;

  if (!userId) {
    return res.status(401).json({ error: 'User must be logged in to add review' });
  }

  if (!companyId || !rating || !reviewText) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Insert review
    await pool.execute(
      'INSERT INTO reviews (company_id, user_id, rating, review_text) VALUES (?, ?, ?, ?)',
      [companyId, userId, rating, reviewText]
    );

    // Update company aggregated data: average rating and review_count
    const [result] = await pool.execute(
      `SELECT AVG(rating) AS avgRating, COUNT(*) AS totalReviews FROM reviews WHERE company_id = ?`,
      [companyId]
    );
    
    // Handle null avgRating (when no reviews exist)
    const avgRating = result[0].avgRating ? parseFloat(result[0].avgRating).toFixed(2) : 0;
    const totalReviews = result[0].totalReviews;

    await pool.execute(
      'UPDATE companies SET rating = ?, review_count = ? WHERE id = ?',
      [avgRating, totalReviews, companyId]
    );

    res.status(201).json({ message: 'Review added successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error adding review' });
  }
}

// Get all reviews for a company with user info
export async function getReviewsByCompany(req, res) {
  const companyId = req.params.companyId;

  if (!companyId) {
    return res.status(400).json({ error: 'Company ID is required' });
  }

  try {
    const [reviews] = await pool.execute(
      `SELECT r.id, r.rating, r.review_text, r.created_at, u.full_name, u.profile_picture
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.company_id = ?
       ORDER BY r.created_at DESC`,
      [companyId]
    );
    res.json(reviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching reviews' });
  }
}

// Get all reviews by a specific user
export async function getReviewsByUser(req, res) {
  const userId = req.params.userId;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    const [reviews] = await pool.execute(
      `SELECT r.id, r.rating, r.review_text, r.created_at, c.title as company_name, c.id as company_id
       FROM reviews r
       JOIN companies c ON r.company_id = c.id
       WHERE r.user_id = ?
       ORDER BY r.created_at DESC`,
      [userId]
    );
    res.json(reviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching user reviews' });
  }
}
// Delete a review
export async function deleteReview(req, res) {
  const reviewId = req.params.reviewId;
  const { userId } = req.body;

  if (!reviewId) {
    return res.status(400).json({ error: 'Review ID is required' });
  }

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    // Check if the review exists and belongs to the user
    const [reviewCheck] = await pool.execute(
      'SELECT user_id, company_id FROM reviews WHERE id = ?',
      [reviewId]
    );

    if (reviewCheck.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Check if the review belongs to the user
    if (reviewCheck[0].user_id !== userId) {
      return res.status(403).json({ error: 'You can only delete your own reviews' });
    }

    const companyId = reviewCheck[0].company_id;

    // Delete the review
    await pool.execute('DELETE FROM reviews WHERE id = ?', [reviewId]);

    // Update company rating and review count
    const [result] = await pool.execute(
      `SELECT AVG(rating) AS avgRating, COUNT(*) AS totalReviews FROM reviews WHERE company_id = ?`,
      [companyId]
    );
    
    const avgRating = result[0].avgRating ? parseFloat(result[0].avgRating).toFixed(2) : 0;
    const totalReviews = result[0].totalReviews;

    await pool.execute(
      'UPDATE companies SET rating = ?, review_count = ? WHERE id = ?',
      [avgRating, totalReviews, companyId]
    );

    res.json({ message: 'Review deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error deleting review' });
  }
}
