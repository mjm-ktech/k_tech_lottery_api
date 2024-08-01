import util from "util";
import moment from "moment-timezone";
export function debug(name, object) {
  strapi.log.info("--------DEBUG--------");
  strapi.log.info(
    `${name}: ${util.inspect(object, { showHidden: false, depth: null })}`
  );
  strapi.log.info("--------END--------");
}

export function getFromTo(query: any) {
  let { from, to } = query;
  if (!from || !to) {
    const nowInHoChiMinhCity = moment().tz("Asia/Ho_Chi_Minh");
    const oneMonthAgo = moment().tz("Asia/Ho_Chi_Minh").subtract(1, 'month');
    from = oneMonthAgo.format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');
    to = nowInHoChiMinhCity.format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');
  }
  // chuyển thành utc -7
  return { from, to };
}
