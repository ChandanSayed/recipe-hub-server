const express = require("express");
require("dotenv").config();
const router = express.Router();

function userMustLogin(req, res, next) {
  try {
    jwt.verify(req.body.token, process.env.JWTSECRET);
    next();
  } catch (error) {
    console.log("Use must be logged in!");
    return res.status(401).send({ message: "Unauthorized" });
  }
}

const userController = require("./controllers/userController");
const recipeController = require("./controllers/recipeController");
const paymentController = require("./controllers/paymentController");

// user routes
router.get("/", userController.home);
router.post("/login", userController.login);
router.get("/user", userController.user);
router.put("/update-user/:email", userMustLogin, userController.updateUser);

// recipe routes
router.post("/add-recipe", userMustLogin, recipeController.addRecipe);
router.get("/all-recipes", recipeController.getRecipes);
router.get("/recipe/:id", userMustLogin, recipeController.recipeDetails);
router.put("/update-recipe/:id", userMustLogin, recipeController.updateRecipe);

//payment routes
router.post("/create-payment-intent", paymentController.payment);

module.exports = router;
