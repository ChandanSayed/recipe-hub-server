require("dotenv").config();
const jwt = require("jsonwebtoken");
const usersCollection = require("../db").db().collection("users");

exports.home = function (req, res) {
  console.log("Hello");
  res.send("Welcome to the home route from router!");
};

exports.login = async (req, res) => {
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
};

exports.user = async function (req, res) {
  const { email } = req.query;
  try {
    const response = await usersCollection.findOne({ email: email });
    return res.send(response);
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal server error" });
  }
};

exports.updateUser = async (req, res) => {
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
};

// const recipesCollection = client.db().collection("recipes");
//     const usersCollection = client.db().collection("users");

//     router.get("/", (req, res) => {
//       console.log("Hello");
//       res.send("Welcome to the home route from router!");
//     });

//     function userMustLogin(req, res, next) {
//       try {
//         jwt.verify(req.body.token, process.env.JWTSECRET);
//         next();
//       } catch (error) {
//         console.log("Use must be logged in!");
//         return res.status(401).send({ message: "Unauthorized" });
//       }
//     }

//     app.post("/login", async (req, res) => {
//       try {
//         const response = await usersCollection.findOne({ email: req.body.email });
//         console.log(response);

//         if (!response) {
//           const response = await usersCollection.insertOne(req.body);

//           const token = jwt.sign({ _id: response.insertedId }, process.env.JWTSECRET, {
//             expiresIn: "1d"
//           });
//           res.json({ user: req.body, token: token });
//         } else {
//           const token = jwt.sign({ _id: response._id }, process.env.JWTSECRET, {
//             expiresIn: "1d"
//           });
//           res.json({ user: response, token: token });
//         }
//       } catch (error) {
//         console.error(error);
//         res.status(500).send({ message: "Internal server error" });
//       }
//     });

//     router.get("/user", userController.user);

//     app.put("/update-user/:email", userMustLogin, async (req, res) => {
//       try {
//         console.log(req.params.email, req.body);
//         const email = req.params.email;
//         const user = await usersCollection.findOne({ email: email });

//         if (!user) {
//           return res.status(404).send({ message: "User not found" });
//         }

//         const newCoinBalance = (user.coin || 0) + req.body.coin * 1;

//         const response = await usersCollection.findOneAndUpdate(
//           { email: email },
//           { $set: { coin: newCoinBalance } },
//           { returnOriginal: false }
//         );

//         res.send({ ...response, coin: newCoinBalance });
//       } catch (error) {
//         console.error(error);
//         res.status(500).send({ message: "Internal server error" });
//       }
//     });
