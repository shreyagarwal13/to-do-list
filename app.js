require('dotenv').config();
const express = require("express");
const bp = require("body-parser");
const mongoose = require("mongoose");
const flash = require("express-flash");
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');

const app = express();

app.use(bp.urlencoded({extended:true}));
app.set('view engine', 'ejs');
app.use(express.static("public"));


app.use(session({
  secret: process.env.DB_SMESSAGE,
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());


mongoose.connect('mongodb+srv://admin-shrey:'+process.env.MONGO_PASS+'@cluster0.jbvit.mongodb.net/todolistDB', {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false});
mongoose.set("useCreateIndex", true);


const itemSchema = new mongoose.Schema({
  name: String
});

const Task = new mongoose.model("task", itemSchema);
const defaultItem = new Task({
  name:"Welcome To Your To-Do List"
});


const userSchema = new mongoose.Schema({
  username: String,
  password:String,
  items: [itemSchema]
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User",userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//-------------------------To-Do-List-------------------------
app.get("/", function(req,res){

  //Load the page from server and not cache
  res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');

  if(req.isAuthenticated()){
    User.findById(req.user.id, function(err, foundUser){
      if(err){
        console.log(err);
        res.redirect("/login");
      }
      else{
        if(foundUser){
            res.render("list", { newItems:foundUser.items});
        }
        else{
          redirect('/login');
        }
      }
    });
  }
  else{
    res.redirect('/login');
  }
});

app.post("/",function(req,res){
  const item = req.body.item;
  const itemEntered = new Task({
    name: item
  });
  User.findById(req.user.id, function(err, foundUser){
    if(err){
      console.log(err);
      res.redirect("/error");
    }
    else{
      if(foundUser){
        foundUser.items.push(itemEntered);
        foundUser.save(function(){
          res.redirect("/");
        });
      }
      else{
        req.flash('error', 'User not found');
        redirect("/login");
      }
    }
  });
});

app.post("/delete",function(req,res){
  const checkedItemID = req.body.checkbox;
    User.findOneAndUpdate({_id:req.user.id},{$pull:{items:{_id: checkedItemID}}}, function(err,foundUser){
      if(!err){
        res.redirect("/");
      }
    });
});


//-------------------------Authentication-------------------------
app.get("/login",function(req,res){
  res.render("login");
});

app.get("/signup",function(req,res){
  res.render("signup");
});

app.get("/error", function(req,res){
  res.render("error",);
});

app.post("/signout", function(req,res){
  req.logout();
  res.redirect("/login");
});


app.post("/signup",function(req,res){
  User.findOne({username : req.body.username}, function(err,foundUser){
    if(err){
      res.redirect("/error");
    }
    else if(foundUser){
      req.flash('error', 'User already exists');
      res.redirect("/signup");
    }
    else{
      User.register({username:req.body.username, items: [defaultItem] }, req.body.password, function(error,user){
        if(error){
          res.redirect("/error");
        }
        else{
          passport.authenticate("local")(req, res, function(){
            res.redirect("/");
          });
        }
      });
    }
  });
});

app.post("/signin",function(req,res){
  const user = new User({
    username: req.body.username,
    password:req.body.password
  });


  User.findOne({username : req.body.username}, function(err,foundUser){
    if(err){
      res.redirect("/error");
    }
    else if(foundUser){
      passport.authenticate("local", function(err,user,info){
        if(err){
          res.redirect("/error");
        }
        else{
          if(!user){
            req.flash('error', 'Incorrect password');
            res.redirect('/login');
          }
          else{
            req.login(user, function(err){
              if(err){
                res.redirect("/error");
              }
              else{
                res.redirect("/");
              }
            });
          }
        }
      })(req,res);
    }
    else{
      req.flash('error', 'User does not exist');
      res.redirect('/login');
    }
  });
});

let port = process.env.PORT;
if(port==null || port ==""){
  port = 3000;
}

app.listen(port, function(){
  console.log("Server has started successfully");
});
