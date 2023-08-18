//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const config = require('./config');
require('dotenv').config();
const { MONGODB_URL, LOCAL_DB } = process.env
var _ = require('lodash');


const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// Define the item schema for the MongoDB model
const postSchema = {
  title: String,
  content: String,
  date: Date
};
// Create an "Item" model based on the itemSchema
const Post = mongoose.model("post", postSchema);
const item1 = new Post({
  name: "edu"
})
const item2 = new Post({
  name: "ber"
})
let posts = [item1, item2];

//Mongoose use enviroment variables to connect create a .env
mongoose.connect( LOCAL_DB, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
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
      res.render("home", { posts: itemsFound });
    } catch (error) {
      console.error("Error fetching items:", error);
      res.status(500).send("Internal Server Error");
    }
    
    
  });

  app.get("/about", function(req, res){
    res.render("about", {aboutContent: aboutContent});
  });

  app.get("/contact", function(req, res){
    res.render("contact", {contactContent: contactContent});
  });

  app.get("/compose", async function(req, res){
    try {
      // Fetch all items from the database
      const itemsFound = await Post.find({});
      console.log(posts);
      res.render("compose", { listTitle: "Compose", newListItems: itemsFound });
      
    } catch (error) {
      console.error("Error fetching items:", error);
      res.status(500).send("Internal Server Error");
    }
  });

  app.post("/compose", async function(req, res){
    try {
      const titleItem = req.body.postTitle;
      const contentItem = req.body.postBody;
      const dateItem = Date.now();

      await Post.create({
        title: titleItem, 
        content: contentItem, 
        date: dateItem 
      });
      console.log("New post created")
      res.redirect("/");
    }
    catch (error) {
      console.error("Error saving item:", error);
      res.status(500).send("Internal Server Error");
    }
  });

  app.get("/posts/:postName", async function(req, res){
    try {
      const requestedTitle = _.capitalize(req.params.postName);
      
      const posts = await Post.findOne({title: requestedTitle});
      
      res.render("post", {title: posts.title, content: posts.content});
    } catch(error){
      console.error("Error showing post:", error);
      res.status(500).send("Internal Server Error");
    }
     

  });

