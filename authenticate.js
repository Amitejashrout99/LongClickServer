var passport= require('passport');
var LocalStrategy= require('passport-local').Strategy;
var User= require('./models/user');
var Video= require('./models/video');
var jwt= require('jsonwebtoken');
var JwtStrategy= require('passport-jwt').Strategy;
var ExtractJwt = require('passport-jwt').ExtractJwt;

exports.local=passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

exports.getJwtToken=(payload)=>{
    return jwt.sign(payload,process.env.SECRET_KEY,{
        expiresIn:3600
    })
};

exports.verifyJwtToken=(token)=>{
    return jwt.verify(token,process.env.SECRET_KEY);
}

exports.decodeJwtToken=(token)=>{
    return jwt.decode(token, {complete: true});
}

var opts = {}
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = process.env.SECRET_KEY;

exports.jwtPassport= passport.use(new JwtStrategy(opts,(jwt_payload,done)=>{
    console.log("JWT Payoad is "+jwt_payload);
    User.findOne({_id:jwt_payload._id},(err,user)=>{
        if(err){
            return done(err,false);
        }
        else if(user){
            return done(null,user);
        }
        else{
            return done(null,false);
        }
    });
}));

exports.verifyUser= passport.authenticate('jwt',{session:false});

exports.verifyAdmin=(req,res,next)=>{
    console.log(req.user);
    if(!req.user.admin)
    {
        var err= new Error("You are not authorized for this operation");
        err.status=403;
        return next(err);
    }
    else{
        next();
    }
};


exports.verifyCommentOwnership=(req,res,next)=>{
    console.log(req.user);
    let userId= req.user._id;
    let videoId= req.params.videoId;
    
    Video.findById(videoId).then((video)=>{
        
        console.log(video);
        let particularComment= video.comments.id(req.params.commentId);
        console.log(particularComment);
        if(particularComment.author.equals(userId))
        {
            console.log("Comment Ownership approved");
            next();
        }
        else{
            
            console.log("Comment Ownership not approved");
            let err= new Error("You are not authorized to do this operation");
            err.status=403;
            return next(err);

            
        }
    });

}

exports.verifyClickOwnership=(req,res,next)=>{
    console.log(req.params.videoId);
    let userId=req.user._id;
    console.log(userId);
    Video.findById(req.params.videoId).then((video)=>{
        console.log(video);
        if(video.uploader.equals(userId))
        {
            console.log("Ownership verified");
            next();
        }
        else{
            var err= new Error("You are not authorized for this operation");
            err.status=403;
            return next(err);
        }
    }).catch((err)=>{
        next(err);
    });
    
};




