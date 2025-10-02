const mongoose = require('mongoose');
const mailSender= require("../utils/mailSender");
const emailTemplate= require("../Controllers/mail/templates/emailVerification");
const otpSchema =new mongoose.Schema({
 

    email:{
        type:String,
        required:true,
    },
    otp:{
        type:String,
        required:true,
    },
    createdAt:{
        type:Date,
        default:Date.now,
        expires: 5*60,
    }
    

});


//function -to send email

async function sendVerificationEmail(email,otp){
    try{

        const mailResponse =await mailSender(email,
            "Verification Email from StudyNotion", 
           emailTemplate(otp),
            );

        console.log("Email sent successfully: ",mailResponse.messageId);

    }
    catch(error){
        console.log("error occured while sending mail:" ,error);
        throw error; 
    }
}

otpSchema.pre("save",async function(next){
   
   try{
    await sendVerificationEmail(this.email,this.otp);
    next();

   } 
     

catch (error) {
        next(error); 
}
    });

module.exports = mongoose.model("OTP",otpSchema);