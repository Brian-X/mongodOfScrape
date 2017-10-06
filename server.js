/* Scrape and Display
 * (If you can do this, you should be set for your hw)
 * ================================================== */

// STUDENTS:
// Please complete the routes with TODOs inside.
// Your specific instructions lie there

// Good luck!

// Dependencies
var express = require("express");
var exphbs = require("express-handlebars");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
// Requiring our Note and Article models
var Note = require("./models/Note.js");
var Article = require("./models/Article.js");
// Our scraping tools
var request = require("request");
var cheerio = require("cheerio");
// Set mongoose to leverage built in JavaScript ES6 Promises
mongoose.Promise = Promise;


// Initialize Express
var app = express();

var port = process.env.PORT || 3075;
const dbConnectString = process.env.MONGODB_URI || "mongodb://localhost/scraper"; 

// Use morgan and body parser with our app
app.use(logger("dev"));
app.use(bodyParser.urlencoded({
  extended: false
}));

// Make public a static dir
app.use(express.static("public"));
  // set up handlebars for templating
app.engine("handlebars", exphbs({ defaultLayout: "index" }));
app.set("view engine", "handlebars");

// Database configuration with mongoose
mongoose.connect(dbConnectString);
var db = mongoose.connection;
// Database configuration with mongoose
mongoose.connect(dbConnectString, function(error){
    if (error) throw error;
    console.log("connnected to mongoose");
});
// Show any mongoose errors
db.on("error", function(error) {
  console.log("Mongoose Error: ", error);
});

// Once logged in to the db through mongoose, log a success message
db.once("open", function() {
  console.log("Mongoose connection successful.");
});


// Routes
// ======

// A GET request to scrape the echojs website
app.get("/scrape", function(req, res) {
  // First, we grab the body of the html with request
  request("https://www.nytimes.com/", function(error, response, html) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(html);
    // Now, we grab every h2 within an article tag, and do the following:
    $("article h2").each(function(i, element) {

      // Add the text and href of every link, and save them as properties of the result object
      var result = {
        "title"  : $(this).children("a").text(),
        "link"   : $(this).children("a").attr("href"),
        "summary": $(this).parent("article").children(".summary").text()
      };

      // Using our Article model, create a new entry
      // This effectively passes the result object to the entry (and the title and link)
      var entry = new Article(result);

      // Now, save that entry to the db
      entry.save(function(err, doc) {
        // Log any errors
        if (err) {
          console.log(err);
        }
        // Or log the doc
        else {
          console.log(doc);
        }
      });

    });

    // Tell the browser that we finished scraping the text
    res.send("Scrape Complete");
  });
  
});

// This will grab an article by it's ObjectId
app.get("/articles", function(req, res) {
// Find all users in the user collection with our User model
  Article.find({}, function(error, doc) {
    // Send any errors to the browser
    if (error) {
      res.send(error);
    }
    // Or send the doc to the browser
    else {
      console.log(doc);
      res.json(doc);
    }
  });
});

// Create a new note or replace an existing note
app.get("/articles/:id", function(req, res) {
  Article.find({_id: req.params.id }) 
      .populate("Note")
      .exec(function(error, found) {
        if (error) {
          return handleError(error);
        } else {
          res.json(found);
        }

      });
});
  // TODO
  // ====
app.post("/articles/:id", function(req, res) {

  var newNote = new Note(req.body);
  // Save the new note to mongoose
  newNote.save(function(error, doc) {
    // Send any errors to the browser
    if (error) {
      res.send(error);
    }
    // Otherwise
    else {
      // Find our user and push the new note id into the User's notes array
      Article.findOneAndUpdate({"_id": req.params.id}, { "note": doc._id })
        // Send any errors to the browser
        .exec(function(err, doc) {
          if (err) {
            res.send(err);
          }
          // Or send the newdoc to the browser
          else {
            res.send(doc);
          }
      });
    }
  });
});

app.listen(port)
  // save the new note that gets posted to the Notes collection

  // then find an article from the req.params.id

  // and update it's "note" property with the _id of the new note



// Listen on port 3095
// app.listen(3085, function() {
//   console.log("App running on port 3085!");
// });
