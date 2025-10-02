const User = require("../Models/User");
const mailSender = require("../utils/mailSender");
const crypto = require("crypto");
const bcrypt = require("bcrypt");

//reset password token

exports.resetPasswordToken = async (req, res) => {
  try {
    //get email from req body
    const { email } = req.body;

    //check user is valid or not
    if (!email) {
      return res.status(403).json({
        success: false,
        message: "Please  fill all the details",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(403).json({
        success: false,
        message: "User does not exist",
      });
    }

    //generate token

    const token = crypto.randomUUID();

    // update user by adding token and expiration time
    user.token = token;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
    await user.save({ validateBeforeSave: false });
    //create url

    const url = `https://localhost:3000/update-password/${token}`;

    //send email containing the url

    try {
      await mailSender(
        email,
        "Reset Password Link",
        `  <h2>Hello ${user.firstName || "there"},</h2>
          <p>Click the link below to reset your password. This link will expire in 15 minutes.</p>
          <p><a href="${url}">${url}</a></p>
          <p>If you did not request a password reset, you can safely ignore this email.</p>
          <br/>
          <p>Thanks,<br/>StudyNotion</p>
        `
      );

      return res.status(200).json({
        success: true,
        message: "Reset Link Sent to your email,please check email",
        token
      });
    } catch (error) {
      user.token = undefined;
      user.resetPasswordExpires = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        success: false,
        message: "There is a problem in send reset email",
      });
    }

    
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "There is a problem in Reseting the password",
    });
  }
};

//resetPassword

exports.resetPassword = async (req, res) => {
  try {
    //fetch data
    const { token, password, confirmPassword } = req.body;

    //validation
    if (!token || !password || !confirmPassword) {
      return res.status(403).json({
        success: false,
        message: "Please  fill all the details",
      });
    }

    if (password !== confirmPassword) {
      return res.status(403).json({
        success: false,
        message: "Passwords does not match,recheck or enter again",
      });
    }

    //usage of token-->token ka  use krke user ki enrty laenge
    const userDetails = await User.findOne({ token: token });

    //if no enetry of token -->invalid token
    if (!userDetails) {
      return res.status(403).json({
        success: false,
        message: "Invalid Token",
      });
    }
    if (userDetails.resetPasswordExpires < Date.now()) {
      return res.json({
        success: false,
        message: "Token isexpired ,please generate a new token and try again",
      });
    }
    //hah password
    const hashPassword = await bcrypt.hash(password, 10);
    //update password in db
    await User.findOneAndUpdate(
      { token: token },
      { password: hashPassword },
      { new: true }
    );

    //return response
    return res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: true,
      message: "Problem in resetting the password",
    });
  }
};
