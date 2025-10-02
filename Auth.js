const User = require("../Models/User");
const OTP = require("../Models/otp");
const Profile = require("../Models/Profile");
const otpGenerator = require("otp-generator");
const bcrypt =require("bcrypt");
const jwt =require("jsonwebtoken");
require("dotenv").config();
const mailSender = require("../utils/mailSender");

const {passwordUpdated}= require("../Controllers/mail/templates/passwordUpdate");
  

//sendOTP

exports.sendOTP = async (req, res) => {
  try {
    //fetching email
    const { email } = req.body ||{};

       if (!email || typeof email !== "string") {
      return res.status(400).json({ success: false, message: "Valid email is required" });
    }

    //checking if user already exist
    const checkUser = await User.findOne({ email });

    //if already exist send message
    if (checkUser) {
      return res.status(401).json({
        success: false,
        message: "User already exists",
      });
    }

    //generate otp

    let otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    console.log("OTP Generated: ", otp);

    //check otp is unique or not
    let result = await OTP.findOne({ otp: otp });

    while (result) {
      otp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false,
      });
      result = await OTP.findOne({ otp: otp });
    }
    //creating entry in db

    const otpPayload = { email, otp };
    const otpBody = await OTP.create(otpPayload);
    console.log(otpBody);

    res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

//signup

 exports.signup= async(req,res)=>{
    try{
        const{firstName,lastName,email,password,confirmPassword,accountType,contactNum,otp} =req.body;


        //kuch data filled nhi hai

        if(!firstName||!lastName||!email||!password||!confirmPassword||!otp){
            return res.status(400).json({
                success:false,
                message:"All fields are required",
            })

        }

        //checking if password is same

        if(password!==confirmPassword){
             return res.status(400).json({
                success:false,
                message:"Password does not match, please try again",
            })
        }

        //checking for existing user
        const existingUser = await User.findOne({email});

        if(existingUser){
            return res.status(400).json({
                success:false,
                message:'User already exists',
            });


        }


        //find most recent otp

        const recentOTP = await OTP.find({email}).sort({createdAt:-1}).limit(1);
        console.log(recentOTP);

        if(recentOTP.length==0){
             return res.status(400).json({
                success:false,
                message:'OTP not found',
            })

        }
        else if(otp !==recentOTP[0].otp){
          // invalid otp
             return res.status(400).json({
                success:false,
                message:'Invalid OTP',
            })

        }
//hashing the password
        let hashPassword;
        try{
            hashPassword= await bcrypt.hash(password,10);

        }
        catch(err){
            return res.status(500).json({
                success:false,
                message:"unable to encrypt password"
            })
        }

        const profileDetails =await Profile.create({
            gender:null,
            dateOfBirth:null,
            about:null,
            contactNum:null,
        });
        //creating the user

          

        const user =await User.create({
           firstName,
           lastName,
           email,
           password:hashPassword,
           accountType,
           additionalDetails:profileDetails._id,
           image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`,


        });
         
        return res.status(200).json({
            success:true,
            message: "user created successfully",

        });



    }
    catch(error){

        console.log(error);

          return res.status(500).json({
                success:false,
                message:"user can not register pls try later"
            })
    }
 }




//login


 exports.login =async(req,res)=>{

    try{    
    const {email,password}=   req.body; 

    if(!email||!password ){
     
          return res.status(400).json({
                success:false,
                message:"Please fill all the details carefully",
            })

    }

    let user = await User.findOne({email});

    if(!user){
         return res.status(404).json({
                success:false,
                message:"Not an existing user plese sign up",
            })

    }

    //verify password and generate JWT token

    const payload ={
        email:user.email,
        id:user.id,
        accountType:user.accountType, 
    };


    if(await bcrypt.compare(password,user.password)){

        let token =jwt.sign(payload,
            process.env.JWT_SECRET,{
                expiresIn:"2h",
            });

            user.token =token;
            user.password= undefined;
            const options ={
                expires:new Date(Date.now()+3*24*60*60 *1000),
                httpOnly:true,
                 
            }

            //creting cookie

            res.cookie("token",token,options).status(200).json({
                success:true,
                token,
                user,
                message:"user loggged in succesfully"


            });

    }
    else{
         return res.status(401).json({
                success:false,
                message:"incorrect password",
            })
    }

        
    }
    catch(error){

        console.log(error);

          return res.status(500).json({
                success:false,
                message:"user can not login pls try later"
            })
    }
 }
  

//changepassword


exports.changePassword =async(req,res)=>{

  try{
    //fetch
    const userDetails = await User.findById(req.user.id);
     if (!userDetails) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    const {oldPass,newPass,confirmPass} = req.body;

    //validation
    if(!oldPass||!newPass||!confirmPass){

      return res.status(400).json({
        success:false,
        message:"Fill all the details",
      })
    }

    if(newPass===oldPass){
       return res.status(403).json({
        success:false,
        message:"New Password can't be same as Old password",
      })

    }
    if(newPass!==confirmPass){

      return res.status(400).json({
                success:false,
                message:'New Password does not match with confirm password',
            })
      
    }
  
  
    const isMatch = await bcrypt.compare(oldPass,userDetails.password);
    if(!isMatch){
      return res.status(401).json({
        success:false,
        message:"Old Password is Incorrect",
      });

    }
//hash and update password

userDetails.password = await bcrypt.hash(newPass,10);


await userDetails.save();

  try {
      await mailSender(
        userDetails.email,
        "Password Changed Successfully",
       passwordUpdated(userDetails.email,userDetails.firstName),
      )
    } 
    catch (err) {
      console.error("Failed to send confirmation email:", err.message);
     
    }

 return res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });

  }
  catch(error){

      console.log(error);

          return res.status(500).json({
                success:false,
                message:"facing difficulty in changing password"
            })

  }

  

}