const express = require("express");
const bp = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.use(bp.urlencoded({extended:true}));
app.set('view engine', 'ejs');
app.use(express.static("public"));

var pageflag = 0;

mongoose.connect('mongodb+srv://admin-shrey:keepPeace13@cluster0.jbvit.mongodb.net/todolistDB', {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false});

const itemSchema = new mongoose.Schema({
  name: String
});

const Task = new mongoose.model("task", itemSchema);
const defaultItem1 = new Task({
  name:"Welcome To Your To-Do List"
});

const listSchema = {
  name:String,
  items: [itemSchema]
}
const List = mongoose.model("list",listSchema);


app.get("/",function(req,res){
  Task.find({},function(err, foundTasks){
    if(err){
      console.log(err);
    }
    else if(foundTasks.length===0){
      Task.insertMany([defaultItem1], function(errM){
        if(errM){
          console.log(errM);
        }
        res.redirect("/");
      });
    }
    else{
      res.render("list", {
        listTitle:"Today",
        newItems:foundTasks
      });
    }
  });

});


app.get("/lists/:newList", function(req,res){

  const newListName = _.capitalize(req.params.newList);
  //if (newListName == "Favicon.ico") return;
  List.findOne({name:newListName}, function(err, foundList){
    if(!err){
      if(!foundList){
        const customList = new List({
          name : newListName,
          items: [defaultItem1]
        });
        customList.save(function(){
          res.redirect("/lists/"+newListName);
        });

      }
      else{
        res.render("list", {
          listTitle: foundList.name,
          newItems:foundList.items
        });
      }
    }
  });
});




app.post("/",function(req,res){

  const item = req.body.item;
  const listName = req.body.list;
  const itemEntered = new Task({
    name: item
  });

  if(listName==="Today"){
    itemEntered.save(function(){
      res.redirect("/");
    });
  }
  else{
    List.findOne({name:listName}, function(err,foundList){
      if(!foundList){
        console.log("error: list not found");
      }
      foundList.items.push(itemEntered);
      foundList.save(function(){
        res.redirect("/lists/" + listName);
      });
    });
  }

});

app.post("/delete",function(req,res){
  const checkedItemID = req.body.checkbox;
  const listName = req.body.listName;

  if(listName==="Today"){
    Task.findByIdAndDelete(checkedItemID, function(err){
      if(err){
        console.log(err);
      }
      res.redirect("/");
    });
  }
  else{
    List.findOneAndUpdate({name:listName},{$pull:{items:{_id: checkedItemID}}}, function(err,foundList){
      if(!err){
        res.redirect("/lists/" + listName);
      }
    });
  }
});


app.post("/switch", function(req,res){
  const listName = req.body.newList;
  const goTo = req.body.goto;
  if(goTo==="home"){
    res.redirect("/");
  }
  else{
    if(listName){
        res.redirect("/lists/"+listName);
    }
    else{
      res.redirect("/");
    }

  }
});


let port = process.env.PORT;
if(port==null || port ==""){
  port = 3000;
}

app.listen(port, function(){
  console.log("Server has started successfully");
});
