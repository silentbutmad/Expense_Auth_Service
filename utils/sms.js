import axios from "axios";

export const sendSmsOtp = async (mobile, otp) => {
  try {
    const response = await axios.post(
      "https://api.msg91.com/api/v5/flow/",
      {
        template_id: process.env.MSG91_TEMPLATE_ID,
        short_url: "0",
        recipients: [
          {
            mobiles: mobile, 
            otp: otp,       
          },
        ],
      },
      {
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          authkey: process.env.MSG91_AUTH_KEY,
        },
        timeout: 10000,
      }
    );

    console.log("MSG91 Response:", response.data);

    return true;
  } catch (error) {
    console.error("MSG91 Error:", error.response?.data || error.message);
    throw error;
  }
};