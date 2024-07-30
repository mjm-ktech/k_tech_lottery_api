import util from "util";
export function debug(name, object) {
  strapi.log.info("--------DEBUG--------");
  strapi.log.info(
    `${name}: ${util.inspect(object, { showHidden: false, depth: null })}`
  );
  strapi.log.info("--------END--------");
}
