import bcrypt from "bcrypt"
import { prisma }  from "../models/db.js";




export const registerUser = async(req,res)=>
{
    try {

        const {firstname,lastname,email,mobile,password}=req.body;
        
        // vaildation at server side

        // check required field
        if (!firstname || !email || !mobile || !password) 
        {
            return res.status(400).json({ message: "Missing required fields" });
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