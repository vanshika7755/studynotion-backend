const Section = require("../Models/Section");
const Course = require("../Models/Course");


exports.createSection = async (req, res) => {
  try {
    //fetch data
    const { sectionName, courseId } = req.body;
    //validate data
    if (!sectionName || !courseId) {
      return res.status(400).json({
        success: false,
        message: "Fill all the necessary Details",
      });
    }

     const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }
    //create section
    const newSection = await Section.create({ sectionName });

    //update course
    const updatedCourse = await Course.findByIdAndUpdate(
      courseId,
      {
        $push: {
          courseContent: newSection._id,
        },
      },
      { new: true }
    ).populate({
				path: "courseContent",
				populate: {
					path: "subSection",
				},
			})
			.exec();


     return res.status(200).json({
      success: true,
      message: "section created successfully",
      updatedCourse,

    });


  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "there was an error creating the section",
    });
  }
};


exports.updateSection= async(req,res)=>{

  try{
       //fetch data
    const { sectionName, sectionId } = req.body;
    //validate data
    if (!sectionName || !sectionId) {
      return res.status(400).json({
        success: false,
        message: "Fill all the neccesaty Details",
      });
    }

    const updateSection = await Section.findByIdAndUpdate(
        sectionId,
        {sectionName},
        {new:true}
    );

      return res.status(200).json({
      success: true,
      message: "section updated successfully",
      updateSection,

  });


}catch(error){
     console.log(error);
    return res.status(500).json({
      success: false,
      message: "There was an error updating the section",
    });

}
}

exports.deleteSection = async(req,res)=>{
    try{
       //assuming we are sending ID in param
       const {sectionId}= req.params;


      //deleting
      await Section.findByIdAndDelete(sectionId);

      //course se delte 
        const parentCourse = await Course.findOne({ courseContent: sectionId });
    const parentCourseId = parentCourse ? parentCourse._id : null;

       return res.status(200).json({
      success: true,
      message: "section deleted successfully",
 
       });

    }
    catch(error){
          console.log(error);
    return res.status(500).json({
      success: false,
      message: "There was an error deleting the section",
    });

    }
}