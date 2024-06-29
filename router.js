const express = require("express");

const router = express.Router();

const userController = require("./controllers/userController");
const recipeController = require("./controllers/recipeController");
const paymentController = require("./controllers/paymentController");

// user routes
router.get("/", userController.home);
router.post("/login", userController.login);
router.get("/user", userController.user);

// recipe routes
router.post("/add-recipe", recipeController.addRecipe);
router.get("/all-recipes", recipeController.getRecipes);
router.get("/recipe/:id", recipeController.recipeDetails);
router.put("/update-recipe/:id", recipeController.updateRecipe);

//payment routes
router.post("/create-payment-intent", paymentController.payment);

module.exports = router;

// const express = require('express');

module.exports = router;
