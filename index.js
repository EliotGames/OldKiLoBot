let TelegramBot = require("node-telegram-bot-api");
let token = "809682377:AAHs98OrOIoYFpdcWXUZl3-EYCM4z9nvyRU";
// let bot = new TelegramBot(token, {polling:true});
let request = require("request");
const Telegraf = require("telegraf");
const bot = new Telegraf(token);
const Extra = require("telegraf/extra");
const Markup = require("telegraf/markup");
const SERVER_URL = "https://eliot-project.herokuapp.com/products";
const USERS_URL = "https://eliot-project.herokuapp.com/users";
const session = require("telegraf/session");
const Stage = require("telegraf/stage");
const WizardScene = require("telegraf/scenes/wizard");

//Basic Template
let productTemplate = product => `Продукт \u{2705}
Назва: ${product.name} 
Ціна: ${product.price} 
${product.isAvaiable ? "Наразі доступний" : "Наразі недоступний"} \n\n`;

//Get all products
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

//Post method to database /products
let sendData = (ctx, product) => {
  let request = require("request");
  request.post(
    {
      headers: { "content-type": "application/json" },
      url: SERVER_URL,
      body: JSON.stringify(product)
    },
    function(error, response, body) {
      console.log();
    }
  );
};

// Get product by name
let findingProduct = "";
const getProduct = new WizardScene(
  "getProduct",
  ctx => {
    ctx.reply("Введіть ім'я продукту:");
    return ctx.wizard.next();
  },
  ctx => {
    findingProduct = ctx.update.message.text;
    request(
      "https://eliot-project.herokuapp.com/products/",
      (error, response, body) => {
        if (!error && response.statusCode == 200) {
          ctx
            .reply("Loking for " + findingProduct + "...", {
              parse_mode: "Markdown"
            })
            .then(msg => {
              let res = JSON.parse(body);
              let findItem = ({ name }) => {
                return name === findingProduct;
              };
              let newArr = res.filter(findItem);
              let product = newArr[0];
              if (newArr.length !== 0) {
                ctx.reply(
                  "Ваш продукт знайдено : \n" + productTemplate(product)
                );
              } else {
                ctx.reply(
                  "Вибачте, але такого продукта в нашій базі даних немає. Для продовження введіть /start"
                );
              }
            });
          return ctx.scene.leave();
        }
      }
    );
  }
);
// Register user in a database
let registerUser = (ctx, newUser) => {
  let request = require("request");
  request.post(
    {
      headers: { "content-type": "application/json" },
      url: USERS_URL,
      body: JSON.stringify(newUser)
    },
    function(error, response, body) {
      console.log(response);
    }
  );
};
let newUser = {};

// User greeting

let userGreeting = (ctx, firstName) => {
  ctx.reply(
    `Привіт ${firstName}, раді тебе знову бачити!`,
    Markup.inlineKeyboard([
      [
        { text: `Всі продукти  `, callback_data: "getProducts" },
        { text: `Додати продукт`, callback_data: "create" },
        { text: `Знайти продукт`, callback_data: "getProduct" }
      ]
    ])
      .oneTime()
      .resize()
      .extra()
  );
};

//Creating a new product
let product = {};

const create = new WizardScene(
  "create",
  ctx => {
    ctx.reply("Введіть назву продукту:");
    return ctx.wizard.next();
  },
  ctx => {
    console.log(ctx);
    product.name = ctx.update.message.text;
    ctx.reply("Введіть ціну продукту");
    return ctx.wizard.next();
  },
  ctx => {
    product.price = parseInt(ctx.update.message.text);
    if (product.price > 0) {
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
    } else {
      ctx.reply("Ви ввели неможливу ціну. Повторіть все спочатку.\nВведіть назву продукту:");
      ctx.wizard.back();
    }
  }
);


bot.action("yes", (ctx, next) => {
  product.isAvaiable = true;
  ctx.reply(productTemplate(product));
  sendData(ctx, product);
});

bot.action("no", (ctx, next) => {
  product.isAvaiable = false;
  ctx.reply(productTemplate(product));
  sendData(ctx, product);
});

//Main
const stage = new Stage();
stage.register(create);
stage.register(getProduct);

bot.use(session());
bot.use(stage.middleware());
bot.action("create", ctx => ctx.scene.enter("create"));
bot.action("getProducts", ctx => obtainData(ctx));
bot.action("getProduct", ctx => ctx.scene.enter("getProduct"));

bot.start(ctx => {
  let userId = ctx.message.from.id.toString();
  let firstName = ctx.message.from.first_name;
  request(`${USERS_URL}/?telegramId=${userId}`, (error, response, body) => {
    if (!error && response.statusCode == 200) {
        userGreeting(ctx,firstName);
      } else {
        newUser.firstName = firstName;
        newUser.telegramId = userId;
        registerUser(ctx, newUser);
        console.log(newUser);
        userGreeting(ctx, firstName);
      }
  });
});

bot.launch();
