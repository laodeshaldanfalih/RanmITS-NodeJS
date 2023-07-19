const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
var fs = require('fs');
var path = require('path');
app.set('view engine', 'ejs');
require('dotenv').config();
require('dotenv').config({ path: path.resolve(__dirname, './.env') });
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json())
app.use(express.static("public"));
app.use(session({
    secret: "OurLitterSecret",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

// monggose db
mongoose.connect(process.env.MONGO_URL).then(console.log("DB Connected"));

//multer
var multer = require('multer');

var storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads')
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now())
    }
});
 
var upload = multer({ storage: storage });

//db schema
const lostVehicleSchema = new mongoose.Schema({
    handphoneNumber : Number,
    vType: String,
    vModel: String,
    vYears: Number,
    vColor: String,
    vNumber: String,
    vPhoto: {
        data: Buffer,
        contentType: String
    },
    lostTime: String,
    lostLocation: String,
    description: String,
    userId: String
});

const userSchema = new mongoose.Schema({
    email: String,
    nama: String,
    password: String,
});

userSchema.plugin(passportLocalMongoose);

// db model
const LostVehicle = new mongoose.model("LostVehicle", lostVehicleSchema);
const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// variabel
var existedEmail;
var unmatchedPassword;
var matchedAccount;
var unmatchedAccount;
var detailedVehicleId;
var query;
var deletedId = [];

// function
function dateFormat(dates){
    let day = dates.toLocaleString('en-us', {weekday: 'long'});
    let date = dates.getDate();
    let month = dates.getMonth();
    let year = dates.getFullYear();
    let formattedDate = day +", "+date+" "+month+" "+year;
    return formattedDate;
}

// login-page
app.get('/', (req,res)=>{
    res.render('loginpage',{navbarTitle: "Login", unmatchedAccount:unmatchedAccount});
    unmatchedAccount = false;
});

app.post("/",(req,res)=>{
    const user = new User({
        username:  req.body.username,
        password: req.body.password
    });

    req.login(user,(err)=>{
        if(err){
            console.log(err);
        } else{
            passport.authenticate('local', {
                failureRedirect: '/',
            })(req,res,(foundUser)=>{
                id = req.user.id;
                res.redirect("/home");
            });
        }
    });
});


app.get("/loggedIn",(req,res)=>{
    if(req.isAuthenticated()){
        res.render("loggedIn",{userId: req.user.id});
    }else{
        res.redirect("/");
    }
    
});

app.get("/home", (req,res)=>{
    if(req.isAuthenticated()){
        var queryMotor = {vType: "motor"};
        var queryMobil = {vType: "mobil"};

        User.findOne({_id: req.user.id}).then((user)=>{
            LostVehicle.find().then((indexSemua)=>{
                LostVehicle.find(queryMotor).then((indexMotor)=>{
                    LostVehicle.find(queryMobil).then((indexMobil)=>{
                        res.render("homepage",{
                            user: user,
                            semua: indexSemua,
                            motor: indexMotor,
                            mobil: indexMobil
                        });
                    });
                });
            });
        });
    }else{
        res.redirect("/");
    }
    
});

// profile-page
app.get('/profile', (req,res)=>{
    if(req.isAuthenticated()){
        User.findOne({_id: req.user.id}).then((user)=>{
            LostVehicle.find({userId: req.user.id}).then((index)=>{
                res.render("profilepage",{
                    user: user,
                    lostVehicle: index,
                    navbarTitle: "Profile"
                });
            });
        });
    }else{
        res.redirect("/");
    }
});

// laporan-kehilangan-page
app.get("/laporan-kehilangan-page", (req,res)=>{
    if(req.isAuthenticated()){
        res.render('laporan-kehilangan-page',{navbarTitle: "Lapor Kehilangan"});
    }else{
        res.redirect("/");
    }
    
});

app.post("/laporan-kehilangan-page", upload.single('vPhoto'),(req,res)=>{
    const selectedDate = new Date(req.body.lostTime);
    const formattedDate = selectedDate.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
        }).toString();;

    const lostVehicle = new LostVehicle({
        handphoneNumber : req.body.handphoneNumber,
        vType: req.body.vType,
        vModel: req.body.vModel,
        vYears: req.body.vYears,
        vColor: req.body.vColor,
        vNumber: req.body.vNumber,
        vPhoto: {
            data: fs.readFileSync(path.join(__dirname + '/uploads/' + req.file.filename)),
            contentType: 'image/png'
        },
        lostTime: formattedDate,
        lostLocation: req.body.lostLocation,
        description: req.body.description,
        userId: req.user.id
    });
    lostVehicle.save().then(()=>{
        res.redirect('/success');
    });
});

//tentang-produk-page
app.get("/tentang-produk-page", (req,res)=>{
    if(req.isAuthenticated()){
            res.render("tentang-produk-page",{ navbarTitle: "Tentang RanmITS"});
    }else{
        res.redirect("/");
    }
});

// success page for uploading lost vehicle document
app.get('/success',(req,res)=>{
    if(req.isAuthenticated()){
        res.render("successpage");
    }else{
        res.redirect("/");
    }
    
});

// delete lost vehicle data from profile page
app.post('/deleteLostVehicle',(req,res)=>{
    deletedId.push(req.body.delete); 
    var yes = req.body.yes;
    if(yes == "yes"){
        LostVehicle.findOneAndDelete({_id: deletedId[deletedId.length-2]}).then((index)=>{
            yes = "no";
            console.log("id: "+deletedId+" has been deleted");
            res.redirect('/profile')
        });
    }
});

// lost vehicle detial page
app.get("/detail",(req,res)=>{
    LostVehicle.findOne({_id: detailedVehicleId}).then((index)=>{
        res.render('detailpage',{index: index, navbarTitle: "Detail Laporan"});
    });
    
});

app.post('/detailedVehicleId',(req,res)=>{
    detailedVehicleId = req.body.detailedVehicleId;
    res.redirect("/detail");
});

// register-page
app.get('/register', (req,res)=>{
    res.render('registerpage',{navbarTitle: "Buat akun", existedEmail: existedEmail, unmatchedPassword: unmatchedPassword});
    unmatchedPassword = false;
    existedEmail = false;
});

app.post('/register', async (req,res)=> { 
    var email = req.body.username;
    var nama = req.body.nama;
    var password = req.body.password;
    var passwordConfirmation = req.body.passwordConfirmation;
    
    User.findOne({username: email}).then((foundUser)=>{
        if(!foundUser){
            if(password == passwordConfirmation){
                User.register({username: email}, password, function(err, user){
                    if(err){
                        console.log(err);
                        res.redirect("/register");
                    }else{
                        User.updateOne({username: email},{nama: nama}).then(()=>{
                        });
                        passport.authenticate("local")(req,res, function(){
                            res.redirect("/loggedIn");
                        });
                    }
                });
            }else{
                unmatchedPassword = true;
                res.redirect("/register");
            }
        }else{
            existedEmail = true;
            res.redirect("/register");
        }
    });
    
});

app.get("/logout",(req,res)=>{
    req.logout(function(err) {
        if (err) { 
            return next(err); 
        }
        res.redirect("/");
      });
});

app.listen(process.env.port,()=>{
    console.log("Running app on port 3000");
});