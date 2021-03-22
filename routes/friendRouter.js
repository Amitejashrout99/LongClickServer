var express= require('express');
var bodyParser= require('body-parser');
var authenticate= require('../authenticate');
var Friends= require('../models/friend');

var friendRouter= express.Router();
friendRouter.use(bodyParser.json());

friendRouter.route('/getAllFriends').get(authenticate.verifyUser,(req,res,next)=>{
    Friends.findOne({user:req.user._id}).then((friend)=>{
        if(friend==null)
        {
            res.statusCode=404;
            res.setHeader('Content-Type','application/json');
            res.json({
                status:"Success",
                message:"You have no friends",
                data:[]
            });
        }
        else{
            res.statusCode=200;
            res.setHeader('Content-Type','application/json');
            res.json({
                status:"Success",
                message:"Friend List Displayed",
                data:friend
            });
        }
    }).catch((error)=>{
        next(error);
    });
});

friendRouter.route('/addFriend/:userId').post(authenticate.verifyUser,(req,res,next)=>{
    Friends.findOne({user:req.user._id}).then((friend)=>{
        if(friend!=null)
        {
            console.log(friend);
            if(friend.friends.some((obj)=>obj.user.equals(req.params.userId)))
            {
                res.statusCode=409;
                res.setHeader('Content-Type','application/json');
                res.json({
                    status:"Failure",
                    message:"You have already added this friend",
                    data:friend
                });
            }
            else{
                let newFriend={
                    "user":req.params.userId,
                    "messages":[]
                };

                friend.friends.push(newFriend);
                friend.save().then((friend)=>{
                    
                    res.statusCode=200;
                    res.setHeader('Content-Type','application/json');
                    res.json({
                        status:"Success",
                        message:"Succesfully added to friend list",
                        data:friend
                    });
                }).catch((error)=>{
                    next(error);
                });
            }
        }
        else{
            Friends.create({
                "user":req.user._id,
                "friends":[]
            }).then((friend)=>{
                let newFriend={
                    "user":req.params.userId,
                    "messages":[]
                };

                friend.friends.push(newFriend);

                friend.save().then((friend)=>{
                    res.statusCode=200;
                    res.setHeader('Content-Type','application/json');
                    res.json({
                        status:"Success",
                        message:"Succesfully added to friend list",
                        data:friend
                    });
                }).catch((error)=>{
                    next(error);
                });
            }).catch((error)=>{
                next(error);
            });
        }
        
    }).catch((error)=>{
        next(error);
    });
});

friendRouter.route('/sendMessage/:friendId').post(authenticate.verifyUser,(req,res,next)=>{
    Friends.findOne({user:req.user._id}).then((friend)=>{

        let particularFriend= friend.friends.find((ele)=>ele.user.equals(req.params.friendId));
        console.log(particularFriend);
        if(particularFriend==null)
        {
            res.statusCode=404;
            res.setHeader('Content-Type','application/json');
            res.json({
                status:"Failure",
                message:"No Friend Found for this Id",
                data:friend
            });
        }
        else{
            let newMessage={
                "message":req.body.message,
                "sentBy":req.user._id
            };

            particularFriend.messages.push(newMessage);

            friend.save().then((friend)=>{
                res.statusCode=200;
                res.setHeader('Content-Type','application/json');
                res.json({
                    status:"Success",
                    message:"Message sent to the user",
                    data:friend
                }); 
            }).catch((error)=>{
                next(error)
            });
        }

    }).catch((error)=>{
        next(error);
    });
});

module.exports= friendRouter;


