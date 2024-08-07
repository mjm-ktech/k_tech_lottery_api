/**
 * lottery-result controller
 */

import { factories } from "@strapi/strapi";
import moment from "moment-timezone";
export default factories.createCoreController(
  "api::lottery-result.lottery-result",
  ({ strapi }) => ({
    async create(ctx) {
      try {
        let { result, date, type } = ctx.request.body;

        if (!result || !date) {
          return ctx.badRequest("Missing required parameter");
        }
        // format date into YYYY-MM-DD
        date = moment(date).format("YYYY-MM-DD");
        if (date === "Invalid date" || !date) {
          return ctx.badRequest("INVALID_DATE", "date format is YYYY-MM-DD");
        }
        const lotteryResult = await strapi.entityService.findMany(
          "api::lottery-result.lottery-result",
          {
            filters: {
              date,
              type: "SPECIAL",
            },
          }
        );
        if (type === "SPECIAL" && lotteryResult.length > 0) {
          return ctx.badRequest(
            "ONE_DAY_ONE_SPECIAL_LOTTERY",
            "One day still is created 1 special lottery result"
          );
        }
        const newLotteryResult = await strapi.entityService.create(
          "api::lottery-result.lottery-result",
          {
            data: {
              result,
              date,
              type: type || "MEDIUM",
            },
          }
        );
        return newLotteryResult;
      } catch (e) {
        strapi.log.info(e);
        return ctx.badRequest(
          "ONE_DAY_ONE_LOTTERY",
          "One day still is created 1 lottery result"
        );
      }
    },

    async createByExcel(ctx) {
      try {
        strapi.service("api::lottery-result.lottery-result").createByExcel();
        return {
          message: "Chương trình đang bắt đầu tiến trình tạo kết quá xổ số miền Bắc"
        }
      } catch (e) {
        strapi.log.info(e);
      }
    },
  })
);
