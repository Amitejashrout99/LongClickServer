var express= require('express');
var bodyParser= require('body-parser');
var UserFavourites= require('../models/userFavourite');
var authenticate= require('../authenticate');

var favouriteRouter= express.Router();

favouriteRouter.use(bodyParser.json());

favouriteRouter.route('/userFavourite').get(authenticate.verifyUser,(req,res,next)=>{

    UserFavourites.findOne({user:req.user._id}).populate('videos').then((favourite)=>{
        if(favourite!=null)
        {
            res.statusCode=200;
            res.setHeader('Content-Type','Application/json');
            res.json({
                status:"Success",
                favourite:favourite
            });  
        }
        else{
            res.statusCode=404;
            res.setHeader('Content-Type','Application/json');
            res.json({
                status:"You currently don't have any favourites",
            });
        }
    })

});


//For checking whether a click is favourite or not//

favouriteRouter.route('/checkFavourite/:videoId').get(authenticate.verifyUser,(req,res,next)=>{
    UserFavourites.findOne({user:req.user._id}).then((favourite)=>{
        console.log(favourite.videos);
        if(favourite.videos.some((videoId)=>videoId.equals(req.params.videoId)))
        {
            res.statusCode=200;
            res.setHeader('Content-Type','Application/json');
            res.json({
                status:true,
            });
        }
        else{
            res.statusCode=200;
            res.setHeader('Content-Type','Application/json');
            res.json({
                status:false,
            });
        }
    }).catch((err)=>{
        next(err);
    });
})


//******* */

favouriteRouter.route('/removeFavourite/:videoId').delete(authenticate.verifyUser,(req,res,next)=>{

    UserFavourites.findOne({user:req.user._id}).then((favourite)=>{
        
        console.log(favourite);
        return favourite;

    }).then(favourite=>{

        if(favourite!=null && favourite.videos.length!=0)
        {
            
            let newFavouriteList=favourite.videos.filter(videoId=>videoId!=req.params.videoId);
            favourite.videos=newFavouriteList;
            favourite.save().then((favourite)=>{
                
                UserFavourites.findOne({user:req.user._id}).populate('videos').then((favourite)=>{
                    if(favourite!=null)
                    {
                        res.statusCode=200;
                        res.setHeader('Content-Type','Application/json');
                        res.json({
                            status:"Success",
                            message:"Favourite Deleted",
                            favourite:favourite
                        }); 
                    }
                    else{
                        res.statusCode=404;
                        res.setHeader('Content-Type','Application/json');
                        res.json({
                            status:"You currently don't have any favourites",
                        });
                    }
                }).catch((error)=>{
                    next(error)
                });

            }).catch((err)=>{
                next(err);
            });
        }
        else if(favourite.videos.length==0){

            var err= new Error("You have no favourite videos, Please add");
            err.status=404;
            return next(err);

        }
        else if(favourite==null){

            var err= new Error("No Favourite found for your account");
            err.status=404;
            return next(err);
        }
        else{

            var err= new Error("No Favourite found for this video id");
            err.status=404;
            return next(err);

        }

    }).catch((err)=>{

        next(err);

    });

});


favouriteRouter.route('/addFavourite/:videoId').post(authenticate.verifyUser,(req,res,next)=>{

    UserFavourites.findOne({user:req.user._id}).then((favourite)=>{
        
        if(favourite!=null)
        {
            let markedFavouriteVideos=favourite.videos;
            if(markedFavouriteVideos.some((videoId)=>req.params.videoId==videoId))
            {
                res.statusCode=409;
                res.setHeader('Content-Type','Application/json');
                res.json({
                    status:"You already marked this video as favourite"
                });
            }
            else{
                markedFavouriteVideos.push(req.params.videoId);
                favourite.videos= markedFavouriteVideos;
                favourite.save().then((favourite)=>{

                    UserFavourites.findOne({user:req.user._id}).populate('videos').then((favourite)=>{
                        if(favourite!=null)
                        {
                            
                            res.statusCode=200;
                            res.setHeader('Content-Type','Application/json');
                            res.json({
                                status:"Video added to favourites",
                                favourite:favourite
                            });  
                        }
                        else{
                            res.statusCode=404;
                            res.setHeader('Content-Type','Application/json');
                            res.json({
                                status:"You currently don't have any favourites",
                            });
                        }
                    }).catch((error)=>{
                        next(error)
                    });

                }).catch((error)=>{

                    next(error);

                });
            }
        }
        else
        {
            let newFavouriteObject={
                "user":"",
                "videos":[]
            };
            
            newFavouriteObject.user=req.user._id;
            newFavouriteObject.videos.push(req.params.videoId);

            UserFavourites.create(newFavouriteObject).then((favourite)=>{
                
                console.log(favourite);
                res.statusCode=200;
                res.setHeader('Content-Type','Application/json');
                res.json({
                    status:"Video added to favourites",
                    favourite:favourite
                });

            }).catch((error)=>{
                next(error);
            });
        
        }
    
    });

});

module.exports=favouriteRouter;


