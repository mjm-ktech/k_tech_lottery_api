/**
 * lottery-result service
 */

import { factories } from "@strapi/strapi";
import { debug } from "../../../utils/index";
import moment from "moment-timezone";
import { GoogleSpreadsheet } from "google-spreadsheet";
import creds from "../../../../google_cred.json";
import { JWT } from "google-auth-library";
const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID;
const GOOGLE_SHEET_INDEX = process.env.GOOGLE_SHEET_INDEX || 0;
const SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive.file",
];

const jwt = new JWT({
  email: creds.client_email,
  key: creds.private_key,
  scopes: SCOPES,
});
export default factories.createCoreService(
  "api::lottery-result.lottery-result",
  ({ strapi }) => ({
    async createByExcel() {
      try {
        const doc = new GoogleSpreadsheet(GOOGLE_SHEET_ID, jwt);
        await doc.loadInfo();

        const sheet = doc.sheetsByIndex[GOOGLE_SHEET_INDEX];
        await sheet.setHeaderRow([
          "Ngày",
          "Giải đặc biệt",
          "Giải 1",
          "Giải 2",
          "Giải 3",
          "Giải 4",
          "Giải 5",
          "Giải 6",
          "Giải 7",
        ]);
        const rows = await sheet.getRows();
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const date = moment(row.get("Ngày"), "DD/MM/YYYY").format(
            "YYYY-MM-DD"
          );
          const specialPrice = row.get("Giải đặc biệt");
          if (!specialPrice || !date) {
            continue;
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
          if (lotteryResult.length > 0) {
            continue;
          } else {
            await strapi.entityService.create(
              "api::lottery-result.lottery-result",
              {
                data: {
                  date,
                  result: specialPrice,
                  type: "SPECIAL",
                },
              }
            );
          }
          const mediumPrice1 = row.get("Giải 1").split(",");
          const mediumPrice2 = row.get("Giải 2").split(",");
          const mediumPrice3 = row.get("Giải 3").split(",");
          const mediumPrice4 = row.get("Giải 4").split(",");
          const mediumPrice5 = row.get("Giải 5").split(",");
          const mediumPrice6 = row.get("Giải 6").split(",");
          const mediumPrice7 = row.get("Giải 7").split(",");

          // merge all array into one array
          const mediumPrice = [
            ...mediumPrice1,
            ...mediumPrice2,
            ...mediumPrice3,
            ...mediumPrice4,
            ...mediumPrice5,
            ...mediumPrice6,
            ...mediumPrice7,
          ];

          // create new rows
          for (let j = 0; j < mediumPrice.length; j++) {
            const price = mediumPrice[j];
            if (price) {
              await strapi.entityService.create(
                "api::lottery-result.lottery-result",
                {
                  data: {
                    date,
                    result: price,
                    type: "MEDIUM",
                  },
                }
              );
            }
          }
        }
      } catch (e) {
        return;
      }
    },
  })
);
