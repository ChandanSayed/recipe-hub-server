const express = require("express");

const app = express();
const cors = require("cors");

app.use(cors());
app.use(express.json());

const router = require("./router");

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

app.use("/", router);

module.exports = app;
