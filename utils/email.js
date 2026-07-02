import axios from "axios";

export const sendEmail = async (email, otp) => {
  console.log(`${email}, ${otp}`)
  console.log("BREVO KEY:", process.env.BREVO_API_KEY);
  try {
    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          name: "Your App",
          email: process.env.EMAIL_USER, // must be verified in Brevo
        },
        to: [{ email }],
        subject: "Your OTP Code",
        htmlContent: `
          <h2>Your OTP Code</h2>
          <h1>${otp}</h1>
          <p>Valid for 5 minutes</p>
        `,
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );

    console.log("Email sent successfully:", response.data);
  } catch (error) {
    console.error(
      "EMAIL ERROR:",
      error.response?.data || error.message
    );
    throw error;
  }
};