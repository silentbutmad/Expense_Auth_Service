import { Eureka } from "eureka-js-client";

const PORT = process.env.PORT || 3000;

const eureka = new Eureka({

  instance: {
    app: "AUTH-SERVICE",
    hostName: "expense-auth-service-xofu.onrender.com",
    ipAddr: "0.0.0.0",

    port: {
      "$": 443,
      "@enabled": false
    },

    securePort:{
         "$": 443,
      "@enabled": true
    },

    vipAddress: "AUTH-SERVICE",

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