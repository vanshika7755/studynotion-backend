
const Profile = require("../Models/Profile");
const User = require("../Models/User");
const Course = require("../Models/Course");
const { uploadImageToCloudinary } = require("../utils/imageUploader");
exports.updateProfile= async(req,res)=>{
    try{
        //get data
        const{dateOfBirth="",about="",contactNum,gender} = req.body;

        //get userid
        const id =req.user.id;
        //validaton
        if(!contactNum||!gender||!id){
            return res.status(500).json({
            success:false,
            message:"Fill all the necessary details",
        });
        }

        //find profile
        const userDetails = await User.findById(id);
        const profileId = userDetails.additionalDetails;
        const profileDetails = await Profile.findById(profileId);


        //update profile
       profileDetails.dateOfBirth= dateOfBirth;
       profileDetails.about=about;
       profileDetails.contactNum=contactNum;
       profileDetails.gender=gender;
       await profileDetails.save();
        //return response
        return res.status(200).json({
             success:true,
            message:"Profile has been updated", 
            profileDetails,
            
        })



    }catch(error){
        console.log(error);
        return res.status(500).json({
            success:false,
            message:"There has been an error in updating the Profile",
        })
    }
}


exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const user = await User.findById(userId).select("additionalDetails courses");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // (optional but recommended) remove user from enrolled courses
    if (Array.isArray(user.courses) && user.courses.length) {
      await Course.updateMany(
        { _id: { $in: user.courses } },
        { $pull: { students: userId } }
      );
    }

    // delete profile doc
    if (user.additionalDetails) {
      await Profile.findByIdAndDelete(user.additionalDetails); // ✅ use Profile model
    }

    // delete user doc
    await User.findByIdAndDelete(userId);

    // (optional) clear auth cookie
    res.clearCookie("token");

    return res.status(200).json({
      success: true,
      message: "Account has been deleted",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message || "There has been an error in deleting the Account",
    });
  }
};


exports.getAllUserDetails= async(req,res)=>{
    try{
        const id = req.user.id;
        const userDetails  = await User.findById(id).populate("additionalDetails").exec();


   

         return res.status(200).json({
            success:true,
            message:"User Data Fetched Successfully", 
            userDetails,
            
        });
     }


    
    catch(error){
           console.log(error);
        return res.status(500).json({
            success:false,
            message:"There has been an error in fetching the AccountDetails",
        })


    }
}


exports.updateDisplayPicture = async (req, res) => {
    try {
      const displayPicture = req.files.displayPicture
      const userId = req.user.id
      const image = await uploadImageToCloudinary(
        displayPicture,
        process.env.FOLDER_NAME,
        1000,
        1000
      )
      console.log(image)
      const updatedProfile = await User.findByIdAndUpdate(
        { _id: userId },
        { image: image.secure_url },
        { new: true }
      )
      res.send({
        success: true,
        message: `Image Updated successfully`,
        data: updatedProfile,
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      })
    }
};
  
exports.getEnrolledCourses = async (req, res) => {
    try {
      const userId = req.user.id
      const userDetails = await User.findOne({
        _id: userId,
      })
        .populate("courses")
        .exec()
      if (!userDetails) {
        return res.status(400).json({
          success: false,
          message: `Could not find user with id: ${userDetails}`,
        })
      }
      return res.status(200).json({
        success: true,
        data: userDetails.courses,
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      })
    }
};