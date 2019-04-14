let TelegramBot = require('node-telegram-bot-api');
let token = '809682377:AAHs98OrOIoYFpdcWXUZl3-EYCM4z9nvyRU';
let bot = new TelegramBot(token, {polling:true});
const mongoose = require('mongoose');
let request = require('request');
const Axios = require("axios");



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


  bot.onText(/\/get_data (.+)/, function(msg,match) {
      let item = match[1];
      let chatId = msg.chat.id;
      request(`https://eliot-project.herokuapp.com/products/`, function(error, response, body) {
        if(!error && response.statusCode == 200) {
          bot.sendMessage(chatId, '__Loking for ' +  item + '...',{parse_mode:'Markdown'})
          .then(function(msg){
            let res = JSON.parse(body);
            let findItem =({ name }) => {
              return name === item;
            }
            let newArr = res.filter(findItem);
            let product = newArr[0]; 
            if(newArr.length !== 0 ) {
            bot.sendMessage(chatId, 'You was looking for a : ' + product.name +"\nThe price is " +product.price + ' $ \n' );
            }else {
              bot.sendMessage(chatId, 'Sorry, but there is no such a product!');
            }
          })
        } 
      })
  })

  bot.onText(/\/add_product (.+)/, function(msg,match) {
    let chatId = msg.chat.id;
    request.post('https://eliot-project.herokuapp.com/products',  function(error, response, body){
    if(!error && response.statusCode == 200) {
      bot.sendMessage(chatId, 'Enter the name of product: ' + {parse_mode : 'Markdown'})
      .then(bot.sendMessage())
    }
    })
  })

    


