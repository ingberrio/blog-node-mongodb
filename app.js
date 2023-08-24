//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const config = require('./config');
require('dotenv').config();
const { MONGODB_URL, LOCAL_DB } = process.env
var _ = require('lodash');
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');


const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.use(session({
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());


// Define the item schema for the MongoDB model
const postSchema = {
  title: String,
  content: String,
  date: Date,
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // Reference to User model
};

const userSchema = new mongoose.Schema ({
  email: String,
  password: String,
  googleId: String,
  secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

// Create an "Item" model based on the itemSchema
const Post = mongoose.model("post", postSchema);
const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(async function(id, done) {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/blog",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

//Mongoose use enviroment variables to connect create a .env
mongoose.connect(MONGODB_URL)
.then(() => {
  console.log("Connected to MongoDB");

  // Start the Express server
  app.listen(3000, function() {
    console.log("Server started on port 3000");
    });
  })
  .catch((error) => {
    console.error('Error to connect MongoDB:', error);
  });

  app.get("/", async function(req, res){
    try {
      const itemsFound = await Post.find({});
      res.render("home", { posts: itemsFound, isAuthenticated: req.isAuthenticated() });
    } catch (error) {
      console.error("Error fetching items:", error);
      res.status(500).send("Internal Server Error");
    }
  });

  app.get("/auth/google",
    passport.authenticate('google', { scope: ["profile"] })
  );

  app.get("/auth/google/blog",
    passport.authenticate('google', { failureRedirect: "/login" }),
    function(req, res) {
      // Successful authentication, redirect to compose.
      res.redirect("/compose");
    });

  app.get("/login", function(req, res){
    res.render("login", { isAuthenticated: req.isAuthenticated() });
  });

  app.get('/logout', function(req, res) {
    req.logout(function() {
      res.redirect('/');
    });
  });

  app.get("/register", function(req, res){
    res.render("register");
  });

  app.get('/compose', async function(req, res) {
    try {
      // Check if the user is authenticated
      if (req.isAuthenticated()) {
        const foundUsers = await User.find({ "googleId": { $ne: null } }).exec();
        res.render('compose', { usersWithSecrets: foundUsers, isAuthenticated: req.isAuthenticated() });
      } else {
        // If not authenticated, redirect to the login page
        res.redirect('/login');
      }
    } catch (error) {
      console.error('Error fetching items:', error);
      res.status(500).send('Internal Server Error');
    }
  });
  
  app.post("/compose", async function(req, res){
      const foundUsers = await User.find({ "googleId": { $ne: null } }).exec();  
      foundUsers.forEach(element => {
        userId = element.id
      });
      const titleItem = _.capitalize(req.body.postTitle);
      let contentItem = req.body.postBody;
      const dateItem = Date.now();
    try {
      // Create a new post and associate it with the authenticated user
      await Post.create({
        title: titleItem, 
        content: contentItem, 
        date: dateItem,
        author: req.user._id 
      });
      console.log("New post created")
      res.redirect("/");
    }
    catch (error) {
      console.error("Error saving item:", error);
      res.status(500).send("Internal Server Error");
    }
  });

  app.get("/posts/:postName", async function(req, res) {
      try {
          const requestedTitle = _.capitalize(req.params.postName);
          const post = await Post.findOne({ title: requestedTitle });
  
          if (!post) {
              return res.status(404).send("Post not found");
          }
  
          console.log(post);
          res.render("post", { titlePost: post.title, content: post.content });
      } catch (error) {
          console.error("Error showing post:", error);
          res.status(500).send("Internal Server Error");
      }
  });
  

