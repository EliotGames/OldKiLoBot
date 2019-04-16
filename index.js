let TelegramBot = require("node-telegram-bot-api");
let token = "809682377:AAHs98OrOIoYFpdcWXUZl3-EYCM4z9nvyRU";
// let bot = new TelegramBot(token, {polling:true});
const mongoose = require("mongoose");
let request = require("request");
const inquirer = require("inquirer");
const Telegraf = require("telegraf");
const bot = new Telegraf(token);
const Extra = require("telegraf/extra");
const Markup = require("telegraf/markup");
const SERVER_URL = 'https://eliot-project.herokuapp.com/products';
const session = require("telegraf/session");
const Stage = require("telegraf/stage");
const WizardScene = require("telegraf/scenes/wizard");

// var options = {
//     reply_markup: JSON.stringify({
//       inline_keyboard: [
//         [{ text: `\u{1F35B} Всі продукти  `, callback_data: 'Поки що нема продуктів.' }],
//         [{ text: `\u{1F53C} Додати продукт`, callback_data: 'data 2' }]
//       ]
//     })
//   };

//   bot.onText(/\/start_test/, function (msg, match) {
//     bot.sendMessage(msg.chat.id, 'Выберите любую кнопку:', options);
//   });

// bot.onText(/\/get_data (.+)/, function(msg,match) {
//     let item = match[1];
//     let chatId = msg.chat.id;
//     request(`https://eliot-project.herokuapp.com/products/`, function(error, response, body) {
//       if(!error && response.statusCode == 200) {
//         bot.sendMessage(chatId, '__Loking for ' +  item + '...',{parse_mode:'Markdown'})
//         .then(function(msg){
//           let res = JSON.parse(body);
//           let findItem =({ name }) => {
//             return name === item;
//           }
//           let newArr = res.filter(findItem);
//           let product = newArr[0];
//           if(newArr.length !== 0 ) {
//           bot.sendMessage(chatId, 'You was looking for a : ' + product.name +"\nThe price is " +product.price + ' $ \n' );
//           }else {
//             bot.sendMessage(chatId, 'Sorry, but there is no such a product!');
//           }
//         })
//       }
//     })
// })


let productTemplate = product => `Продукт \u{2705}
Назва: ${product.name} 
Ціна: ${product.price} 
${product.isAvaiable ? "Наразі доступний" : "Наразі недоступний"} \n\n`;

let obtainData = ctx => {
  request(
    `https://eliot-project.herokuapp.com/products/`,
    (error, response, body) => {
      if (!error && response.statusCode == 200) {
        ctx
          .reply("Loking for products", { parse_mode: "Markdown" })
          .then(msg => {
            let products = JSON.parse(body);

            ctx.reply(
              products.map(product => productTemplate(product)).join("")
            );
          });
      }
    }
  );
};


let sendData = (ctx, product) => {
  let request = require("request");
  request.post(
    {
      headers: { 'content-type': 'application/json' },
      url: SERVER_URL,
      body: JSON.stringify(product)
    },
    function(error, response, body) {
      console.log();
    }
  );
};


let product = {};

const create = new WizardScene(
  "create",
  ctx => {
    ctx.reply("Введіть ім'я продукту:");
    return ctx.wizard.next();
  },
  ctx => {
    product.name = ctx.update.message.text;
    ctx.reply("Введіть ціну продукту");
    return ctx.wizard.next();
  },
  ctx => {
    product.price = parseInt(ctx.update.message.text);
    ctx.reply(
      "Веддіть доступність продукту: ",
      Markup.inlineKeyboard([
        [
          Markup.callbackButton("\u{2705}	Tак", "yes"),
          Markup.callbackButton("\u{274E} Ні", "no")
        ]
      ]).extra()
    );

    return ctx.scene.leave();
  }
);


const stage = new Stage();
stage.register(create);

bot.use(session());
bot.use(stage.middleware());
bot.action("create", ctx => ctx.scene.enter("create"));
bot.action("getProducts", ctx => obtainData(ctx));

bot.action("yes", (ctx, next) => {
  product.isAvaiable = true;
  next(ctx);
});

bot.action("no", (ctx, next) => {
  product.isAvaiable = false;
  next(ctx);
});

bot.start(ctx => {
  ctx.reply(
    "Оберіть дію",
    Markup.inlineKeyboard([
      [
        { text: `Всі продукти  `, callback_data: "getProducts" },
        { text: `Додати продукт`, callback_data: "create" }
      ]
    ])
      .oneTime()
      .resize()
      .extra()
  );
});

bot.use(ctx => {
  ctx.reply(productTemplate(product));
  sendData(ctx, product);
});

bot.launch();
