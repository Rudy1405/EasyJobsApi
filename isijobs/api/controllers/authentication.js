
const jwt = require('jsonwebtoken')
const User = require('../models/user')
const config = require('../config/config')
const base64Img = require('base64-img')
const boom = require("boom");
const path = require('path')
const sendJSONresponse = require('./shared')

//  Generate jwt
function generateToken(user) {
  return jwt.sign(user, config.secret, {})
}

//  Set user info from request
 function setUserInfo(user) {
  let getUserInfo = {
    _id: user._id,
    email: user.email,
    role: user.role,
    name: user.name, 
    fbId: user.fbId,
    image: user.image
  }

  return getUserInfo
}

/*
 * Login route /auth/login
 */
function login(req, res, next) {
  try {
    console.log(req.user)
    let userInfo = setUserInfo(req.user)
  
    sendJSONresponse(res, 200, {
      token: generateToken(userInfo),
      user: userInfo
    })
  } catch (error) {
    return next(error)
  }
}

/*
 *  Register route /auth/register
 */
async function register(req, res, next) {
  try {
    const email = req.body.email;
    const name = req.body.name;
    const password = req.body.password;
    const role = req.body.role;

    
    if (!email || !name || !password)
     {
      throw boom.badData('El email, nombre y password son necesarios')
     }

    let userExist = await User.findOne({ email: email });
    if (userExist) {
      throw boom.badData('Ese email ya existe')
    }
    let user = new User({
      email: email,
      name: name,
      password: password,
      role: role
    })

    if (req.body.image) {  /// hceck cause payload is to long
      let fileName = Date.now();
      let filepath = base64Img.imgSync(
        req.body.image,
        path.join("/public/images", "user"),
        fileName
      );
      user.image = "/images/user/" + fileName + path.extname(filepath);
    }

    user = await user.save()

    let userInfo = setUserInfo(user)
    sendJSONresponse(res, 201, {token: generateToken(userInfo), user: userInfo})

  } catch (e) {
    return next(e);
  }
}  

//  Role authorization check
function roleAuthorization(role) {
  return async function(req, res, next) {
  
    try {
      const user = req.user;
      let foundedUser = await User.findById(user._id)
        if(foundedUser){
          if(foundedUser.role == role){
            return next()
          }else{
                throw boom.unauthorized('No estas autorizado a ver este contenido.')       
          }
        }else{
                throw boom.badRequest('No se encontro usuario')          
        }
/*
        User.findById(user._id, function(err, foundUser) {
          if (err) {
            sendJSONresponse(res, 422, {
              error: "No se encontro usuario"
            });
            return next(err);
          }
          //  If user is found, check role.
          if (foundUser.role === role) {
            return next();
          }
    
          sendJSONresponse(res, 401, {
            error: "No estas autorizado a ver este contenido."
          });
          return next("Unauthorized");
        });/// fundbyid intern funct 
*/
    } catch (error) {
      return next(error);
    }/// catch
  };// return func
}/// roleAuthorization func

//  Forgot password Route
async function forgotPassword(req, res, next) {

  try {
    const email = req.body.email;
    let foundedUser = await User.findOne({email: email})
    if(foundedUser){
          //  If user is found, generate and save resetToken
          //  Generete a token with crypto
          crypto.randomBytes(48, async function(err, buffer) {
            const resetToken = buffer.toString("hex");
            if (err) {
              return next(err);
            }
            foundedUser.resetPasswordToken = resetToken;
            foundedUser.resetPasswordExpires = Date.now() + 3600000; //  1 hour
            /// then we save and update de user
            let updatedUser = await User.findByIdAndUpdate(foundedUser._id, foundedUser, {new: true} ) // test if it can be like this or it need to be just saved
            if(updatedUser){
                            sendJSONresponse(res, 200,
                            {
                              message:
                              "Por favor revisa tu email y sigue el link para poder recuperar tu contraseña"
                            });
                            next();
            }else{
                  throw boom.badRequest('Error al encontrar y actualizar la password del usuario')
            }
        });/// crypto.randomBytes
    }else{
      throw boom.badRequest('No se encontro usuario')
    }
  } catch (error) {
    return next(error)
  }
/*
  const email = req.body.email;
  User.findOne({email: email}, function(err, existingUser) {
      //  If user is not found, return error
      if (err || existingUser == null) {
        sendJSONresponse(res, 422, {
          error: "No se encontro usuario"
        });
        return next(err);
      }
      //  If user is found, generate and save resetToken

      //  Generete a token with crypto
      crypto.randomBytes(48, function(err, buffer) {
        const resetToken = buffer.toString("hex");
        if (err) {
          return next(err);
        }

        existingUser.resetPasswordToken = resetToken;
        existingUser.resetPasswordExpires = Date.now() + 3600000; //  1 hour

        existingUser.save(function(err) {
          if (err) {
            return next(err);
          }

          // const message = {
          //  subject: 'Reset Password',
          //  text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          //  'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          //  'http://' + req.headers.host + '/reset-password/' + resetToken + '\n\n' +
          //  'If you did not request this, please ignore this email and your password will remain unchanged.\n'
          // }
          //  Otherwise, send user email via Mailgun
          // mailgun.sendEmail(existingUser.email, message)

          sendJSONresponse(res, 200, {
            message:
              "Por favor revisa tu email y sigue el link para poder recuperar tu contraseña"
          });
          next();
        });
      });
    }/// findeone intern func
  );// find one func
*/
} // forgotPassword func

//  Reset password Route
async function verifyToken(req, res, next) {
   try {
     let foundedUser = await User.findOne({resetPasswordToken: req.params.token,resetPasswordExpires: {$gt: Date.now()}})
     if(foundedUser){
          /// if it was founded save the new password and clear restToken from DB
          foundedUser.password = req.body.password;
          foundedUser.resetPasswordToken = undefined;
          foundedUser.resetPasswordExpires = undefined;
          let updatedUser = await User.findByIdAndUpdate(foundedUser._id, foundedUser, {new: true})
          if(updatedUser){
            res.status(200).json({
              message:
                "La password ha sido cambiada exitosamente. favor de logearse con la nueva Password"
            });
            next();
          }else{
          throw  boom.badRequest('Error al cambiar la password (update)')
          }
     }else{
       //  If query returned no results, token expires or was invalid. Return error.
       throw boom.badData('Tu token ha expirado. Porfavor de resetear la password nuevamente.')
     }
   } catch (error) {
      return next(error)     
   }
/*
  User.findOne({resetPasswordToken: req.params.token,resetPasswordExpires: {$gt: Date.now()}  }, function(err, resetUser) {
      //  If query returned no results, token expires or was invalid. Return error.
      if (err) {
        sendJSONresponse(res, 500, err);
        next(err);
      }
      if (!resetUser) {
        res.status(422).json({
          error:
            "Your token has expired. Please attempt to reset your password again."
        });
      }

      //  Otherwise, save new password and clear resetToken from database
      resetUser.password = req.body.password;
      resetUser.resetPasswordToken = undefined;
      resetUser.resetPasswordExpires = undefined;

      resetUser.save(function(err) {
        if (err) {
          return next(err);
        }

        //  If password change saved succesfully, alert user via email
        const message = {
          subject: "Password Changed",
          text:
            "You are receiving this email because you changed your password. \n\n" +
            "If you did not request this change, please contact us immediately."
        };

        //  Otherwise, send user email confirmation of password change via Mailgun
        // mailgun.sendEmail(resetUser.email, message)

        res.status(200).json({
          message:
            "Password changed succesfully. Please login with your new password"
        });
        next();
      });/// save query
    }/// functcion of query
  );//finone 
 */ 
} // verifyToken


async function facebookLogin(req, res, next) {
  const email = req.body.email;
  const firstName = req.body.firstName;
  const lastName = req.body.lastName;
  const facebookId = req.body.facebookId;

  if(!email || !firstName || !lastName || !facebookId){
    throw boom.badData('El email, nombre y fbID son necesarios')
  }
  /// now lets check if the user already exists
try {
      let foundedUser = await User.findOne({ facebookId: facebookId})
      if(foundedUser){ /// yes it exists
        let userInfo = setUserInfo(foundedUser);
        sendJSONresponse(res, 200, {
          token: generateToken(userInfo),
          user: userInfo
        });
        return;
      }else{ /// if thers no user yet lets save it
          let user = new User({
            email: email,
            facebookId: facebookId,
            firstName: firstName,
            lastName: lastName,
            profilePicture: `https://graph.facebook.com/${facebookId}/picture?type=small`
          });
          let createdUser  = await user.save()
          if(createdUser){                     
                    let userInfo = setUserInfo(createdUser);
                    sendJSONresponse(res, 201, {
                      token: generateToken(userInfo),
                      user: userInfo
                    });
          }else{
            throw boom.badRequest('Error while save the Fb User')   
          }
      }    
} catch (error) {
  return next(error);
}
/*
  User.findOne({ facebookId: facebookId},(err, existingUser) => {
      if (err) return next(err);

      if (existingUser) {
        let userInfo = setUserInfo(existingUser);
        sendJSONresponse(res, 200, {
          token: generateToken(userInfo),
          user: userInfo
        });
        return;
      }

      let user = new User({
        email: email,
        facebookId: facebookId,
        firstName: firstName,
        lastName: lastName,
        profilePicture: `https://graph.facebook.com/${
          facebookId
        }/picture?type=small`
      });

      user.save((err, user) => {
        let userInfo = setUserInfo(user);

        sendJSONresponse(res, 201, {
          token: generateToken(userInfo),
          user: userInfo
        });
      });/// save
    }/// intern findone func
  );/// find one

  */
} /// facebookLogin 


module.exports = {
  login,
  register,
  roleAuthorization,
  forgotPassword,
  verifyToken,
  facebookLogin
}