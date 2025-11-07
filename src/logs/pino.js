export const logger = pino({
  enabled: process.env.LOG_ENABLED === "true",
  level: process.env.LOG_LEVEL || "info",
  transport: {
    targets: [
      {
        target: "pino-pretty",
        level: "info",
        options: {
          colorize: true,
          translateTime: "SYS:yyyy-mm-dd HH:MM:ss.l",
          ignore: "pid,hostname",
        },
      },
      {
        target: "pino-pretty",
        level: "info",
        options: {
          destination: "./logs/file/app.log",
          mkdir: true,
          colorize: false,
          translateTime: "SYS:yyyy-mm-dd HH:MM:ss.l",
          ignore: "pid,hostname",
        },
      },
    ],
  },
});
