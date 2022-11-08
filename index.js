// //----------Importing Module.--------------
// require("dotenv").config();
// const Binance = require("node-binance-api");
// const api = require("kucoin-node-api");
// const TelegramBot = require("node-telegram-bot-api");

// const token = process.env.TELEGRAM_BOT_TOKEN;
// const bot = new TelegramBot(token, { polling: true });

// function diffAndPercent(a, b) {
//   if (a > b) {
//     return [a - b, ((a - b) / a) * 100];
//   } else {
//     return [b - a, ((b - a) / b) * 100];
//   }
// }

// // ---------------Kucoin API---------------
// const config = {
//   apiKey: process.env.KUCOIN_API,
//   secretKey: process.env.KUCOIN_SECRET_KEY,
//   passphrase: process.env.KUCOIN_PASS_PHRASE,
//   environment: "live",
// };
// api.init(config);

// // ---------------Binance API-------------
// const binance = new Binance().options({
//   APIKEY: process.env.BINANCE_API,
//   APISECRET: process.env.BINANCE_SECRET_KEY,
// });


// // ----------Binance Data-----------------
// async function binanceData(token) {
//   try {
//     const ticker = await binance.prices();
//     return Promise.resolve(ticker[`${token}USDT`]);
//   } catch (error) {
//     return Promise.reject(error);
//   }
// }


// // -----------Kucoin Data-----------------
// function kucoinData(token) {
//   return api.getFiatPrice({
//     base: "USD",
//     currencies: [token],
//   });
// }

// // -----------------Data------------------
// const data = async token => {
//   try {
//     let [binancePrice, kucoinPrice] = await Promise.all([
//       binanceData(token),
//       kucoinData(token),
//     ]);

//     if (binancePrice && kucoinPrice?.data?.token) {
//       kucoinPrice = kucoinPrice.data[token]
//       const [difference, percentage] = diffAndPercent(binancePrice, kucoinPrice);
//       return Promise.resolve({
//         direction: +(binancePrice < kucoinPrice),
//         binancePrice,
//         kucoinPrice,
//         difference,
//         percentage
//       });
//     } else throw new Error("Error Occured...");
    
//   } catch (error) {
//     return Promise.reject(error);
//   }
// };



// // -----------Telegram Bot Logic------------

// bot.on("message", async (msg) => {
//   const { chat: { id }, text } = msg;
//   const msgText = text.toUpperCase().replace("/", "");
//   try {
//     const { binancePrice, kucoinPrice, difference, percentage } = await data(msgText);

//     bot.sendMessage(id, `Binance Price is : ${binancePrice}\nKucoin's Price is : ${kucoinPrice}\nDifference : ${difference.toFixed(4)}\nProfitability : ${percentage.toFixed(2)}%`);

//   } catch (error) {
//     bot.sendMessage(id, `${text} is not a valid token`);
//   }
// });

import Binance from "binance-api-node";
import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";
import { formatMoney } from "./utils/money.js";

// required to running in cloud
import http from "http";
http.createServer().listen(process.env.PORT);

dotenv.config();

// API keys can be generated here https://www.binance.com/en/my/settings/api-management
const binanceClient = Binance.default({
  apiKey: process.env.BINANCE_API_KEY,
  apiSecret: process.env.BINANCE_API_SECRET,
});

// The bot token can be obtained from BotFather https://core.telegram.org/bots#3-how-do-i-create-a-bot
const bot = new TelegramBot(process.env.TELEGRAMM_BOT_TOKEN, { polling: true });

// Matches "/price [symbol]"
bot.onText(/\/price (.+)/, (msg, data) => {
  const chatId = msg.chat.id;

  bot.sendMessage(chatId, "Wait...");

  // data[1] can be single token (i.e. "BTC") or pair ("ETH BTC")
  const [cryptoToken1, cryptoToken2 = "USDT"] = data[1].split(" ");

  binanceClient
    .avgPrice({ symbol: `${cryptoToken1}${cryptoToken2}`.toUpperCase() }) // example, { symbol: "BTCUSTD" }
    .then((avgPrice) => {
      bot.sendMessage(chatId, formatMoney(avgPrice["price"]));
    })
    .catch((error) => bot.sendMessage(chatId, `Error retrieving the price for ${cryptoToken1}${cryptoToken2}: ${error}`));
});

bot.on("message", (msg) => {
  const chatId = msg.chat.id;

  switch (msg.text) {
    case "/start":
      bot.sendMessage(
        chatId,
        "Hi there! I am 🤖 Butex Crypto Bot.To get the price of any token just send me the message `/price <TOKEN>`. For example to get the price of **BTC**: `/price BTC`",
        { parse_mode: "Markdown" }
      );
      break;

    default:
      break;
  }
});