module.exports = {
  filter(data) {
    return !!data.req;
  },
  output: {
    path: "app.log", //nama file dari log
    options: {
      path: "logs/file/", //path file
      size: "300B",
      interval: "5s", // interval rotasi 5 detik
      rotate: 5, // rotasi sebanyak 5
      compress: true,
    },
  },
};
