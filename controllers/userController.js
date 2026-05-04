import bcrypt from "bcrypt"
import { prisma }  from "../models/db.js";
import { redis } from "../models/redis.js";

import * as authService from "../services/authService.js"


export const login = async (req, res) => {
  try {

    const result = await authService.login(req.body);

    return res.status(200).json(result);

  } catch (error) {

    return res.status(error.status || 500).json({
      message: error.message || "Internal Server Error"
    });

  }
};

export const sendOtp = async (req, res) => {
  try {
    const { mobile } = req.body;

    if (!mobile) {
      return res.status(400).json({
        message: "Mobile is required",
      });
    }

    // ✅ Extract IP
    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.socket.remoteAddress;

    // ✅ Extract Device ID (frontend must send this)
    const deviceId = req.headers["x-device-id"] || "unknown-device";

    // ✅ Extract Country (if using Cloudflare)
    const country = req.headers["cf-ipcountry"] || "unknown";

    const result = await authService.sendOtp({
      mobile,
      ip,
      deviceId,
      country,
    });

    return res.status(200).json(result);

  } catch (error) {
    return res.status(error.status || 500).json({
      message: error.message || "Internal Server Error",
    });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { mobile, otp } = req.body;

    if (!mobile || !otp) {
      return res.status(400).json({
        message: "Mobile and OTP are required",
      });
    }

    const result = await authService.verifyOtp({
      mobile,
      otp,
    });

    return res.status(200).json(result);

  } catch (error) {
    return res.status(error.status || 500).json({
      message: error.message || "Internal Server Error",
    });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const result = await authService.refreshToken(
      req.body.refreshToken
    );
    return res.status(200).json(result);
  } catch (error) {
    return res.status(error.status || 500).json({
      message: error.message || "Internal Server Error",
    });
  }
};

export const logout = async (req, res) => {
  try {
    const result = await authService.logout(
      req.body.refreshToken
    );

    res.status(200).json(result);

  } catch (error) {
    res.status(error.status || 500).json({
      message: error.message || "Internal Server Error",
    });
  }
};

// no otp 
export const registerUser = async(req,res)=>
{
    try {

        const {firstname,lastname,email,mobile,password,conform_password}=req.body;
        
        // vaildation at server side

        // check required field
        if (!firstname || !email || !mobile || !password || !conform_password) 
        {
            return res.status(400).json({ message: "Missing required fields" });
        }

        // conform password 
        if( password != conform_password)
        {
            return res.status(400).json({ message: "Password and Conform Password must be same" });
        }


        // validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email))
        {
            return res.status(400).json({ message: "Invalid email format" });
        }
         
        
        //validate mobile number
        const dbmobile ="+91"+mobile;
        const mobileRegex = /^\+[1-9]\d{9,14}$/;
        if (!mobileRegex.test(dbmobile))
        {
            return res.status(400).json({ message: "Invalid mobile format" });
        }

        //check for strong password
        const passwordRegex =/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
        if (!passwordRegex.test(password))
        {
            return res.status(400).json({message:"Password must be 8+ chars with uppercase, lowercase, number and special character"});
        }

        // check if user already exists
        const existingUser = await prisma.User.findFirst({
            where: {
            OR: [{ email }, {mobile_number: dbmobile }],
            }
        });

        if (existingUser) {
            return res.status(409).json({ message: "User already exists" });
        }

        // genrete salt 
        const salt = await bcrypt.genSalt(16);

        // hashing password
        const hashedPassword = await bcrypt.hash(password,salt);
    
        //save user
        const user = await prisma.User.create({
            data: {
                first_name: firstname,
                last_name: lastname,
                email,
                mobile_number:dbmobile,
                salt,
                password_hash: hashedPassword,
                last_login: new Date()
            }
        });

        return res.status(201).json({
            message: "User registered successfully",
            user_id: user.user_id,
        });
        
    } catch (error)
    {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export const startRegister = async (req, res) => {
  try {
    const { firstname, lastname, email, mobile, password, conform_password } = req.body;

    if (!firstname || !email || !mobile || !password || !conform_password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (password !== conform_password) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    // validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email))
        {
            return res.status(400).json({ message: "Invalid email format" });
        }
         
        
        //validate mobile number
        const dbmobile ="+91"+mobile;
        const mobileRegex = /^\+[1-9]\d{9,14}$/;
        if (!mobileRegex.test(dbmobile))
        {
            return res.status(400).json({ message: "Invalid mobile format" });
        }

        //check for strong password
        const passwordRegex =/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
        if (!passwordRegex.test(password))
        {
            return res.status(400).json({message:"Password must be 8+ chars with uppercase, lowercase, number and special character"});
        }

    // check existing user
    const existingUser = await prisma.User.findFirst({
      where: {
        OR: [{ email }, { mobile_number: dbmobile }],
      },
    });

    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    // hash password
    const salt = await bcrypt.genSalt(16);
    const hashedPassword = await bcrypt.hash(password, salt);

    // ✅ STORE TEMP USER
    await redis.set(
      `register:${email}`,
      JSON.stringify({
        firstname,
        lastname,
        email,
        mobile: dbmobile,
        password_hash: hashedPassword,
        salt,
      }),
      "EX",
      300
    );

    // ✅ CALL YOUR EXISTING EMAIL OTP FUNCTION
    await authService.sendEmailOtp({
      email,
      ip: req.ip,
      deviceId: req.headers["x-device-id"] || "web",
    });

    return res.status(200).json({
      message: "OTP sent to email",
    });

  } catch (error) {
    return res.status(error.status || 500).json({
      message: error.message || "Internal Server Error",
    });
  }
};

export const verifyRegister = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        message: "Email and OTP required",
      });
    }

    // ✅ Verify OTP (reuse your function)
    await authService.verifyEmailOtp({ email, otp });

    // ✅ Get temp user
    const data = await redis.get(`register:${email}`);

    if (!data) {
      return res.status(400).json({
        message: "Registration expired. Try again",
      });
    }

    const userData = JSON.parse(data);

    // ✅ Save to DB
    const user = await prisma.User.create({
      data: {
        first_name: userData.firstname,
        last_name: userData.lastname,
        email: userData.email,
        mobile_number: userData.mobile,
        password_hash: userData.password_hash,
        salt: userData.salt,
        last_login: new Date(),
      },
    });

    // ✅ Clean Redis
    await redis.del(`register:${email}`);

    return res.status(201).json({
      message: "User registered successfully",
      user_id: user.user_id,
    });

  } catch (error) {
    return res.status(error.status || 500).json({
      message: error.message || "Internal Server Error",
    });
  }
};

export const sendEmailOtpController = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.socket.remoteAddress;

    const deviceId = req.headers["x-device-id"] || "unknown-device";

    const result = await authService.sendEmailOtp({
      email,
      ip,
      deviceId,
    });

    return res.status(200).json(result);

  } catch (error) {
    return res.status(error.status || 500).json({
      message: error.message || "Internal Server Error",
    });
  }
};

export const verifyEmailOtpController = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        message: "Email and OTP are required",
      });
    }

    const result = await authService.verifyEmailOtp({
      email,
      otp,
    });

    return res.status(200).json(result);

  } catch (error) {
    return res.status(error.status || 500).json({
      message: error.message || "Internal Server Error",
    });
  }
};

export const forgotPassword = async (req, res) => {
  try {

    const { email } = req.body;

    const result = await authService.forgotPassword({
      email,
      ip: req.ip,
      deviceId: req.headers["device-id"]
    });

    res.status(200).json(result);

  } catch (error) {

    res.status(error.status || 500).json({
      message: error.message
    });

  }
};

export const resetPassword = async (req, res) => {
  try {

    const { email, otp, newPassword } = req.body;

    const result = await authService.resetPassword({
      email,
      otp,
      newPassword
    });

    res.status(200).json(result);

  } catch (error) {

    res.status(error.status || 500).json({
      message: error.message || "Internal Server Error"
    });

  }
};

export const changePassword = async (req, res) => {
  try {

    const { oldPassword, newPassword } = req.body;

    const result = await authService.changePassword({
      userId: req.user.user_id,   // from JWT middleware
      oldPassword,
      newPassword
    });

    res.status(200).json(result);

  } catch (error) {

    res.status(error.status || 500).json({
      message: error.message || "Internal Server Error"
    });

  }
};

