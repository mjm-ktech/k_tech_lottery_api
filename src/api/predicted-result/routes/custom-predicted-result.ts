export default {
  routes: [
    {
      method: "GET",
      path: "/get-statistics-by-user",
      handler: "predicted-result.getStatisticByUserId",
    },
    {
      method: "GET",
      path: "/get-statistic",
      handler: "predicted-result.getStatistic",
    },
  ],
};
