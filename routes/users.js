var express = require('express');
var bodyParser= require('body-parser');
var passport= require('passport');
var authenticate= require('../authenticate');
var User= require('../models/user');
var Videos= require('../models/video');
var router = express.Router();

router.use(bodyParser.json());


/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.route('/signup').post((req,res,next)=>{
  User.register({username:req.body.username},req.body.password,(err,user)=>{
      if(err)
      {
        res.statusCode=500;
        res.setHeader('Content-Type','Application/json');
        res.json({err:err});
      }
      else
      {
        if(req.body.firstname)
        {
          user.firstname=req.body.firstname;
        }
        if(req.body.lastname)
        {
          user.lastname= req.body.lastname;
        }
        user.save((err,user)=>{
          if(err)
          {
            res.statusCode=500;
            res.setHeader('Content-Type','Application/json');
            res.json({err:err});
          }
        
          passport.authenticate('local')(req,res,()=>{
            console.log("New User created");
            res.statusCode=200;
            res.setHeader('Content-Type','Application/json');
            res.json({
                success:true,
                status:'Registration successfull',
                user:user
            });
          });
        });
      }
  });
});


router.route('/login').post(passport.authenticate('local'),(req,res,next)=>{
    
    let token= authenticate.getJwtToken({_id:req.user._id});
    res.statusCode=200;
    res.setHeader('Content-Type','Application/json');
    res.json({
      status:"Successfully logged in",
      success:"true",
      token:token
    });
});

router.route('/checkValidity/:token').get((req,res,next)=>{
    
    try 
    {
      let data= authenticate.verifyJwtToken(req.params.token);
      res.statusCode=200;
      res.setHeader('Content-Type','Application/json');
      res.json({
        message:'Token Valid',
        success:"true",
        token:token
      });  
    } 
    catch (error) 
    {
      let tokenDetails=authenticate.decodeJwtToken(req.params.token);
      let newToken= authenticate.getJwtToken({_id:tokenDetails.payload._id});
      res.statusCode=200;
      res.setHeader('Content-Type','Application/json');
      res.json({
        message:'New Token Created',
        success:"true",
        token:newToken
      });
    }
    
});

router.route('/getUserClicks').get(authenticate.verifyUser,(req,res,next)=>{
  
  Videos.findOne({uploader:req.user._id}).then((clicks)=>{
    if(clicks!=null)
    {
        console.log(clicks);
        res.statusCode=200;
        res.setHeader('Content-Type','Application/json');
        res.json({
          status:"Success",
          clicks:clicks
        })
    }
  },(err)=>{
    next(err);
  }).catch((err)=>{

    next(err);

  });

});


module.exports = router;
