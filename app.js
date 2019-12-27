const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const lodash = require("lodash");

const app = express();
const port = 3000;
// const items = ["Buy Food","Cook Food", "Eat Food"];
// const workItems = [];

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));

mongoose.connect("mongodb://localhost:27017/todolistDB", {useNewUrlParser: true});

const itemsSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Item name can't be empty! Please add a name..."]
  }
});

const listSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "List name can't be empty"]
  },
  items: [itemsSchema]
});

const Item = new mongoose.model('Item', itemsSchema);
const ToDoList = new mongoose.model('ToDoList', listSchema);

function getDefaultItems(){
  const item1 = new Item({
    name: "Buy Food"
  });
  const item2 = new Item({
    name: "Cook Food"
  });
  const item3 = new Item({
    name: "Eat Food"
  });
  return [item1, item2, item3];
}

function addDefaultListItems(callback){
  Item.insertMany(getDefaultItems(), (err) => {
    if(err){
      console.log(err);
    }else{
      console.log("Added items successfully to db...");
      callback();
    }
  });
}

function getListItems(callback){
  const itemsList = [];
  Item.find((err, items) => {
    if(err){
      console.log(err);
    }else{
      items.forEach(item => {
        itemsList.push(item);});
      callback(itemsList);
    }
  });
}

function getList(listName, callback){
  ToDoList.findOne({name: listName}, (err, reqList) => {
    if(err){
      console.log(err);
    }else{
      callback(reqList);
    }
  });
}

function createNewList(listName,callback){
  const defaultItems = getDefaultItems();
  const newList = new ToDoList({
    name: listName,
    items: defaultItems
  });
  newList.save((err) => {
    if(err){
      console.log(err);
    }else{
      console.log("Created a new list: "+listName);
      callback();
    }
  });
}

function addDefaultItemsToList(listName, callback){
  const defaultItems = getDefaultItems();
  ToDoList.updateOne({name: listName}, {items: defaultItems}, (err, updateResult) => {
    if(err){
      console.log(err);
    }else{
      console.log("Document Updated successfully...");
      callback();
    }
  });
}

app.get("/", (req, res) => {
  const day = date.getDay();
  const listTitle = req.params.listTitle;
  getListItems((itemsList) => {
    if(!itemsList.length){
      addDefaultListItems(() => {
        res.redirect("/");
      });
    }else{
      res.render('index', {listTitle: 'Today', items: itemsList});
    }
  });
});

app.get("/about", (req, res) => {
  res.render('about');
});

app.get("/:listName", (req, res) => {
  const listName = lodash.capitalize(req.params.listName);
  getList(listName, (targetList) => {
    if(targetList !== null && targetList.items){
      res.render('index', {listTitle: listName, items: targetList.items});
    }else if(targetList !== null){
      addDefaultItemsToList(listName, () => {
        res.redirect("/"+listName);
      });
    }else{
      createNewList(listName, () => {
        res.redirect("/"+listName);
      });
    }
  });
});

app.post("/", (req, res) => {
  const item = req.body.listItem;
  const listName = req.body.list;
  const newItem = new Item({
      name: item
    });

  if(listName === "Today"){
    newItem.save((err) => {
      if(err){
        console.log(err);
      }else{
        console.log("New item successfully added to db...");
        res.redirect("/");
      }
    });
  }else{
    ToDoList.findOne({name: listName},(err, foundList) => {
        if(err){
          console.log(err);
        }else{
          foundList.items.push(newItem);
          foundList.save();
          res.redirect("/"+listName);
        }
    });
  }
});

app.post("/delete", (req, res) => {
  const item = req.body.itemToDelete;
  Item.deleteOne({_id: item}, (err) => {
    if(err){
      console.log(err);
    }else{
      console.log("Deleted an item from db...");
      res.redirect("/");
    }
  });
});

app.listen(port, () => {console.log("Server is listening on "+port)});
