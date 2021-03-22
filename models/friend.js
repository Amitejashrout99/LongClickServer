var mongoose= require('mongoose');
var Schema= require('mongoose').Schema;

const messageSchema= new Schema({
    message:{
        type:Array,
        default:[]
    },
    sentBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'
    }
},{timestamps:true});


const friendSchema= new Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
    },
    messages:[messageSchema]

});

const friendsSchema= new Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'
    },
    friends:[friendSchema]
});

var Friends= mongoose.model('Friend',friendsSchema);

module.exports= Friends;