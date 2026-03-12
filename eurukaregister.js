// eureka-client.js
import { Eureka } from "eureka-js-client";

const eureka = new Eureka({
  instance: {
    app: "AUTH-SERVICE", // Must match Gateway lb://AUTH-SERVICE
    hostName: process.env.RENDER_EXTERNAL_HOSTNAME || "expense-auth-service-xofu.onrender.com",
    port: 443,           // HTTPS port on Render
    vipAddress: "AUTH-SERVICE",
    statusPageUrl: `https://${process.env.RENDER_EXTERNAL_HOSTNAME || "expense-auth-service-xofu.onrender.com"}/status`,
    healthCheckUrl: `https://${process.env.RENDER_EXTERNAL_HOSTNAME || "expense-auth-service-xofu.onrender.com"}/health`,
    dataCenterInfo: {
      name: "MyOwn",
      class: "com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo"
    }
  },
  eureka: {
    host: process.env.EUREKA_HOST || "eurekadiscoveryserver.onrender.com",
    port: 443,             // HTTPS
    servicePath: "/eureka/apps/",
    secure: true,          // MUST for HTTPS
  }
});

// Start Eureka client
eureka.start((error) => {
  if (error) console.error("Eureka registration failed:", error);
  else console.log("Auth service registered with Eureka!");
});

export default eureka;