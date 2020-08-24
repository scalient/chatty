const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../config/config');
var users = require('../models/users').users;
var router = express.Router();
var passportAuth = require('../config/passportAuth');
var passport = passportAuth.passport;

router.get('/testJwt', passport.authenticate('jwt', { session: false }),
function(req, res) {

    // console.log('called');
    console.log('authenticated jwt');
    var jwt = req.header('authorization');
    console.log('jwt:' + jwt);
    res.status(200).send({ msg: 'recevied jwt'}); 
});

// TODO: add auth on route? 
router.put('/jwtsecret', (req, res) => {

    const newSecret = req.body.secret;
    config.auth.jwtSecret = newSecret; 

    passportAuth.reconfigure();         // reconfigure passport-jwt strategy

    res.status(200).send({ msg: 'Updated jwt secret' });
});

router.post('/register', async (req, res) => {

    const newUsername = req.body.username; 
    const newPassword = req.body.password;

    console.log(newUsername); 
    console.log(newPassword);

    // authentication will take approximately 13 seconds (hashcost = 10)
    // https://pthree.org/wp-content/uploads/2016/06/bcrypt.png
    const hashCost = 4;
  
    try {
        const newPasswordHash = await bcrypt.hash(newPassword, hashCost);  
     
        console.log('passwordHash: ' + newPasswordHash);

        if (newUsername in users) {
            res.status(400).send({ error: 'user already exists' });
        } else {
            users[newUsername] = newPasswordHash; 
        }

        // mongoose --- 
        // const userDocument = new UserModel({ username: newUsername, passwordHash : newPasswordHash });
        // await userDocument.save();

        // userDocument.save(function(err, doc) {
        //     if (err) return console.error(err);
        //     console.log('User ' + doc.username + ' successfully saved.');
        //     console.log('alt success');
        // });
    
        res.status(200).send({ newUsername });
      
    } catch (error) {
        res.status(400).send({
            error: 'req body should take the form { username, password }',
        });
    }
  });

router.post('/login', 
    passport.authenticate('local', { session: false }),
    function(req, res) {

       // this function called if auth successful
        console.log('auth successful user: ' + req.user);

        // create payload for JWT
        const payload = {
            username: req.user,
        };

        // assign payload to req.user 
        req.login(payload, {session: false}, (error) => {
            if (error) {
                res.status(400).send({ error });
            }

            // generate signed JWT 
            const token = jwt.sign(JSON.stringify(payload), config.auth.jwtSecret);   
            console.log('secret: ' + config.auth.jwtSecret);
            console.log('signed JWT token: ' + token);

            // assign JWT to cookie 
            res.cookie('jwt', token, { httpOnly: true, secure: true });
            res.status(200).send({ msg: 'Logged in' });

            // TODO: store jti
            // res.redirect('/users/' + req.user.username);
        });
    });
  
  module.exports = router;