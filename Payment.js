const mongoose = require("mongoose");
const { instance } = require("../config/razorpay");
const Course = require("../Models/Course");
const User = require("../Models/User");
const mailSender = require("../utils/mailSender");
const {courseEnrollmentEmail}= require("../Controllers/mail/templates/courseEnrollmentMail");

// capture the payment and initiate the order
exports.capturePayment = async (req, res) => {
  try {
    const { course_id } = req.body;
    const userId = req.user.id; // will get user id in the form of string

    if (!course_id) {
      return res.status(400).json({
        success: false,
        message: "Please Provide Valid course ID",
      });
    }

    // check for validity of course and user
    let course;

    try {
      course = await Course.findById(course_id);
      if (!course) {
        return res.json({
          success: false,
          message: "Could not find the course",
        });
      }

      // check user ne same course to nhi buy kr rakha
      // convert the user id from string to object
      const uid = new ObjectId(userId);

   if (Array.isArray(course.students) && course.students.some(id => id.equals(uid))) {

  return res.status(409).json({
    success: false,
    message: "Student is already enrolled" });
}

    } catch (error) {
      console.log(error);
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
    const amount = course.price;
    const currency = "INR";

    //options object create

    const options = {
      amount: amount * 100,
      currency,
      receipt: Math.random(Date.now()).toString(),
      notes: {
        courseId: course_id,
        userId,
      },
    };
    //function call--> order create

    try {
      const paymentResponse = await instance.orders.create(options);
      console.log(paymentResponse);
      return res.status(200).json({
        success: true,
        courseName: course.courseName,
        courseDescription: course.courseDescription,
        thumbnail: course.thumbnail,
        orderId: paymentResponse.id,
        currency: paymentResponse.currency,
        amount: paymentResponse.amount,
      
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Could not create order",
    });
  }
};

//verify signature of Razorpay and Server

exports.verifySignature = async (req, res) => {
  const webhookSecret = "12345678";

  // ye signature req ke andar header ke saath send hota hai

  const signature = req.get("x-razorpay-signature") || req.headers["x-razorpay-signature"];


  const shasum = crypto.createHmac("sha256", webhookSecret);
  shasum.update(JSON.stringify(req.body));
  const digest = shasum.digest("hex");

  if (signature === digest) {
    console.log("Payment is authorized");

    const { courseId, userId } = req.body.payload.payment.entity.notes;

    try {
      //fullfilling the action--> find the course and enroll the student in it
      const enrolledCourse = await Course.findOneAndUpdate(
        { _id: courseId },
        { $push: { students: userId } },
        { new: true }
      );
      if (!enrolledCourse) {
        return res.status(500).json({
          success: false,
          message: "Course not found",
        });
      }

      console.log(enrolledCourse);

      // find the student and add the course to the list of enrolled courses

      const enrolledStudent = await User.findByIdAndUpdate(
         userId,
        { $push: { courses: courseId } },
        { new: true }
      );
      console.log(enrolledStudent);

      // mail send

      const emailResponse = await mailSender(
        enrolledStudent.email,
        "Course Enrollment Successful",
        courseEnrollmentEmail(course.courseName,enrolledStudent.firstName),
      );

      console.log(emailResponse);

      return res.status(200).json({
        success: true,
        message:
          "Signature has been verified and student has enrolled in the course",
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        success: false,
        message: "Signature has not been verified",
      });
    }
  }
};
