import axios from "axios";

export const sendSmsOtp = async (mobile, otp) => {
  const message = `Your OTP is ${otp}. Valid for 5 minutes.`;

  try {
    const response = await axios.post(
      "https://api.textlocal.in/send/",
      new URLSearchParams({
        apikey: process.env.SMS_API_KEY,
        numbers: mobile,
        message: message,
        sender: process.env.SMS_SENDER,
        ...(process.env.SMS_TEMPLATE_ID && {
          template_id: process.env.SMS_TEMPLATE_ID,
        }),
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        timeout: 10000,
      }
    );

    console.log("SMS Response:", response.data);

    if (response.data.status !== "success") {
      throw new Error(
        response.data.errors?.[0]?.message || "SMS sending failed"
      );
    }

    return true;
  } catch (error) {
    console.error("SMS Error:", error.response?.data || error.message);
    throw error;
  }
};