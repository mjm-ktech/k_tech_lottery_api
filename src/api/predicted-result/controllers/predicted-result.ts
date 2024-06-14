/**
 * predicted-result controller
 */

import { factories } from "@strapi/strapi";
import _ from "lodash";
import moment from "moment-timezone";
function processString(input) {
  return _.replace(_.toLower(_.trim(input)), /\s+/g, "");
}
function formatDateTimeToVietnamTime(dateTime) {
  // Chuyển đổi và định dạng ngày giờ với múi giờ Việt Nam (Asia/Ho_Chi_Minh)
  return moment(dateTime).tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD');
}
export default factories.createCoreController(
  "api::predicted-result.predicted-result",
  ({ strapi }) => ({
    create: async (ctx) => {
      const { predicted_result, tele_id } = ctx.request.body;
      if (!predicted_result) {
        return ctx.badRequest("Missing required predicted_result");
      }

      if (!tele_id) {
        return ctx.badRequest("Missing required tele_id");
      }
      let dateTime = new Date();
      let formattedDateTime = formatDateTimeToVietnamTime(dateTime);
      // format date into YYYY-MM-DD
      if (formattedDateTime === "Invalid date" || !formattedDateTime) {
        return ctx.badRequest("INVALID_DATE", "date format is YYYY-MM-DD");
      }
      const newPredictedResult = await strapi.entityService.create(
        "api::predicted-result.predicted-result",
        {
          data: {
            tele_id: tele_id,
            predicted_result: predicted_result,
            date: formattedDateTime
          },
        }
      );
      return newPredictedResult;
    },

    async getStatisticByUserId(ctx) {
      let { tele_id } = ctx.params;
      if (!tele_id) {
        return ctx.badRequest("Missing tele_id");
      }
      const predictedResults = await strapi.entityService.findMany(
        "api::predicted-result.predicted-result",
        {
          filters: {
            tele_id: tele_id,
          },
          sort: "date:desc",
        }
      );

      const lotteryResults = await strapi.entityService.findMany(
        "api::lottery-result.lottery-result"
      );

      // map predictedResult with lotteryResult by field date
      const predictedResultWithLotteryResult = predictedResults.map(
        (predictedResult) => {
          const lotteryResultWithSameDate = lotteryResults.find(
            (lotteryResult) => predictedResult.date === lotteryResult.date
          );
          return {
            ...predictedResult,
            official_result: lotteryResultWithSameDate
              ? lotteryResultWithSameDate.result
              : null,
          };
        }
      );

      return predictedResultWithLotteryResult;
    },

    async getStatistic(ctx) {
      let { type } = ctx.params;
      if (!type) {
        type = "week";
      } else {
        type = processString(type);
      }

      const result = await strapi.entityService.findMany(
        "api::predicted-result.predicted-result",
        {}
      );
    },

    async find(ctx) {
      // validateQuery throws an error if any of the query params used are inaccessible to ctx.user
      // That is, trying to access private fields, fields they don't have permission for, wrong data type, etc
      await this.validateQuery(ctx);

      // sanitizeQuery silently removes any query params that are invalid or the user does not have access to
      // It is recommended to use sanitizeQuery even if validateQuery is used, as validateQuery allows
      // a number of non-security-related cases such as empty objects in string fields to pass, while sanitizeQuery
      // will remove them completely
      const sanitizedQueryParams = await this.sanitizeQuery(ctx);

      // Perform whatever custom actions are needed
      const { results, pagination } = await strapi
        .service("api::predicted-result.predicted-result")
        .find(sanitizedQueryParams);

      // transformResponse correctly formats the data and meta fields of your results to return to the API
      // sanitizeOutput removes any data that was returned by our query that the ctx.user should not have access to
      const lotteryResults = await strapi.entityService.findMany(
        "api::lottery-result.lottery-result"
      );
      // map predictedResult with lotteryResult by field date
      const predictedResultWithLotteryResult = results.map(
        (predictedResult) => {
          const lotteryResultWithSameDate = lotteryResults.find(
            (lotteryResult) => predictedResult.date === lotteryResult.date
          );
          return {
            ...predictedResult,
            official_result: lotteryResultWithSameDate
              ? lotteryResultWithSameDate.result
              : null,
          };
        }
      );
      // transformResponse correctly formats the data and meta fields of your results to return to the API
      return this.transformResponse(predictedResultWithLotteryResult, { pagination });
    },
  })
);
