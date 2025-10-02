const Course = require("../Models/Course");
const Category = require("../Models/Category");
const User = require("../Models/User");
const mongoose = require("mongoose");

const {uploadImageToCloudinary}= require("../utils/imageUploader");
require("dotenv").config();


exports.createCourse=async(req,res)=>{

    try{
        // fetch data
           const userId =req.user.id;

        const {courseName,courseDescription,whatYouWillLearn,price,tags,category} =req.body;

        //get thumbm=nail 
        const thumbnail= req.files?.thumbnailImage;

        //validation

        if(!courseName||!courseDescription||!price||!tags||!whatYouWillLearn||!category||!thumbnail){

            return res.status(400).json({
                success:false,
                message:"All fields are required",
            });
        }
       

        //check for instructor-->kyu maarni pd rhi hai ye call?
        //course ke andar ek insttructor ki object id store krni padti hai

     
        const instructorDetails = await  User.findById(userId);
       
        if (!instructorDetails || instructorDetails.accountType !== "Instructor") {
          return res.status(404).json({
             success:false,
              message:"Instructor Details not found" 
            });
}
        console.log("Instructor Details: ",instructorDetails);

        if(!instructorDetails){
              return res.status(404).json({
                success:false,
                message:"Instructor Details not found",
            });

        }

        // check given tag is valid or not
       const categoryDetails = await Category.findById(category);
         if(!categoryDetails){
              return res.status(404).json({
                success:false,
                message:"Category Details not found",
            });

        }

        //upload image to cloudinary
        const thumbnailImage = await uploadImageToCloudinary(thumbnail,process.env.FOLDER_NAME);

        //create an entry for new course

        const newCourse = await Course.create({
            courseName,
            courseDescription,
            instructor:instructorDetails._id,
            whatYouWillLearn:whatYouWillLearn,
            price:price,
            category:categoryDetails._id,
            tags:tags,
            thumbnail:thumbnailImage.secure_url,
      
        })

        //add the new course to the user scema of instructor
        await User.findByIdAndUpdate(
            {_id:instructorDetails._id},
        {$push:{ courses:newCourse._id  } },
    {new:true},
);

//update tag schema

await Category.findByIdAndUpdate(
  { _id: categoryDetails._id },
  { $addToSet: { courses: newCourse._id } },   // or $addToSet to avoid duplicates
  { new: true }
);


return res.status(200).json({
    success:true,
    message:"Course has been created successfully",
    data:newCourse,
})






    }
    catch(error){

        console.log(error);
        return res.status(500).json({
    success:false,
    message:"Trouble creating the course",
});


    }


}


//getAllCourses

exports.getAllCourses =async(req,res)=>{
    try{
        const allCourses = await Course.find({},{courseName:true,
            price:true,
            thumbnail:true,
            instructor:true,
            ratingAndReviews:true,
            students:true,
           

        }) .populate("instructor")
        .exec();

        
return res.status(200).json({
    success:true,
    message:" All Course has been fetched successfully",
    data:allCourses,
})




    }
    catch(error){

                console.log(error);
        return res.status(500).json({
    success:false,
    message:"Trouble fetching the courses",
});


    }
}


//getCourseDetails

exports.getCourseDetails = async (req, res) => {
  try {
    const { courseId } = req.body;

    // Validate id
    if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ success: false, message: "Valid courseId is required" });
    }

    // Fetch + populate
    const courseDetails = await Course.findById(courseId)
      .populate({
        path: "instructor",                 // ✅ correct spelling
        select: "-password -token",
        populate: { path: "additionalDetails" },
      })
      .populate("category")
      .populate("ratingAndReviews")        // ✅ plural, matches your schema
      .populate({
        path: "courseContent",
        populate: { path: "subSection" },
      })
      .exec();

    if (!courseDetails) {
      return res.status(404).json({
        success: false,
        message: `Could not find the course with id ${courseId}`,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Course details fetched successfully",
      data: courseDetails,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error fetching the Course Details",
    });
  }
};
