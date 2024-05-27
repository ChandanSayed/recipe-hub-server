const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const cors = require("cors");
require("dotenv").config();

app.use(cors());
app.use(express.json());

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

    app.post("/login", async (req, res) => {
      try {
        // Find user by email
        const response = await usersCollection.findOne({ email: req.body.email });
        console.log(response);

        if (!response) {
          const response = await usersCollection.insertOne(req.body);
          res.send({ ...req.body });
        } else {
          res.send(response);
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

    app.put("/update-user/:email", async (req, res) => {
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

    app.get("/all-recipes", async (req, res) => {
      try {
        const response = await recipesCollection.find().toArray();
        res.send(response);
      } catch (error) {
        console.log(error);
        res.status(500).send({ message: "Internal server error" });
      }
    });

    app.post("/add-recipe", async (req, res) => {
      try {
        const response = await recipesCollection.insertOne(req.body);
        res.send(response);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Internal server error" });
      }
    });

    app.put("/update-recipe/:id", async (req, res) => {
      try {
        const recipeId = req.params.id;
        const recipe = await recipesCollection.findOne({ _id: new ObjectId(recipeId) });

        if (!recipe) {
          return res.status(404).send({ message: "Recipe not found" });
        }

        const newPurchasedBy = [...recipe.purchased_by, req.body.purchased_by];

        const response = await recipesCollection.findOneAndUpdate(
          { _id: new ObjectId(recipeId) },
          { $set: { purchased_by: newPurchasedBy } },
          { returnOriginal: false }
        );

        res.send({ ...response, purchased_by: newPurchasedBy });
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Internal server error" });
      }
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
