require("dotenv").config();
const axios = require("axios");

async function apiPostRequestVideoMontageIsComplete(filename, user, token) {
  const url = `${process.env.URL_KV_API}/videos/montage-service/video-completed-notify-user`;
  console.log(`-----> [3] token: ${token}`);
  const requestData = {
    filename,
    user,
  };

  try {
    console.log(`📡 Sending API request to: ${url}`);
    console.log(`📨 Request Body:`, requestData);

    const response = await axios.post(url, requestData, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    console.log(`✅ API Response:`, response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error sending API request:", error.message);
    if (error.response) {
      console.error("📥 API Response Error Data:", error.response.data);
    }
    return null;
  }
}

module.exports = { apiPostRequestVideoMontageIsComplete };
