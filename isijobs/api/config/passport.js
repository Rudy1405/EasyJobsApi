
const passport = require('passport')
const User = require('../models/user')
const config = require('./config')
const JwtStrategy = require('passport-jwt').Strategy
const ExtractJwt = require('passport-jwt').ExtractJwt
const LocalStrategy = require('passport-local')
//  Setting username field to email rather than username
const localOptions = {
    usernameField: 'email',
    passwordField: 'password' 
    //// Role
  }
  
  // Setting up local login Strategy
  const localLogin = new LocalStrategy(localOptions, function (email, password, done) {
    if(!password){
      return done(null, false, {
        error: 'No se recibio la password'
      })
    }
    User.findOne({ email: email }, function (err, user) {
      if (err) {
        return done(err)
      }
      if (!user) {
        return done(null, false, {
            error: 'Usuario no encontrado en la BD'
          })
      } else {
        user.comparePassword(password, function (err, isMatch) {
          if (err) {
            return done(err)
          }
          if (!isMatch) {
            return done(null, false, {
              error: 'Password incorrecta, alv!'
            })
          }
          console.log(user)
          return done(null, user)
        })
      }
    })
  })


  //  Setting JWT strategy options
const jwtOptions = {
    //  Telling Passport to check authorization headers for jwt
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    //  Telling passport where to find the secret
    secretOrKey: config.secret
  }
  
  const jwtLogin = new JwtStrategy(jwtOptions, (payload, done) => {
    User.findById(payload._id, (err, user) => {
      if (err) {
        return done(err, false)
      }
  
      if (user) {
        done(null, user)
      }
    })
  })
  
  passport.use(jwtLogin)
  passport.use(localLogin)