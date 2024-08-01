/**
 * rating controller
 */
import { getFromTo } from "../../../utils/index";
import { factories } from "@strapi/strapi";
import moment from "moment-timezone";
export default factories.createCoreController(
  "api::rating.rating",
  ({ strapi }) => ({
    findByTeleId: async (ctx) => {
      const { tele_id } = ctx.query;
      const today = moment().tz("Asia/Ho_Chi_Minh");
      const currentMonth = today.month() + 1;
      const currentWeekOfMonth = getWeekOfMonth(today);
      const currentYear = today.year();

      // tuần này, tuần trước, tháng này, tháng trước, năm
      const ratingForTele = await strapi.entityService.findMany(
        "api::rating.rating",
        { filters: { tele_id: tele_id } }
      );
      const [thisWeek, lastWeek, thisMonth, lastMonth, year] =
        await Promise.all([
          ratingForTele.reduce((acc, cur) => {
            if (
              cur.type === "DAY" &&
              cur.week === currentWeekOfMonth &&
              cur.month === currentMonth &&
              cur.year === currentYear
            ) {
              return acc + cur.total_score;
            }
            return acc;
          }, 0),

          ratingForTele.reduce((acc, cur) => {
            if (currentWeekOfMonth === 1 && currentMonth === 1) {
              if (
                cur.type === "WEEK" &&
                cur.month === 12 &&
                cur.week === getLastWeekOfMonth(12, currentYear - 1) &&
                cur.year === currentYear - 1
              ) {
                return acc + cur.total_score;
              }
            }
            if (
              currentWeekOfMonth > 1 &&
              currentWeekOfMonth <= 5 &&
              cur.type === "WEEK" &&
              cur.week === currentWeekOfMonth - 1 &&
              cur.year === currentYear
            ) {
              return acc + cur.total_score;
            }
            if (
              currentWeekOfMonth === 1 &&
              cur.type === "WEEK" &&
              cur.month === currentMonth - 1 &&
              cur.week === getLastWeekOfMonth(currentMonth - 1, currentYear) &&
              cur.year === currentYear
            ) {
              return acc + cur.total_score;
            }
            return acc;
          }, 0),

          ratingForTele.reduce((acc, cur) => {
            if (
              cur.type === "DAY" &&
              cur.month === currentMonth &&
              cur.year === currentYear
            ) {
              return acc + cur.total_score;
            }
            return acc;
          }, 0),

          ratingForTele.reduce((acc, cur) => {
            if (currentMonth === 1) {
              if (
                cur.type === "DAY" &&
                cur.month === 12 &&
                cur.year === currentYear - 1
              ) {
                return acc + cur.total_score;
              }
            }
            if (cur.type === "DAY" && cur.month === currentMonth - 1) {
              return acc + cur.total_score;
            }
            return acc;
          }, 0),

          ratingForTele.reduce((acc, cur) => {
            if (cur.type === "DAY" && cur.year === currentYear) {
              return acc + cur.total_score;
            }
            return acc;
          }, 0),
        ]);

      return {
        tele_id: tele_id,
        data: {
          this_week: thisWeek,
          last_week: lastWeek,
          this_month: thisMonth,
          last_month: lastMonth,
          year: year,
        },
      };
    },

    findAll: async (ctx) => {
      const today = moment().tz("Asia/Ho_Chi_Minh");
      const currentMonth = today.month() + 1;
      // const { from, to } = getFromTo(ctx.query);
      const currentWeekOfMonth = getWeekOfMonth(today);
      const currentYear = today.year();

      const ratingForTele = await strapi.entityService.findMany(
        "api::rating.rating",
        { limit: -1 }
      );
      // group with tele_id and type = DAY and month = currentMonth
      const thisWeek = ratingForTele.reduce((acc, cur) => {
        if (cur.type === "DAY" && cur.month === currentMonth) {
          if (!acc[cur.tele_id]) {
            acc[cur.tele_id] = {
              this_month: cur.total_score,
            };
          } else {
            acc[cur.tele_id].this_month += cur.total_score;
          }
        }
        return acc;
      }, {});
      const lastWeek = ratingForTele.reduce((acc, cur) => {
        if (
          currentWeekOfMonth === 1 &&
          currentMonth === 1 &&
          cur.type === "WEEK" &&
          cur.month === 12 &&
          cur.week === getLastWeekOfMonth(12, currentYear - 1) &&
          cur.year === currentYear - 1
        ) {
          if (!acc[cur.tele_id]) {
            acc[cur.tele_id] = {
              this_month: cur.total_score,
            };
          } else {
            acc[cur.tele_id].this_month += cur.total_score;
          }
        }
        if (
          currentWeekOfMonth > 1 &&
          currentWeekOfMonth <= 5 &&
          cur.type === "WEEK" &&
          cur.week === currentWeekOfMonth - 1 &&
          cur.year === currentYear
        ) {
          if (!acc[cur.tele_id]) {
            acc[cur.tele_id] = {
              last_week: cur.total_score,
            };
          } else {
            acc[cur.tele_id].last_week += cur.total_score;
          }
        }
        if (
          currentWeekOfMonth === 1 &&
          cur.type === "WEEK" &&
          cur.month === currentMonth - 1 &&
          cur.week === getLastWeekOfMonth(currentMonth - 1, currentYear) &&
          cur.year === currentYear
        ) {
          if (!acc[cur.tele_id]) {
            acc[cur.tele_id] = {
              last_week: cur.total_score,
            };
          } else {
            acc[cur.tele_id].last_week += cur.total_score;
          }
        }
        return acc;
      }, {});
      const lastMonth = ratingForTele.reduce((acc, cur) => {
        if (
          currentMonth === 1 &&
          cur.type === "MONTH" &&
          cur.month === 12 &&
          cur.year === currentYear - 1
        ) {
          if (!acc[cur.tele_id]) {
            acc[cur.tele_id] = {
              this_month: cur.total_score,
            };
          } else {
            acc[cur.tele_id].this_month += cur.total_score;
          }
        }
        if (
          currentMonth > 1 &&
          currentMonth <= 12 &&
          cur.type === "MONTH" &&
          cur.month === currentMonth - 1 &&
          cur.year === currentYear
        ) {
          if (!acc[cur.tele_id]) {
            acc[cur.tele_id] = {
              last_month: cur.total_score,
            };
          } else {
            acc[cur.tele_id].last_month += cur.total_score;
          }
        }
        return acc;
      }, {});
      const thisMonth = ratingForTele.reduce((acc, cur) => {
        if (
          cur.type === "DAY" &&
          cur.month === currentMonth &&
          cur.year === currentYear
        ) {
          if (!acc[cur.tele_id]) {
            acc[cur.tele_id] = {
              this_month: cur.total_score,
            };
          } else {
            acc[cur.tele_id].this_month += cur.total_score;
          }
        }
        return acc;
      }, {});
      const year = ratingForTele.reduce((acc, cur) => {
        if (
          cur.type === "DAY" &&
          cur.year === currentYear
        ) {
          if (!acc[cur.tele_id]) {
            acc[cur.tele_id] = {
              this_month: cur.total_score,
            };
          } else {
            acc[cur.tele_id].this_month += cur.total_score;
          }
        }
        return acc;
      }, {});
      const formattedData = {
        this_week: convertData(thisWeek, 'this_week'),
        last_week: convertData(lastWeek, 'last_week'),
        this_month: convertData(thisMonth, 'this_month'),
        last_month: convertData(lastMonth, 'last_month'),
        year: convertData(year, 'year')
      };
      return formattedData;
    },
  })
);
function getWeekOfMonth(date) {
  const startOfMonth = moment(date).startOf("month");
  const weekOfMonth = Math.ceil(
    (date.date() + startOfMonth.isoWeekday() - 1) / 7
  );
  return weekOfMonth;
}
function getLastWeekOfMonth(month, year) {
  // Tạo một đối tượng moment cho ngày cuối cùng của tháng chỉ định
  const lastDayOfMonth = moment({ year, month }).endOf("month");

  // Tính tuần cuối cùng của tháng
  const lastWeekOfMonth = getWeekOfMonth(lastDayOfMonth);

  return lastWeekOfMonth;
}

const convertData = (data, period) => {
  return Object.keys(data).map(key => {
    const pointKey = Object.keys(data[key])[0]; // Lấy khóa đầu tiên, ví dụ: this_month, last_week, ...
    return { tele_id: key, point: data[key][pointKey] };
  }).sort((a, b) => b.point - a.point)
    .slice(0, 20); // Sắp xếp theo point từ lớn đến nhỏ
};
