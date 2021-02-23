const express= require('express');
const bodyParser= require('body-parser');
const Videos= require('../models/video');
const fs= require('fs');
const multer= require('multer');
var AWS= require('aws-sdk');
var authenticate= require('../authenticate');


var videoRouter= express.Router();
videoRouter.use(bodyParser.json());


const S3_Upload= new AWS.S3({
    accessKeyId:process.env.AWS_ID,
    secretAccessKey:process.env.AWS_SECRET
});

const S3_Download= new AWS.S3({
    accessKeyId:process.env.AWS_ID,
    secretAccessKey:process.env.AWS_SECRET,
    region:'ap-south-1'
});

const storage=multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null,'public/uploads');
    },
    filename:(req,file,cb)=>{
        cb(null,file.originalname);
    }
});

const upload= multer({
    storage:storage
});


videoRouter.route('/clickUpload').post(upload.single('videoSnap'),authenticate.verifyUser,(req,res,next)=>{
    console.log(req.file);
    console.log(req.user);
    
    let document= JSON.parse(req.body.document);

    console.log(document);
    
    let videoFile= req.file.originalname.split(".");
    let fileType= videoFile[videoFile.length-1];

    console.log(req.file.path);

    const params={
        Bucket:process.env.AWS_BUCKET_NAME,
        Key:`${videoFile[0]}.${fileType}`,
        Body:fs.createReadStream(req.file.path),
        ContentType:req.file.mimetype
    }

    S3_Upload.upload(params,(error,data)=>{
        if(error)
        {
            res.statusCode=500;
            res.setHeader('Content-Type','Application/json');
            res.json({
                status:"Error",
                error:error
            });
        }
        else{
            console.log(data);

            Videos.create({
                "title":document.title,
                "description":document.description,
                "category":document.category,
                "video":data.Location,
                "uploader":req.user._id,
                "comments":[]
            }).then((info)=>{
                res.statusCode=200;
                res.setHeader('Content-Type','Application/json');
                res.json({
                    status:"Successfully added to database",
                    data:data,
                    dbInfo:info
                }); 
            }).catch((err)=>next(err));
        }

    });
});

videoRouter.route('/clickDownload').get((req,res,next)=>{
    Videos.find({}).populate('comments.author').then((videos)=>{
        res.statusCode=200;
        res.setHeader('Content-Type','Application/json');
        res.json(videos);
    },(err)=>next(err)).catch((err)=>next(err));
});


videoRouter.route('/clickDownload/:videoId').get((req,res,next)=>{
    Videos.findById(req.params.videoId).then((video)=>{
        if(video===null)
        {   
            res.statusCode=404;
            res.setHeader('Content-Type','Application/json');
            res.json({
                status:"No video found for this id"
            });
        }
        else{

            let objectKey= video.video.split("/")[3];

            var getParams = {
                Bucket:process.env.AWS_BUCKET_NAME, // your bucket name,
                Key: objectKey // path to the object you're looking for
            };

            console.log(getParams);

            S3_Download.getSignedUrl('getObject',getParams,(error,url)=>{
                if(error)
                {
                    var err= new Error("Failed to get the signed url "+ error);
                    err.status=500;
                    throw next(err);
                }
                else{
                    res.statusCode=200;
                    res.setHeader('Content-Type','Application/json');
                    res.json({
                        status:"Signed URL Obtained",
                        url:url
                    });
                }
            })
        }
    },(err)=>next(err)).catch((err)=>next(err));
}).post((req,res,next)=>{
    
    res.statusCode=403;
    res.setHeader('Content-Type','Application/json');
    res.end("Post Operation not supported on this id");

}).put(authenticate.verifyUser,authenticate.verifyClickOwnership,(req,res,next)=>{

    Videos.findByIdAndUpdate(req.params.videoId,{$set:req.body},{new:true}).then((video)=>{
        console.log(video);
        res.statusCode=200;
        res.setHeader('Content-Type','Application/json');
        res.json({
            status:"Success",
            message:"Click Details Modified",
            video:video
        })
    },(err)=>{
        next(err);
    }).catch((err)=>{
        next(err);
    });

}).delete(authenticate.verifyUser,authenticate.verifyClickOwnership,(req,res,next)=>{

    Videos.findByIdAndRemove(req.params.videoId).then((resp) => 
    {
        res.statusCode = 200;
        res.setHeader('Content-Type','Application/json');
        res.json(resp);
    },(err) => next(err)).catch((err) => next(err));

});


videoRouter.route('/clickDownload/:videoId/comments').get((req,res,next)=>{
    Videos.findById(req.params.videoId).populate('comments.author').then((video)=>{
        if(video===null)
        {
            res.statusCode=404;
            res.setHeader('Content-Type','Application/json');
            res.json({
                message:"No Click found for this Id",
                status:"Failure"
            });
        }
        else{
            res.statusCode=200;
            res.setHeader('Content-Type','Application/json');
            res.json({
                status:"Success",
                comments:video.comments
            });
        }
    });
}).post(authenticate.verifyUser,(req,res,next)=>{

    Videos.findById(req.params.videoId).then((video)=>{
        if(video===null)
        {
            res.statusCode=404;
            res.setHeader('Content-Type','Application/json');
            res.json({
                message:"No Click found for this Id",
                status:"Failure"
            });
        }
        else{

            req.body.author=req.user._id;
            video.comments.push(req.body);
            video.save().then((video)=>{
                console.log("Comments Posted");
                Videos.findById(video._id).populate('comments.author').then((video)=>{
                    res.statusCode=200;
                    res.setHeader('Content-Type','Application/json');
                    res.json({
                        status:"success",
                        message:"Comment Posted",
                        comments:video.comments 
                    });
                }).catch((error)=>{
                    next(error)
                });
                
            });

        }
    });

}).put(authenticate.verifyUser,(req,res,next)=>{
    
    res.statusCode=403;
    res.setHeader('Content-Type','Application/json');
    res.end("Post Operation not supported on this id");

}).delete(authenticate.verifyUser,authenticate.verifyAdmin,(req,res,next)=>{

    Videos.findById(req.params.videoId).then((video)=>{
        console.log(video.comments);
        if(video!=null)
        {
            for (let i = (video.comments.length -1); i >= 0; i--) 
            {
                video.comments.id(video.comments[i]._id).remove();
            }
            video.save().then((video) => 
            {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'Application/json');
                res.json(video);                
            }, (err) => next(err));   
        }
        else
        {
            err= new Error('Video with id'+ req.params.videoId + " not found");
            err.status=404;
            return next(err);
        }
    }).catch((error)=>{
        next(err);
    });

});


videoRouter.route('/clickDownload/:videoId/comments/:commentId').get((req,res,next)=>{

    Videos.findById(req.params.videoId).then((video)=>{
        
        let particularComment=video.comments.id(req.params.commentId);
        console.log(particularComment);
        if(video!=null && particularComment!=null )
        {
            res.statusCode=200;
            res.setHeader('Content-Type','Application/json');
            res.json({
                status:"Success",
                comment:particularComment
            });
        }
        else if(video==null)
        {
            err = new Error('Video with ' + req.params.videoId + ' not found');
            err.status = 404;
            return next(err);
        }
        else{
            err = new Error('Comment with ' + req.params.commentId + ' not found');
            err.status = 404;
            return next(err);
        }
    
    }).catch((error)=>{
        next(error);
    
    });

}).post((req,res,next)=>{

    res.statusCode=403;
    res.setHeader('Content-Type','Application/json');
    res.end("Post Operation not supported on this id");

}).put(authenticate.verifyUser,authenticate.verifyCommentOwnership,(req,res,next)=>{

    console.log(req.body);
    Videos.findById(req.params.videoId).then((video)=>{
        
        let particularComment= video.comments.id(req.params.commentId);
        //console.log(particularComment);
        if(video!=null && particularComment!=null)
        {
            if(req.body.rating)
            {
                particularComment.rating=req.body.rating;
            }
            if(req.body.comment)
            {
                particularComment.comment= req.body.comment;
            }

            video.save().then((video)=>{
                
                Videos.findById(video._id).populate('comments.author').then((video)=>{
                    console.log(video);
                    res.statusCode=200;
                    res.setHeader('Content-Type','Application/json');
                    res.json({
                    status:"Success",
                    message:"Comment Updated",
                    comments:video.comments
                    });
                }).catch((error)=>{
                    next(error);
                });

            }).catch((error)=>{
                next(error);
            });
        }
        else if(video==null)
        {
            let err= new Error("No Video found for this Id");
            err.status=404;
            return next(err);
        }
        else{
            
            let err= new Error("No Comment found in this video for this Id");
            err.status=404;
            return next(err);
        
        }

    })

}).delete(authenticate.verifyUser,authenticate.verifyCommentOwnership,(req,res,next)=>{

    Videos.findById(req.params.videoId).then((video)=>{

        let particularComment= video.comments.id(req.params.commentId);
        console.log(particularComment);
        if(video!=null && particularComment!=null)
        {
            particularComment.remove();
            video.save().then((video)=>{
                
                res.statusCode=200;
                res.setHeader('Content-Type','Application/json');
                res.json({
                    status:"Success",
                    message:"Comment Deleted",
                    comments:video.comments
                });
           
            }).catch((error)=>{
                next(error);
            });
        }
        else if(video == null)
        {
            let err= new Error("Video of this Id Not found");
            err.status=404;
            return next(err);
        }
        else{

            let err= new Error("Comment of this Id Not found");
            err.status=404;
            return next(err);
        
        }

    });

});


module.exports=videoRouter;
