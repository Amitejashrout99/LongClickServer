const mongoose= require('mongoose');
const Schema= mongoose.Schema;

const commentSchema= new Schema({
    rating:{
        type:Number,
        min:1,
        max:5
    },
    author:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'
    },
    comment:{
        type:String,
        default:""
    }
    
},{timestamps:true})



const videoSchema= new Schema({

    title:{
        type:String,
        default:"New Video",
        required:true
    },
    description:{
        type:String,
        default:"Ram",
        required:true
    },
    category:{
        type:String,
        required:true
    },
    video:{
        type:String,
    },
    uploader:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'
    },
    comments:[commentSchema]
},{timestamps:true});

const Videos= mongoose.model('Video',videoSchema);

module.exports=Videos;