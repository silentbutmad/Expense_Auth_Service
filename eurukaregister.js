import { Eureka } from "eureka-js-client";

const eureka = new Eureka({
  instance: {
    app: "AUTH-SERVICE",

    hostName: "expense-auth-service-xofu.onrender.com",
    ipAddr: "expense-auth-service-xofu.onrender.com",

    port: {
      "$": 443,
      "@enabled": true
    },

    vipAddress: "AUTH-SERVICE",

    statusPageUrl: "https://expense-auth-service-xofu.onrender.com/status",
    healthCheckUrl: "https://expense-auth-service-xofu.onrender.com/health",
    homePageUrl: "https://expense-auth-service-xofu.onrender.com",

    dataCenterInfo: {
      name: "MyOwn",
      "@class": "com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo"
    }
  },

  eureka: {
    host: "eurekadiscoveryserver.onrender.com",
    port: 443,
    servicePath: "/eureka/apps",
    ssl: true,

    auth: {
      user: "admin",
      password: "admin@123"
    }
  }
});

export default eureka;