const mongoose = require('mongoose');
const subSection =new mongoose.Schema({

title:{
    type:String,
    required:true,

},
timeDuration:{
    type:String,

},
description:{
    type:String,
      required:true,
    trim:true,
},
videoUrl:{
    type:String,


},
    

});

module.exports = mongoose.model("SubSection",subSection)