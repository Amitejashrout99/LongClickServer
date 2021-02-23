var mongoose= require('mongoose');
var Schema= mongoose.Schema;

const userFavouriteSchema= new Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'
    },
    videos:[{
        type:[mongoose.Schema.Types.ObjectId],
        ref:'Video'
    }]
},{timestamps:true});

const userFavourites= mongoose.model('userFavourite',userFavouriteSchema);

module.exports=userFavourites;