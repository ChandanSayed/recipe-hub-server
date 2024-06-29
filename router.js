const express = require("express");
require("dotenv").config();
const router = express.Router();
const jwt = require("jsonwebtoken");

const userController = require("./controllers/userController");
const recipeController = require("./controllers/recipeController");
const paymentController = require("./controllers/paymentController");

function userMustLogin(req, res, next) {
  try {
    const apiToken = jwt.verify(req.body.token, process.env.JWTSECRET);
    console.log(apiToken);
    next();
  } catch (error) {
    console.log("Use must be logged in!");
    return res.status(401).send({ message: "Unauthorized" });
  }
}

// user routes
router.get("/", userController.home);
router.post("/login", userController.login);
router.get("/user", userController.user);
router.put("/update-user/:email", userMustLogin, userController.updateUser);

// recipe routes
router.post("/add-recipe", userMustLogin, recipeController.addRecipe);
router.get("/all-recipes", recipeController.getRecipes);
router.get("/recipe/:id", recipeController.recipeDetails);
router.put("/update-recipe/:id", userMustLogin, recipeController.updateRecipe);

//payment routes
router.post("/create-payment-intent", paymentController.payment);

module.exports = router;
