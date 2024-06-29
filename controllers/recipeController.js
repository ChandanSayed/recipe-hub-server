const { ObjectId } = require("mongodb");
const recipesCollection = require("../").db().collection("recipes");

exports.addRecipe = async function (req, res) {
  try {
    const response = await recipesCollection.insertOne(req.body);
    res.send(response);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Internal server error" });
  }
};

exports.getRecipes = async function (req, res) {
  try {
    const page = parseInt(req.query.page, 10) || 0;
    const limit = parseInt(req.query.limit, 10) || 8;
    const searchText = req.query.search || "";

    console.log(req.query);

    if (page < 0 || limit <= 0) {
      return res.status(400).json({ error: "Page and limit must be positive numbers" });
    }

    const skip = page * limit;
    let query = {};

    if (searchText.trim() !== "") {
      query = {
        recipeName: { $regex: searchText, $options: "i" }
      };
    }

    const response = await recipesCollection.find(query).skip(skip).limit(limit).toArray();
    res.send(response);
    console.log(response);
  } catch (err) {
    console.error("Failed to fetch recipes:", err); // Log the error for debugging
    res.status(500).json({ error: "Failed to fetch recipes" });
  }
};

exports.recipeDetails = async function (req, res) {
  try {
    const response = await recipesCollection.findOne({ _id: new ObjectId(req.params.id) });
    res.send(response);
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal server error" });
  }
};

exports.updateRecipe = async function (req, res) {
  try {
    const recipeId = req.params.id;
    const recipe = await recipesCollection.findOne({ _id: new ObjectId(recipeId) });

    if (!recipe) {
      return res.status(404).send({ message: "Recipe not found" });
    }

    const newPurchasedBy = [...recipe.purchased_by, req.body.purchased_by];
    const newWatchCount = recipe.watchCount + 1;

    const response = await recipesCollection.findOneAndUpdate(
      { _id: new ObjectId(recipeId) },
      { $set: { purchased_by: newPurchasedBy, watchCount: newWatchCount } },
      { returnOriginal: false }
    );

    res.send({ ...response, purchased_by: newPurchasedBy, watchCount: newWatchCount });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Internal server error" });
  }
};

// Stripe Payment
const calculateOrderAmount = price => {
  // Replace this constant with a calculation of the order's amount
  // Calculate the order total on the server to prevent
  // people from directly manipulating the amount on the client
  const finalPrice = price * 100;
  return finalPrice;
};
