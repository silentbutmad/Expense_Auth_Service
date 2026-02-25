import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export const sendSmsOtp = async (mobile, otp) => {
  try {
    await client.messages.create({
      body: `Your OTP is ${otp}. It expires in 5 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: mobile,
    });
  } catch (error) {
    console.error("Twilio error:", error.message);
    throw {
      status: 500,
      message: "Failed to send OTP",
    };
  }
};