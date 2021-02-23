var mongoose= require('mongoose');
var Schema= mongoose.Schema;
var passportLocalMongoose= require('passport-local-mongoose');

const userSchema=new Schema({
    admin:{
        type:Boolean,
        default:false
    },
    firstname:{
        type:String,
        default:""
    },
    lastname:{
        type:String,
        default:""
    },
});

userSchema.plugin(passportLocalMongoose);

var Users= mongoose.model('User',userSchema);

module.exports=Users;