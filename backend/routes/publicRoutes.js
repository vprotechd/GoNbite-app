import express from 'express';
import Restaurant from '../models/Restaurant.js';
import FoodItem from '../models/FoodItem.js';

const router = express.Router();

// GET: Fetch all Verified Restaurants with their menu items
router.get('/restaurants', async (req, res) => {
  try {
    // 1. Find all restaurants that are verified AND available
    const restaurants = await Restaurant.find({ 
      isVerified: true, 
      isAvailable: true 
    }).select('-password'); // Don't send password

    // 2. For each restaurant, fetch their food items
    const restaurantsWithFood = await Promise.all(
      restaurants.map(async (restaurant) => {
        const foodItems = await FoodItem.find({ 
          restaurantId: restaurant._id,
          isAvailable: true 
        });
        return {
          ...restaurant._doc,
          foodItems: foodItems
        };
      })
    );

    res.json(restaurantsWithFood);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;