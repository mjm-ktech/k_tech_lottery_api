/**
 * rating service
 */
import { debug } from "../../../utils/index";
import { factories } from "@strapi/strapi";
import moment from "moment-timezone";
export default factories.createCoreService(
  "api::rating.rating",
  ({ strapi }) => ({
    createRatingWithDay: async () => {
      // get predictedResult today but before 17:30
      debug("date", moment().tz("Asia/Ho_Chi_Minh").format("YYYY-MM-DD"));
      const predictedResults = await strapi.entityService.findMany(
        "api::predicted-result.predicted-result",
        {
          filters: {
            date: {
              $eq: moment().tz("Asia/Ho_Chi_Minh").format("YYYY-MM-DD"),
            },
          },
          sort: "date:desc",
        }
      );
      const realResult = await strapi.entityService.findMany(
        "api::lottery-result.lottery-result",
        {
          filters: {
            date: {
              $eq: moment().tz("Asia/Ho_Chi_Minh").format("YYYY-MM-DD"),
            },
          },
          sort: "date:desc",
        }
      );
      const teleIdCount = {};
      predictedResults.forEach((result) => {
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
        total_point:
          Number(teleIdCount[teleId].special) * 70 +
          Number(teleIdCount[teleId].medium) * 5,
      }));

      // sort response by special_point + medium_point
      response.sort(
        (a, b) =>
          b.special_point + b.medium_point - (a.special_point + a.medium_point)
      );
      let i = 1;
      response.forEach(async (item) => {
        await strapi.entityService.create("api::rating.rating", {
          data: {
            tele_id: item.tele_id,
            total_score: Number(item.total_point),
            day: Number(moment().tz("Asia/Ho_Chi_Minh").format("DD")),
            month: Number(moment().tz("Asia/Ho_Chi_Minh").format("MM")),
            year: Number(moment().tz("Asia/Ho_Chi_Minh").format("YYYY")),
            type: "DAY",
            places: i++,
            week: getWeekOfMonth(moment().tz("Asia/Ho_Chi_Minh"))
          },
        });
      });
    },
    createRatingWithWeek: async () => {
      // get predictedResult today but before 17:30
      const predictedResults = await strapi.entityService.findMany(
        "api::predicted-result.predicted-result",
        {
          limit: -1,
          sort: "date:desc",
          filters: {
            date: {
              $gte: moment()
                .tz("Asia/Ho_Chi_Minh")
                .subtract(7, "days")
                .format("YYYY-MM-DD"),
              $lte: moment().tz("Asia/Ho_Chi_Minh").format("YYYY-MM-DD"),
            },
          },
        }
      );
      const realResult = await strapi.entityService.findMany(
        "api::lottery-result.lottery-result",
        {
          limit: -1,
          sort: "date:desc",
          filters: {
            date: {
              $gte: moment()
                .tz("Asia/Ho_Chi_Minh")
                .subtract(7, "days")
                .format("YYYY-MM-DD"),
              $lte: moment().tz("Asia/Ho_Chi_Minh").format("YYYY-MM-DD"),
            },
          },
        }
      );
      const teleIdCount = {};
      predictedResults.forEach((result) => {
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
        total_point:
          Number(teleIdCount[teleId].special) * 70 +
          Number(teleIdCount[teleId].medium) * 5,
      }));

      // sort response by special_point + medium_point
      response.sort(
        (a, b) =>
          b.special_point + b.medium_point - (a.special_point + a.medium_point)
      );
      let i = 1;
      response.forEach(async (item) => {
        await strapi.entityService.create("api::rating.rating", {
          data: {
            tele_id: item.tele_id,
            total_score: Number(item.total_point),
            day: Number(moment().tz("Asia/Ho_Chi_Minh").format("DD")),
            month: Number(moment().tz("Asia/Ho_Chi_Minh").format("MM")),
            year: Number(moment().tz("Asia/Ho_Chi_Minh").format("YYYY")),
            week: getWeekOfMonth(moment().tz("Asia/Ho_Chi_Minh")),
            type: "WEEK",
            places: i++,
          },
        });
      });
    },
    createRatingWithMonth: async () => {
      // get predictedResult today but before 17:30
      const predictedResults = await strapi.entityService.findMany(
        "api::predicted-result.predicted-result",
        {
          limit: -1,
          sort: "date:desc",
          filters: {
            date: {
              $gte: moment().tz("Asia/Ho_Chi_Minh").startOf('month').format("YYYY-MM-DD"),
              $lte: moment().tz("Asia/Ho_Chi_Minh").format("YYYY-MM-DD"),
            },
          },
        }
      );
      const realResult = await strapi.entityService.findMany(
        "api::lottery-result.lottery-result",
        {
          limit: -1,
          sort: "date:desc",
          filters: {
            date: {
              $gte: moment().tz("Asia/Ho_Chi_Minh").startOf('month').format("YYYY-MM-DD"),
              $lte: moment().tz("Asia/Ho_Chi_Minh").format("YYYY-MM-DD"),
            },
          },
        }
      );
      const teleIdCount = {};
      predictedResults.forEach((result) => {
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
        total_point:
          Number(teleIdCount[teleId].special) * 70 +
          Number(teleIdCount[teleId].medium) * 5,
      }));

      // sort response by special_point + medium_point
      response.sort(
        (a, b) =>
          b.special_point + b.medium_point - (a.special_point + a.medium_point)
      );
      let i = 1;
      response.forEach(async (item) => {
        await strapi.entityService.create("api::rating.rating", {
          data: {
            tele_id: item.tele_id,
            total_score: Number(item.total_point),
            day: Number(moment().tz("Asia/Ho_Chi_Minh").format("DD")),
            month: Number(moment().tz("Asia/Ho_Chi_Minh").format("MM")),
            year: Number(moment().tz("Asia/Ho_Chi_Minh").format("YYYY")),
            week: getWeekOfMonth(moment().tz("Asia/Ho_Chi_Minh")),
            type: "MONTH",
            places: i++,
          },
        });
      });
    },

    createLeaderTop:  async () => {
      // get predictedResult today but before 17:30
      const predictedResults = await strapi.entityService.findMany(
        "api::predicted-result.predicted-result",
        {
          limit: -1,
          sort: "date:desc",
          filters: {
            date: {
              $eq: moment().tz("Asia/Ho_Chi_Minh").format("YYYY-MM-DD"),
            },
          },
        }
      );
      const realResult = await strapi.entityService.findMany(
        "api::lottery-result.lottery-result",
        {
          limit: -1,
          sort: "date:desc",
          filters: {
            date: {
              $eq: moment().tz("Asia/Ho_Chi_Minh").format("YYYY-MM-DD"),
            },
          },
        }
      );
      const teleIdCount = {};
      predictedResults.forEach((result) => {
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
        total_point:
          Number(teleIdCount[teleId].special) * 70 +
          Number(teleIdCount[teleId].medium) * 5,
      }));

      // sort response by special_point + medium_point
      response.sort(
        (a, b) =>
          b.special_point + b.medium_point - (a.special_point + a.medium_point)
      );
      let i = 1;
      response.forEach(async (item) => {
        const leaderTop = await strapi.entityService.findMany("api::leader-top.leader-top", {
          filters: {
            tele_id: item.tele_id
          }}
        );
        if (leaderTop.length > 0) {
          await strapi.db.connection("leader_tops")
            .where({ id: leaderTop[0].id })
            .increment("total_score", item.total_point);
        } else {
          await strapi.entityService.create("api::leader-top.leader-top", {
            data: {
              tele_id: item.tele_id,
              total_score: item.total_point,
            }}
          );
        }
    });
    },
  })
);


function getWeekOfMonth(date) {
  const startOfMonth = moment(date).startOf('month');
  const startOfWeek = startOfMonth.clone().startOf('week');
  const weekOfMonth = Math.ceil((moment(date).date() + startOfMonth.day()) / 7);
  return weekOfMonth;
}
