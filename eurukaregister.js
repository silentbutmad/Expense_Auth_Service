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
    host: "eurekadiscoveryserver.onrender.com",
    port: 443,
    servicePath: "/eureka/apps/",
    secure: true
  }
});

eureka.start();