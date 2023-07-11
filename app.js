const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// monggose db
// mongoose.connect('mongodb+srv://admin-shaldan:admin123@cluster0.cpnwcn2.mongodb.net/RanmITSDB');
mongoose.connect('mongodb://127.0.0.1:27017/RanmITSDB');
//db schema
const userSchema = new mongoose.Schema({
    email: String,
    nama: String,
    password: String,
});
const lostVehicleSchema = new mongoose.Schema({
    handphoneNumber : Number,
    vModel: String,
    vYears: Number,
    vColor: String,
    vNumber: String,
    vPhoto: String,
    lostTime: Date,
    lostLocation: String,
    description: String,
    user: userSchema,
});
// db model
const User = new mongoose.model("User", userSchema);
const LostVehicle = new mongoose.model("LostVehicle", lostVehicleSchema);

// variabel
var existedEmail;
var unmatchedPassword;
var matchedAccount;
var unmatchedAccount;
var id;
var loggedIn = false;

// login-page
app.get('/', (req,res)=>{
    res.render('loginpage',{navbarTitle: "Login", unmatchedAccount:unmatchedAccount});
    matchedAccount = false;
    unmatchedAccount = false;
});

app.post('/',(req,res)=>{
    var email = req.body.email;
    var password = req.body.password;
    User.find().then((index)=>{
        index.forEach((index)=>{
            if(email == index.email && password == index.password){
                id = index._id.toString();
                matchedAccount = true;
            }
        });
        if(matchedAccount == true){
            loggedIn = true;
            res.redirect('/home');

            // homepage
            app.get("/home", (req,res)=>{
                if(loggedIn == true){
                    User.findOne({_id: id}).then((index)=>{
                        res.render("homepage",{loggedIn: loggedIn,nama: index.nama});
                    });
                }else{
                    res.render("homepage",{loggedIn:loggedIn});
                }
            });

            // profile-page
            app.get('/profile', (req,res)=>{
                console.log(id);
                res.render('profilepage', {id: id});
            });

            // laporan-kehilangan-page
            app.get("/laporan-kehilangan-page", (req,res)=>{
                res.render('laporan-kehilangan-page',{navbarTitle: "Lapor Kehilangan"});
            });

            app.post("/laporan-kehilangan-page", (req,res)=>{
                User.findOne({_id: id}).then((index)=>{
                    const lostVehicle = new LostVehicle({
                        handphoneNumber : req.body.handphoneNumber,
                        vType: req.body.vType,
                        vModel: req.body.vModel,
                        vYears: req.body.vYears,
                        vColor: req.body.vColor,
                        vNumber: req.body.vNumber,
                        vPhoto: req.body.vPhoto,
                        lostTime: req.body.lostTime,
                        lostLocation: req.body.lostLocation,
                        description: req.body.description,
                        user: index
                    });
                    lostVehicle.save();
                });
                res.redirect("/home");
            });

            //tentang-produk-page
            app.get("/tentang-produk-page", (req,res)=>{
                if(loggedIn == true){
                    User.findOne({_id: id}).then((index)=>{
                        res.render("tentang-produk-page",{loggedIn: loggedIn,nama: index.nama});
                    });
                }else{
                    res.render("tentang-produk-page",{loggedIn:loggedIn});
                }
            });

        }else{
           unmatchedAccount = true;
           res.redirect('/');
        }
    });
});

if(loggedIn == true){
    // homepage
    app.get("/", (req,res)=>{
        if(loggedIn == true){
            User.findOne({_id: id}).then((index)=>{
                res.render("homepage",{loggedIn: loggedIn,nama: index.nama});
            });
        }else{
            res.render("homepage",{loggedIn:loggedIn});
        }
    });
}
// register-page
app.get('/register', (req,res)=>{
    res.render('registerpage',{navbarTitle: "Buat akun", existedEmail: existedEmail, unmatchedPassword: unmatchedPassword});
    existedEmail = false;
    unmatchedPassword = false;
});

app.post('/register', async (req,res)=> { 
    var email = req.body.email;
    var nama = req.body.nama;
    var password = req.body.password;
    var passwordConfirmation = req.body.passwordConfirmation;

    if(password == passwordConfirmation){
        await User.find().then((index)=>{
            index.forEach((index) => {
                if(index.email == email){
                    existedEmail = true;
                }
            });
        });
    
        if(existedEmail == false){
            const user = new User({
                email: email,
                nama: nama,
                password: password,
            });
            user.save();
            res.redirect('/');
        }else{
            res.redirect('/register');
        }
    }else{
        unmatchedPassword = true;
    }
});

app.listen(3000,()=>{
    console.log("Running app on port 3000");
});