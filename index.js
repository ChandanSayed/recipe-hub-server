const express = require("express");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const cors = require("cors");
require("dotenv").config();

app.use(cors());
app.use(express.json());

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const port = process.env.PORT || 5000;

const uri = process.env.URI;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const recipesCollection = client.db().collection("recipes");
    const usersCollection = client.db().collection("users");
    app.get("/", (req, res) => {
      res.send("Welcome to the home route!");
    });

    function userMustLogin(req, res, next) {
      try {
        jwt.verify(req.body.token, process.env.JWTSECRET);
        next();
      } catch (error) {
        console.log("Use must be logged in!");
        return res.status(401).send({ message: "Unauthorized" });
      }
    }

    //User Routes
    app.post("/login", async (req, res) => {
      try {
        const response = await usersCollection.findOne({ email: req.body.email });
        console.log(response);

        if (!response) {
          const response = await usersCollection.insertOne(req.body);
          // res.send({ ...req.body });
          const token = jwt.sign({ _id: response.insertedId }, process.env.JWTSECRET, {
            expiresIn: "1d"
          });
          res.json({ user: req.body, token: token });
        } else {
          // res.send(response);
          const token = jwt.sign({ _id: response._id }, process.env.JWTSECRET, {
            expiresIn: "1d"
          });
          res.json({ user: response, token: token });
        }
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Internal server error" });
      }
    });

    app.get("/user", async (req, res) => {
      const { email } = req.query;
      try {
        const response = await usersCollection.findOne({ email: email });
        res.send(response);
      } catch (error) {
        console.log(error);
        res.status(500).send({ message: "Internal server error" });
      }
    });

    app.put("/update-user/:email", userMustLogin, async (req, res) => {
      try {
        console.log(req.params.email, req.body);
        const email = req.params.email;
        const user = await usersCollection.findOne({ email: email });

        if (!user) {
          return res.status(404).send({ message: "User not found" });
        }

        const newCoinBalance = (user.coin || 0) + req.body.coin * 1;

        const response = await usersCollection.findOneAndUpdate(
          { email: email },
          { $set: { coin: newCoinBalance } },
          { returnOriginal: false }
        );

        res.send({ ...response, coin: newCoinBalance });
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Internal server error" });
      }
    });

    // Recipe Routes

    app.post("/add-recipe", async (req, res) => {
      try {
        const response = await recipesCollection.insertOne(req.body);
        res.send(response);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Internal server error" });
      }
    });

    // app.get("/all-recipes", async (req, res) => {
    //   try {
    //     const response = await recipesCollection.find().toArray();
    //     res.send(response);
    //   } catch (error) {
    //     console.log(error);
    //     res.status(500).send({ message: "Internal server error" });
    //   }
    // });

    app.get("/all-recipes", async (req, res) => {
      try {
        const page = parseInt(req.query.page, 10) || 0;
        const limit = parseInt(req.query.limit, 10) || 8;
        if (page < 0 || limit <= 0) {
          return res.status(400).json({ error: "Page and limit must be positive numbers" });
        }
        const skip = page * limit;
        const response = await recipesCollection.find().skip(skip).limit(limit).toArray();
        res.send(response);
      } catch (err) {
        console.error("Failed to fetch recipes:", err); // Log the error for debugging
        res.status(500).json({ error: "Failed to fetch recipes" });
      }
    });

    app.get("/recipe/:id", async (req, res) => {
      try {
        const response = await recipesCollection.findOne({ _id: new ObjectId(req.params.id) });
        res.send(response);
      } catch (error) {
        console.log(error);
        res.status(500).send({ message: "Internal server error" });
      }
    });

    app.put("/update-recipe/:id", userMustLogin, async (req, res) => {
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
    });

    // Stripe Payment
    const calculateOrderAmount = price => {
      // Replace this constant with a calculation of the order's amount
      // Calculate the order total on the server to prevent
      // people from directly manipulating the amount on the client
      const finalPrice = price * 100;
      return finalPrice;
    };

    app.post("/create-payment-intent", async (req, res) => {
      const { price } = req.body;

      // Create a PaymentIntent with the order amount and currency
      const paymentIntent = await stripe.paymentIntents.create({
        amount: calculateOrderAmount(price),
        currency: "usd",
        // In the latest version of the API, specifying the `automatic_payment_methods` parameter is optional because Stripe enables its functionality by default.
        automatic_payment_methods: {
          enabled: true
        }
      });

      res.send({
        clientSecret: paymentIntent.client_secret
      });
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
