import pino from "pino";
import "dotenv/config";

// export const logger = pino({
//   enabled: process.env.LOG_ENABLED === "true",
//   level: "trace",
//   formatters: {
//     level: (label) => {
//       return {
//         label: label.toUpperCase(),
//         timestamp: new Date().toISOString(),
//       };
//     },
//   },
// });

// export const logger = pino({
//   enabled: process.env.LOG_ENABLED === "true",
//   level: "trace",
//   transport: {
//     target: "pino-pretty",
//     options: {
//       colorize: true,
//       translateTime: "SYS:yyyy-mm-dd HH:MM:ss.l",
//       ignore: "pid,hostname",
//     },
//   },
// });

// export const logger = pino({
//   enabled: process.env.LOG_ENABLED === "true",
//   level: "trace",
//   transport: {
//     target: "pino-pretty",
//     options: {
//       destination: "./logs/file/app.log",
//       mkdir: true,
//       colorize: false,
//       translateTime: "SYS:yyyy-mm-dd HH:MM:ss.l",
//       ignore: "pid,hostname",
//     },
//   },
// });

export const logger = pino({
  enabled: process.env.LOG_ENABLED === "true",
  level: "trace",
  transport: {
    targets: [
      {
        target: "pino-pretty",
        level: "trace",
        options: {
          colorize: true,
          translateTime: "SYS:yyyy-mm-dd HH:MM:ss.l",
          ignore: "pid,hostname",
        },
      },
      {
        target: "pino-pretty",
        level: "trace",
        options: {
          destination: "./logs/file/app.log",
          colorize: false,
          translateTime: "SYS:yyyy-mm-dd HH:MM:ss.l",
          mkdir: true,
          ignore: "pid,hostname",
        },
      },
      {
        target: "pino-mongodb",
        level: "error",
        options: {
          uri: "mongodb://127.0.0.1:27017/",
          database: "latihan",
          collection: "log-collection",
          colorize: true,
          translateTime: "SYS:yyyy-mm-dd HH:MM:ss.l",
          ignore: "pid,hostname",
        },
      },
    ],
  },
});
