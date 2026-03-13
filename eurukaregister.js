import { Eureka } from "eureka-js-client";

const PORT = process.env.PORT || 8000;

const eureka = new Eureka({

  instance: {
    app: "AUTH-SERVICE",

    hostName: "expense-auth-service-xofu.onrender.com",
    ipAddr: "expense-auth-service-xofu.onrender.com",

    port: {
      "$": PORT,
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

    serviceUrls: {
      default: [
        "https://admin:admin123@eurekadiscoveryserver.onrender.com/eureka/apps/"
      ]
    },

    heartbeatInterval: 30000,
    registryFetchInterval: 30000,

    maxRetries: 3,
    requestRetryDelay: 2000
  }

});

export default eureka;