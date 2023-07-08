const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// monggose db
mongoose.connect('mongodb+srv://admin-shaldan:admin123@cluster0.cpnwcn2.mongodb.net/RanmITSDB');

app.get("/", (req,res)=>{
    res.render("homepage");
});

app.listen(3000,()=>{
    console.log("Running app on port 3000");
})