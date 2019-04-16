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


let productTemplate = product => `Продукт \u{2705}
Назва: ${product.name} 
Ціна: ${product.price} 
${product.isAvaiable ? "Наразі доступний" : "Наразі недоступний"} \n\n`;

//Отримуємо всі продукти
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


//Створюємо новий продукт
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

// Отримуємо продукт по імені
let findingProduct = '';
const getProduct = new WizardScene(
  "getProduct",
  ctx => {
    ctx.reply("Введіть ім'я продукту:");
    return ctx.wizard.next();
  },
  ctx =>{
    findingProduct = ctx.update.message.text;
    request(
      'https://eliot-project.herokuapp.com/products/',
      (error , response , body) =>{
        if(!error && response.statusCode == 200) {
          ctx
          .reply('Loking for ' +  findingProduct + '...',{parse_mode:'Markdown'})
          .then(msg => {
            let res = JSON.parse(body);
            let findItem =({ name }) => {
              return name === findingProduct;
            }
            let newArr = res.filter(findItem);
            let product = newArr[0];
            if(newArr.length !== 0 ) {
            ctx.reply('Ви шукали : ' + product.name +"\nЦіна " +product.price + ' $ \n'  + (product.isAvaiable ? "Наразі доступний" : "Наразі недоступний"));
            }else {
              ctx.reply('Вибачте, але такого продукта в нашій базі даних немає. Попробуйте ще раз.');
            }
          })
        }
      }
    )
  }
)

//Продовження додавання продукту
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

bot.action("yes", (ctx, next) => {
  product.isAvaiable = true;
  next(ctx);
});

bot.action("no", (ctx, next) => {
  product.isAvaiable = false;
  next(ctx);
});


//Ініціалізація, головна частина
const stage = new Stage();
stage.register(create);
stage.register(getProduct);

bot.use(session());
bot.use(stage.middleware());
bot.action("create", ctx => ctx.scene.enter("create"));
bot.action("getProducts", ctx => obtainData(ctx));
bot.action("getProduct", ctx=> ctx.scene.enter("getProduct"));

bot.start(ctx => {
  ctx.reply(
    "Оберіть дію",
    Markup.inlineKeyboard([
      [
        { text: `Всі продукти  `, callback_data: "getProducts" },
        { text: `Додати продукт`, callback_data: "create" },
        {text: `Знайти продукт`, callback_data: "getProduct"}
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
