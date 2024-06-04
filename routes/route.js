const express = require('express');
const router = express.Router();
const User =require('../models/users');
const multer = require('multer');
const fs = require("fs");


var storage = multer.diskStorage({
    destination:function(req, file, cb){
   cb(null, "./uploads");
    },
    filename:function(req, file, cb){
        cb(null, file.fieldname+"_"+Date.now()+"_"+file.originalname);
    }
});

var upload = multer({
    storage:storage,
}).single("image"); 

router.post("/add", upload, (req, res) => {
    const user = new User({
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        image: req.file.filename, 
    });

    console.log(user); 

    user.save()
        .then(() => {
            req.session.message = {
                type: 'success',
                message: 'User Added Successfully!'
            };
            res.redirect("/");
        })
        .catch(err => {
            console.error(err); 
            res.json({ message: err.message, type: 'danger' });
        });
});

// router.get("/users", (req, res)=>{
//     res.send("All Users");
// });


//get all users

router.get("/", (req, res) => {
    User.find().exec()
        .then(users => {
            res.render('index', {
                title: "Home page",
                users: users,
            });
        })
        .catch(err => {
            res.json({ message: err.message });
        });
});


router.get("/add", (req, res)=>{
    res.render('add_users', {title: "Add Users"});
});

//edit user

router.get('/edit/:id', (req, res) => {
    let id = req.params.id;
    User.findById(id)
        .then(user => {
            if (user == null) {
                res.redirect('/');
            } else {
                res.render('edit_users', {
                    title: 'Edit Users',
                    user: user,
                });
            }
        })
        .catch(err => {
            console.error(err);
            res.redirect('/');
        });
});

//update users

router.post('/update/:id', upload, async (req, res) => {
    let id = req.params.id;
    let new_image = '';

    if (req.file) {
        new_image = req.file.filename;
        try {
            fs.unlinkSync("./uploads/" + req.body.old_image);
        } catch (err) {
            console.log(err);
        }
    } else {
        new_image = req.body.old_image;
    }

    try {
        const result = await User.findByIdAndUpdate(id, {
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            image: new_image,
        });

        req.session.message = {
            type: 'success',
            message: 'User updated successfully!'
        };
        res.redirect('/');
    } catch (err) {
        res.json({ message: err.message, type: 'danger' });
    }
});

//delete user
router.get('/delete/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const result = await User.findByIdAndDelete(id);

        if (result && result.image !== "") {
            try {
                fs.unlinkSync('./uploads/' + result.image);
            } catch (err) {
                console.log(err);
            }
        }

        req.session.message = {
            type: "info",
            message: "User Deleted Successfully!"
        };
        res.redirect('/');
    } catch (error) {
        res.json({ message: error.message });
    }
});


module.exports = router;