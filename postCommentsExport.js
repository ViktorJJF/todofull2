require('dotenv-safe').config();
const initMongo = require('./config/mongo');
initMongo();
const { GoogleSpreadsheet } = require('google-spreadsheet');
const CommentFacebook = require('./models/CommentsFacebook');

const SHEETS_PAGE_USERS_ID = '1Gw4OCAV-1plMJ1ctu1lJ5twRk6K929pP0GfURpxnh9M';
const SHEET_INDEX = 2;

async function initGoogleSheetsAPI(doc) {
  await doc.useServiceAccountAuth({
    client_email:
      'googlesheetsapi3@second-folio-293523.iam.gserviceaccount.com',
    private_key:
      '-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDG2GIHuYVsPlBz\npPuY1oJxGChSS6JwsyghgkWhE4QD8uaDblYacJPpK2PrhstjOT13/lCYH6CHVJqb\nhrMtldIgL3jDi9a/t/mDRyFzYmM4xW1iSXJWND3CM7qHUr9I9oHLXOLv3oO4xulu\nKqjPcmpdh5+ZXNhGv9INaicRpYvqdTZ0Xmw9igqE1/dwMBDeQj6EMZ4kETNBmzTu\n4o1hN7fuo+DGlPCh+N5inaUTr0TjVSeG1lRupv+GA6ULjTCe+wKqwsR8Qd9tlKNw\nqO8XptKLUIj0HA/jSg32Lq3gbB///FK+N757Ho1AJs15Y3qjaJiknU0p86rHO1ZX\nxdQAm3VNAgMBAAECggEACxDrQblMKNY99XWiz+JuP3uD8PKHH4UE8Hp2xAxZPjwE\nIp/fGFkYDjOtO6QUiRjcKCOl2hV2glmNwiaIrbqHB2YE70MGyEQllW39uVVqJrRs\nDjp+q7f8EOT+lj3faeDYH9hzQ7yrMXsWbhxfKS5Zp4te8TLG0Ycm2jrEYlnHc9yJ\ncUUNJlhN3/Ex51ZkQMfAaL7ubZsYa988VIZFmaJx9fp2VLhUnJl/d1iSmVvcfjSf\nzd9Z/JAaTXWnwxCS0uutwO50SjSdXI5cTnOTr6TeKnq7YfKyTIs6H2PeRSO+bWqL\nReC3VjWxzw2+e8nz+7i/TtUHMgeGanyrNa5wMqpXiQKBgQDrEinD6YZewT1AgUBG\nTmyWPepSiQoutZyg+/RFfP6ya2M9jPTHxCKG5WPo2lYXkZsTaM6h3aptkNIl4y0E\nLr2GJWss1LruAORXNAYtNCILP0OStFO1LaDAK3RlWytt7XE0WkDE9zTVQrDwJuzC\nP7W6Vr9ACp94rQZykNE5r8yVKQKBgQDYjIxUkFiD3IRROdf5Fe6YtclK1LRMDhkP\ndwDfVSwwCRwm+eq/iLTxvgsLmJTL0iGJqwNWja5w0uQYybN6rtlvoh96RMtSIlwL\nZQVLVxCgqxPMLNxkzNJ54WZOsllGX1VJkA/ye+Q+GwGym/l7gUj8IRkGv6UF7z6U\nZydJ0XIfhQKBgQCbH7FQB5sUjJDPMHwp6TbfLpyjOqvthwuFcL8R3Bp3w0YKKCqg\naV4fhuEXmH2XsA6WEGPLjWwaQadsOS5LxExtaeQAAaIZzZzhrwMkcXLF2UnOVhGn\nTiT2q7Zz7GYMdNRvp992G2xSD2CUGhvDVCeof/ZVXK1ABW5rzAVF/C0VgQKBgQCc\nsxfZGZrz0F7vaCwg0v4VA3bl74WIg6sexb6b3cZb/Dui+LYmY4aMaDkV6xPBag1a\n0aVYvK2+dt0YEt0NqfkuDuM4Vw/KH5L7q95o5lfh6+onlU7molCsYa7mw6hWhCXz\nVYw0q/I9/sz7smKWPLfTux+hAo0n/jgKq5qCkE1FAQKBgQCz6YouYlSUFrANFbjL\npuRFVxMkK0KT9Syv9dzOHtSQBQZCIE1sNSFXlyqlaNatJ7ARcbHcEwl9FmHxKw6Y\nOKc0I4a3B5kwKJdNZBGtXdG0YRfn1IreUot3tNHWlwwrb5B4Bd5KtI7taUcMCY9Y\nUhseEWkTAT+nRzSNd2X2ZsbxTQ==\n-----END PRIVATE KEY-----\n',
  });

  await doc.loadInfo(); // loads document properties and worksheets
  console.log(doc.title);
}

(async () => {
  try {
    const doc = new GoogleSpreadsheet(SHEETS_PAGE_USERS_ID);
    await initGoogleSheetsAPI(doc);
    const sheet = doc.sheetsByIndex[SHEET_INDEX]; // or use doc.sheetsById[id]
    await sheet.loadCells('A1:F1000'); // loads a range of cells
    let rowIndex = 1;
    let hasValue = true;
    let cell = sheet.getCell(1, 0);
    let posts = [];
    while (hasValue) {
      cell = sheet.getCell(rowIndex, 0);
      let post = {
        postUrl: '',
        responses: [],
        botId: '6000d2fb3de4765e8c29543f',
      };
      post.postUrl = sheet.getCell(rowIndex, 0).value;
      post.responses.push(sheet.getCell(rowIndex, 1).value);
      post.responses.push(sheet.getCell(rowIndex, 2).value);
      post.responses.push(sheet.getCell(rowIndex, 3).value);
      if (post.postUrl) {
        posts.push(post);
      }
      if (!cell.value) hasValue = false;
      rowIndex++;
    }
    await CommentFacebook.insertMany(posts, { ordered: false });
    console.log('hecho!');
    console.log('insertados: ', posts.length);
  } catch (error) {
    console.log('algo salio mal: ', error.message);
  }
})();
