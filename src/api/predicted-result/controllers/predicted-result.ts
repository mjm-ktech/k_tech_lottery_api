/**
 * predicted-result controller
 */

import { factories } from "@strapi/strapi";
import _ from "lodash";
import moment from "moment-timezone";
import util from "util";

function processString(input) {
  return _.replace(_.toLower(_.trim(input)), /\s+/g, "");
}
function formatDateTimeToVietnamTime(dateTime) {
  return moment(dateTime).tz("Asia/Ho_Chi_Minh").format("YYYY-MM-DD");
}
function checkAndAdjustDateTime(dateTime) {
  let vietnamTime = moment(dateTime).tz("Asia/Ho_Chi_Minh");

  const thresholdTime = vietnamTime.clone().set({
    hour: 17,
    minute: 30,
    second: 0,
    millisecond: 0,
  });

  if (vietnamTime.isAfter(thresholdTime)) {
    vietnamTime = vietnamTime.add(1, "day");
  }

  return vietnamTime.format("YYYY-MM-DD");
}
function debug(name, object) {
  strapi.log.info("--------DEBUG--------");
  strapi.log.info(
    `${name}: ${util.inspect(object, { showHidden: false, depth: null })}`
  );
  strapi.log.info("--------END--------");
}
function checkResult(date, predicted_result) {}
export default factories.createCoreController(
  "api::predicted-result.predicted-result",
  ({ strapi }) => ({
    create: async (ctx) => {
      const {
        special_result,
        tele_id,
        medium_result_1,
        medium_result_2,
        medium_result_3,
        site,
      } = ctx.request.body;
      if (!special_result) {
        return ctx.badRequest("Missing required special_result");
      }

      if (!tele_id) {
        return ctx.badRequest("Missing required tele_id");
      }
      let dateTime = new Date();
      let formattedDateTime = checkAndAdjustDateTime(dateTime);
      // format date into YYYY-MM-DD
      if (formattedDateTime === "Invalid date" || !formattedDateTime) {
        return ctx.badRequest("INVALID_DATE", "date format is YYYY-MM-DD");
      }
      const predictedResult = await strapi.entityService.findMany(
        "api::predicted-result.predicted-result",
        {
          filters: {
            tele_id: tele_id,
            site: site,
            date: formattedDateTime,
          },
        }
      );
      if (predictedResult.length > 0) {
        return ctx.badRequest(
          "ONE_DATE_ONE_SITE_ONE_TIME",
          "Chỉ được dự đoán 1 site 1 lần trong ngày"
        );
      }
      const newPredictedResult = await strapi.entityService.create(
        "api::predicted-result.predicted-result",
        {
          data: {
            tele_id: tele_id,
            special_result: special_result,
            medium_result_1: medium_result_1,
            medium_result_2: medium_result_2,
            medium_result_3: medium_result_3,
            date: formattedDateTime,
            site: site,
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
      let { page = 1, page_size = 10, start, end } = ctx.query;
      let endVietnamTime = moment(end).tz("Asia/Ho_Chi_Minh");

      const now = moment().tz("Asia/Ho_Chi_Minh");
      const today = now.clone().startOf("day");
      const thresholdTime = today.clone().set({
        hour: 17,
        minute: 30,
        second: 0,
        millisecond: 0,
      });

      if (endVietnamTime.isAfter(today) && now.isBefore(thresholdTime)) {
        endVietnamTime = today.clone().subtract(1, "day");
        end = endVietnamTime.format("YYYY-MM-DD");
      }
      const predictResult = await strapi.entityService.findMany(
        "api::predicted-result.predicted-result",
        {
          filters: {
            date: {
              $gte: start,
              $lte: end,
            },
          },
        }
      );
      const realResult = await strapi.entityService.findMany(
        "api::lottery-result.lottery-result",
        {
          filters: {
            date: {
              $gte: start,
              $lte: end,
            },
          },
        }
      );
      const teleIdCount = {};
      predictResult.forEach((result) => {
        if (result.tele_id) {
          if (!teleIdCount[result.tele_id]) {
            teleIdCount[result.tele_id] = {
              special: 0,
              medium: 0,
            };
          }
          const correspondingRealResult = realResult.find(
            (real) =>
              real.date === result.date &&
              real.result === result.special_result &&
              real.type === "SPECIAL"
          );
          if (correspondingRealResult) {
            teleIdCount[result.tele_id].special++;
          }
          const correspondingRealResult1 = realResult.find(
            (real) =>
              real.date === result.date &&
              (real.result === result.medium_result_1 ||
                real.result === result.medium_result_2 ||
                real.result === result.medium_result_3) &&
              real.type === "MEDIUM"
          );
          if (correspondingRealResult1) {
            teleIdCount[result.tele_id].medium++;
          }
        }
      });

      // Chuyển đổi kết quả thành mảng theo định dạng yêu cầu
      const response = Object.keys(teleIdCount).map((teleId) => ({
        tele_id: teleId,
        special_point: Number(teleIdCount[teleId].special) * 70,
        medium_point: Number(teleIdCount[teleId].medium) * 5,
      }));

      // sort response by special_point + medium_point
      response.sort(
        (a, b) =>
          b.special_point + b.medium_point - (a.special_point + a.medium_point)
      );
      const startIndex = (page - 1) * page_size;
      const endIndex = page * page_size;

      // Lấy dữ liệu phân trang
      const paginatedResponse = response.slice(startIndex, endIndex);

      // Tạo đối tượng trả về bao gồm dữ liệu và thông tin phân trang
      const result = {
        totalItems: response.length,
        totalPages: Math.ceil(response.length / page_size),
        pageSize: page_size,
        data: paginatedResponse,
      };

      return result;
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
      return this.transformResponse(predictedResultWithLotteryResult, {
        pagination,
      });
    },

    async findByTele(ctx) {
      const { tele_id } = ctx.params;
      const predictResult = await strapi.entityService.findMany(
        "api::predicted-result.predicted-result",
        {
          filters: {
            tele_id,
          },
          limit: -1,
          sort: "date:desc",
        }
      );

      const realResult = await strapi.entityService.findMany(
        "api::lottery-result.lottery-result",
        {
          limit: -1,
          sort: "date:desc",
        }
      );
    },
  })
);

const getWeekNumber = (d) => {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  const week1 = new Date(date.getFullYear(), 0, 4);
  return (
    1 +
    Math.round(
      ((date.getTime() - week1.getTime()) / 86400000 -
        3 +
        ((week1.getDay() + 6) % 7)) /
        7
    )
  );
};


