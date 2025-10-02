const mongoose = require('mongoose');
const reviewSchema =new mongoose.Schema({


   user:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User",
   },
   rating:{
    type:Number,
    required:true,
    default:0,
  min:0,
  max:5,

   },
   review:{
    type:String,
    required:true,
   },
   course: {
		type: mongoose.Schema.Types.ObjectId,
		required: true,
		ref: "Course",
		index: true,
	},

    

});

module.exports = mongoose.model("Rating",reviewSchema)