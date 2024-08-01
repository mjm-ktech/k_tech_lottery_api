export default {
  routes: [
    {
      method: "GET",
      path: "/rating",
      handler: "rating.findByTeleId",
    },
    {
      method: "GET",
      path: "/rating/all",
      handler: "rating.findAll",
    },
  ],
};
