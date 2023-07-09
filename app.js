const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// monggose db
// mongoose.connect('mongodb+srv://admin-shaldan:admin123@cluster0.cpnwcn2.mongodb.net/RanmITSDB');

app.get("/", (req,res)=>{
    res.render("homepage");
});

app.listen(3000,()=>{
    console.log("Running app on port 3000");
});

app.get("/laporan-kehilangan-page", (req,res)=>{
    res.render('laporan-kehilangan-page')
});

app.post("/laporan-kehilangan-page", (req,res)=>{
    const vehicleData = {
        handphoneNumber : req.body.handphoneNumber,
        vModel: req.body.vModel,
        vYears: req.body.vYears,
        vColor: req.body.vColor,
        vNumber: req.body.vNumber,
        vPhoto: req.body.vPhoto,
        lostTime: req.body.lostTime,
        lostLocation: req.body.lostLocation,
        description: req.body.description
    }
    console.log(vehicleData);
    res.redirect("/");
});