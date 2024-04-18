const mongoose=require('mongoose');

const plm=require('passport-local-mongoose')

// mongoose.connect('mongodb+srv://harshveer7828:NaCM177JdsP8dulB@cluster0.ppnm2pu.mongodb.net/Insatgram');
mongoose.connect('mongodb://0.0.0.0/Insatgram');

const userSchema=mongoose.Schema({
  username:String,
  password:String,
  fullname:String,
  dob:String,
  email:String,
  bio:String,
  profileImage:{
    type:String, 
    default:"default.jpg"
  },
  followers:[{
    type:mongoose.Schema.Types.ObjectId,
    ref:"user",
  }],
  following:[{
    type:mongoose.Schema.Types.ObjectId,
    ref:"user",
  }],
  posts:[{
    type:mongoose.Schema.Types.ObjectId,
    ref:"post",
  }],
  stories:[{
    type:mongoose.Schema.Types.ObjectId,
    ref:"story",
  }],
  savedPost:[
    {
      type:mongoose.Schema.Types.ObjectId,
      ref:"post"
    }
  ],
})
userSchema.plugin(plm);

module.exports =mongoose.model('user',userSchema);