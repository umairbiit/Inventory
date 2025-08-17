//import modules
const express = require("express");
const mongoose = require("mongoose");
const morgan = require("morgan");
const cors = require("cors");
const bodyparser = require("body-parser");
const cookieParser = require("cookie-parser");
const errorHandler = require("./middlewares/errorMiddleware");
require("dotenv").config();
//app
const app = express();
app.use(bodyparser.json());
app.use(express.urlencoded({ extended: false }));

//db
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("DB CONNECTED"))
  .catch((err) => console.log("DB CONNECTECTION ERROR", err));

//middleware
app.use(cookieParser());
app.use(morgan("dev"));
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));

// routes
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes"); // ✅ added
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes); // ✅ added

//port
const port = process.env.PORT || 8008;

app.use(errorHandler);

//listener
const server = app.listen(port, () =>
  console.log(`Server is running on port ${port}`)
);
