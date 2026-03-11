// eureka-client.js
import { Eureka } from "eureka-js-client";

const eureka = new Eureka({
  instance: {
    app: "AUTH-SERVICE",
    hostName: "expense-auth-service-xofu.onrender.com",
    port: 443,
    vipAddress: "AUTH-SERVICE",
    statusPageUrl: "https://expense-auth-service-xofu.onrender.com/status",
    healthCheckUrl: "https://expense-auth-service-xofu.onrender.com/health",
    dataCenterInfo: {
      name: "MyOwn",
      class: "com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo"
    }
  },
  eureka: {
    host: "expense-discovery-xofu.onrender.com",
    port: 8761,
    servicePath: "/eureka/apps/"
  }
});

// Start the client
eureka.start((error) => {
  if (error) console.error(error);
  else console.log("Auth service registered with Eureka!");
});

export default eureka;