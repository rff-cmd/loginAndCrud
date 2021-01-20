//jshint esversion:6
require('dotenv').config()
const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
// const LocalStrategy = require('passport-local'); /* this should be after passport*/
const passportLocalMongoose = require('passport-local-mongoose');

mongoose.connect('mongodb://localhost:27017/userDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true

});

const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static('public'));


app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());



const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

const secretSchema = new mongoose.Schema({
    secret: String
});

const bookSchema = new mongoose.Schema({
    name: String,
    author: String
});

userSchema.plugin(passportLocalMongoose);


const User = mongoose.model('User', userSchema);
const Secret = mongoose.model('Secret', secretSchema);
const Book = mongoose.model('Book', bookSchema);

passport.use(User.createStrategy());
// passport.serializeUser(function (user, done) {
//     done(null, user.id);
// });
// passport.deserializeUser(function (id, done) {
//     User.findById(id, function (err, user) {
//         done(err, user);
//     });
// });

mongoose.set("useCreateIndex", true);

// passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());



app.route('/books', )
    .get(isLoggedin, (req, res) => {

        Book.find({}, (err, foundBook) => {
            res.render('book/index', {
                name: foundBook,
                author: foundBook
            });
        });

    });

app.route('/books/add')
    .get(isLoggedin, (req, res) => {
        res.render('book/add')
    })
    .post((req, res) => {

        const newBook = new Book({
            name: req.body.name,
            author: req.body.author
        });
        newBook.save((err) => {
            if (err) {
                res.send(err)
            } else {
                res.render('book/add')
            }
        })

    });

app.get('/books/delete/:id', isLoggedin, (req, res) => {

    Book.findByIdAndDelete({
        _id: req.params.id
    }, (err) => {
        if (err) {
            console.log(err);
        } else {
            res.redirect('/books')
        }
    })
});

app.route('/books/edit/:id')
    .get(isLoggedin, (req, res) => {
        Book.findById({
            _id: req.params.id
        }, (err, foundBook) => {
            if (err) {
                console.log(err);
            } else {
                res.render('book/edit', {
                    _id: foundBook._id,
                    name: foundBook.name,
                    author: foundBook.author
                })
            }
        });


    })

app.post('/books/update/:update', isLoggedin, (req, res, next) => {
    Book.findOneAndUpdate({
        _id: req.params.update
    }, {
        name: req.body.name,
        author: req.body.author
    }, (err) => {
        if (err) {
            console.log(err);
        } else {
            res.redirect('/books')
        }
    })
})


app.get("/", (req, res) => {
    res.render('home')
});

app.get('/login', (req, res) => {
    res.render('login')
});

app.get('/register', (req, res) => {
    res.render('register')
});

app.get('/secrets', isLoggedin, (req, res, next) => {
    res.render('secrets', {
        title: 'Secrets'
    })
})

app.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
});

app.post("/register", function (req, res) {
    // console.log(req.body.username);
    // console.log(req.body.password);
    User.register(new User({
        username: req.body.username
    }), req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            return res.render("register");
        }
        passport.authenticate("local")(req, res, function () {
            res.redirect("/login");
        });
    });
});

app.post('/login', passport.authenticate('local', {
    successRedirect: '/secrets',
    failureRedirect: '/login'
}));

function isLoggedin(req, res, next) {
    if (req.isAuthenticated()) {
        // res.redirect("/secrets")
        return next();
    } else {
        res.redirect("/login")
    }
}



app.post('/submit', (req, res) => {
    bcrypt.hash(req.body.secret, saltRounds, (err, hash) => {
        const newSecret = new Secret({
            secret: hash
        });
        newSecret.save((err) => {
            if (err) {
                res.send(err)
            } else {
                res.render('submit')
            }
        })
    })
})

app.listen(3000, () => {
    console.log("Server is running on port 3000");
});