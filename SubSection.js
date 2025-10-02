const SubSection= require("../Models/SubSection");
const Section =require("../Models/Section");
const mongoose = require("mongoose");
const {uploadImageToCloudinary} = require("../utils/imageUploader");


exports.createSubSection= async(req,res)=>{
    try{
        //fetch
        const {title,timeDuration,description,sectionId} =req.body;
        const video = req.files?.videoFile;

        
//imageUploader
        if(!title||!timeDuration||!description||!sectionId||!video){
            return res.status(400).json({
                success:false,
                message:"Fill all the necessary details",

            });
        }
    
        //img upload to cloudinary to get secure url
        const uploadDetails = await uploadImageToCloudinary(video,process.env.FOLDER_NAME);

        //create subsection
        const subSectionDetails = await SubSection.create({
            title:title,
            timeDuration:timeDuration,
            description:description,
            videoUrl:uploadDetails.secure_url,
        });

        const updatedSection = await Section.findByIdAndUpdate(sectionId,{$push:{subSection:subSectionDetails._id}},
            {new:true}
        )


        return res.status(200).json({
            success:true,
            message:"New subsection created",
            updatedSection,

        });

    }catch(error){

        
        return res.status(500).json({
            success:false,
            message:"Trouble creating subsection",
     

        })


    }
}

exports.updateSubSection = async(req,res)=>{

      try{
        //fetch
        const {title,timeDuration,description,subSectionId} =req.body;

          if (!subSectionId || !mongoose.Types.ObjectId.isValid(subSectionId)) {
      return res.status(400).json({ success: false, message: "Valid subSectionId is required" });
    }
        const video = req.files.videoFile;
//imageUploader
    
   
         //img upload to cloudinary to get secure url

const sub = await SubSection.findById(subSectionId);
    if (!sub) return res.status(404).json({ success: false, message: "Subsection not found." });

    if (title !== undefined) sub.title = title;
    if (timeDuration !== undefined) sub.timeDuration = timeDuration;
    if (description !== undefined) sub.description = description;

    if (video) {
      const up = await uploadImageToCloudinary(video, process.env.FOLDER_NAME);
      sub.videoUrl = up.secure_url; // keep key consistent
    }

    await sub.save(); // runs validators + save middleware

    // (Optional) return populated parent section
    const parent = await Section.findOne({ subSection: sub._id }).populate("subSection");
    
          return res.status(200).json({
          success: true,
          message: "section updated successfully",
          data: { subSection: sub, section: parent },
    
      });
    
    
    }catch(error){
         console.log(error);
        return res.status(500).json({
          success: false,
          message: "There was an error updating the section",
        });
    

}
}

exports.deleteSubSection = async(req,res)=>{
    try{
       //assuming we are sending ID in param
       const {subSectionId}= req.body;

         if (!subSectionId) {
      return res.status(400).json({
        success: false,
        message: "subSectionId is required in route params",
      });
    }


     const existing = await SubSection.findById(subSectionId);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "SubSection not found",
      });
    }


      const updatedSection = await Section.findOneAndUpdate(
      { subSection: subSectionId },       // or { subSections: subSectionId } if that's your field
      { $pull: { subSection: subSectionId } },
      { new: true }
    );

      //deleting
      await SubSection.findByIdAndDelete(subSectionId);

      //course se delte 
       
       return res.status(200).json({
      success: true,
      message: "SubSection deleted successfully",
            data: {
        deletedSubSectionId: subSectionId,
        updatedSectionId: updatedSection ? updatedSection._id : null,
      },

 
       });

    }
    catch(error){
          console.log(error);
    return res.status(500).json({
      success: false,
      message: "There was an error deleting the subsection",
    });

    }
}