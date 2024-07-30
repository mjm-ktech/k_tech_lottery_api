import moment from "moment-timezone";
export default {
  CreateLotteryResult: {
    task: async ({ strapi }) => {
      try {
        strapi.log.debug("CreateLotteryResult is running");
        await strapi
          .service("api::lottery-result.lottery-result")
          .createByExcel();
      } catch (e) {
        strapi.log.error(e);
      }
    },
    options: {
      rule: "0 50 23 * * *",
      tz: "Asia/Ho_Chi_Minh",
    },
  },

  createRatingWithDay: {
    task: async ({ strapi }) => {
      try {
        strapi.log.debug("createRatingWithDay job is running");
        await strapi.service("api::rating.rating").createRatingWithDay();
      } catch (e) {
        strapi.log.error(e);
      }
    },
    options: {
      rule: "0 53 23 * * * ",
      tz: "Asia/Ho_Chi_Minh",
    },
  },

  createRatingWithWeek: {
    task: async ({ strapi }) => {
      try {
        strapi.log.debug("createRatingWithWeek job is running");
        await strapi.service("api::rating.rating").createRatingWithWeek();
      } catch (e) {
        strapi.log.error(e);
      }
    },
    options: {
      rule: "* 55 23 * * 0",
      tz: "Asia/Ho_Chi_Minh",
    },
  },

  createRatingWithMonth: {
    task: async ({ strapi }) => {
      try {
        const today = moment().tz("Asia/Ho_Chi_Minh");
        const endOfMonth = today.clone().endOf("month").format("YYYY-MM-DD");

        // Kiểm tra nếu hôm nay là ngày cuối cùng của tháng
        if (today.format("YYYY-MM-DD") !== endOfMonth) {
          return;
        }
        strapi.log.debug("createRatingWithMonth job is running");
        await strapi.service("api::rating.rating").createRatingWithMonth();
      } catch (e) {
        strapi.log.error(e);
      }
    },
    options: {
      rule: "0 57 23 * * *",
      tz: "Asia/Ho_Chi_Minh",
    },
  },

  createLeaderTop: {
    task: async ({ strapi }) => {
      try {
        strapi.log.debug("createLeaderTop job is running");
        await strapi.service("api::rating.rating").createLeaderTop();
      } catch (e) {
        strapi.log.error(e);
      }
    },
    options: {
      rule: "0 59 23 * * *",
      tz: "Asia/Ho_Chi_Minh",
    },
  }
};
