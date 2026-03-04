import bcrypt from "bcrypt"
import { prisma }  from "../models/db.js";

import * as authService from "../services/authService.js"

export const login= async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1️⃣ Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required"
      });
    }

    // 2️⃣ Find user by email
    const user = await prisma.User.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    // 3️⃣ Compare password with stored password_hash
    const isMatch = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    // 4️⃣ Update last login
    await prisma.User.update({
      where: { user_id: user.user_id },
      data: {
        last_login: new Date()
      }
    });

    // 5️⃣ OPTIONAL: Send OTP for 2FA
    // await sendOtp({ mobile: user.mobile_number })

    return res.status(200).json({
      message: "Login successful",
      user_id: user.user_id,
      mobile: user.mobile_number
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error"
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