import { GoogleGenAI } from "@google/genai";
import FoodItem from "../models/FoodItem.js";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export const identifyFood = async (req, res) => {
  try {
    // 1. Check image
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Food image is required.",
      });
    }

    console.log("📸 Food image received:", req.file.originalname);

    // 2. Convert image to base64
    const base64Image = req.file.buffer.toString("base64");

    console.log("🤖 Sending image to Gemini...");

    // 3. Ask Gemini to identify the food
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: [
        {
          inlineData: {
            mimeType: req.file.mimetype,
            data: base64Image,
          },
        },
        {
          text: `
You are a food identification system for a food delivery application.

Look at the provided food image and identify the most likely food.

Return ONLY valid JSON in this exact format:

{
  "foodName": "Chicken Biryani",
  "category": "Biryani",
  "confidence": 0.95,
  "keywords": ["chicken", "biryani", "rice"],
  "possibleFoods": [
    "Chicken Biryani",
    "Chicken Dum Biryani",
    "Hyderabadi Chicken Biryani"
  ]
}

Rules:
- foodName should be the most likely common food name.
- category should be a broad food category.
- confidence must be a number between 0 and 1.
- keywords should contain useful food-related search terms.
- possibleFoods should contain up to 5 likely food names.
- Do not include markdown.
- Do not include explanations outside the JSON.
- If the image is not food, use:
  "foodName": "Unknown",
  "category": "Unknown",
  "confidence": 0
`,
        },
      ],
    });

    // 4. Get Gemini response
    let aiText = response.text?.trim();

    console.log("🤖 Gemini response:", aiText);

    if (!aiText) {
      return res.status(500).json({
        success: false,
        message: "AI returned an empty response.",
      });
    }

    // Remove markdown fences if Gemini adds them
    aiText = aiText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    // 5. Parse Gemini JSON
    let detectedFood;

    try {
      detectedFood = JSON.parse(aiText);
    } catch (parseError) {
      console.error("❌ Could not parse Gemini JSON:", aiText);

      return res.status(500).json({
        success: false,
        message: "AI returned an invalid response.",
      });
    }

    console.log("✅ Food detected:", detectedFood.foodName);
    console.log("📂 Category:", detectedFood.category);

    // 6. If food is unknown
    if (
      !detectedFood.foodName ||
      detectedFood.foodName.toLowerCase() === "unknown"
    ) {
      console.log("⚠️ Food could not be identified.");

      return res.status(200).json({
        success: true,
        detectedFood,
        count: 0,
        foods: [],
        message: "Could not identify a specific food.",
      });
    }

    // 7. Build search terms
    const searchTerms = [
      detectedFood.foodName,
      detectedFood.category,
      ...(detectedFood.possibleFoods || []),
      ...(detectedFood.keywords || []),
    ].filter(Boolean);

    console.log("🔎 Search terms:", searchTerms);

    // Escape regex characters
    const searchRegex = searchTerms.map(
      (term) =>
        new RegExp(
          term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
          "i"
        )
    );

    // 8. Search MongoDB
    console.log("🔎 Searching FoodItem collection...");

    const foods = await FoodItem.find({
      isAvailable: true,
      $or: [
        { name: { $in: searchRegex } },
        { category: { $in: searchRegex } },
        { description: { $in: searchRegex } },
      ],
    }).lean();

    console.log(
      "✅ MongoDB search completed. Foods found:",
      foods.length
    );

    // 9. Send result back to frontend
    const result = {
      success: true,

      detectedFood: {
        foodName: detectedFood.foodName,
        category: detectedFood.category,
        confidence: detectedFood.confidence,
        keywords: detectedFood.keywords || [],
        possibleFoods: detectedFood.possibleFoods || [],
      },

      count: foods.length,

      foods,
    };

    console.log("📤 Sending food scan response to frontend:");
    console.log(JSON.stringify(result, null, 2));

    return res.status(200).json(result);
  } catch (error) {
    console.error("❌ Food scan error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to identify food.",
      error: error.message,
    });
  }
};