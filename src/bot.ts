import { Bot, Context, webhookCallback, session, InlineKeyboard, } from 'grammy';
import { Menu } from '@grammyjs/menu';
import {
  type Conversation,
  type ConversationFlavor,
  conversations,
  createConversation,
} from '@grammyjs/conversations';

import * as express from 'express';

import { getTransactions, createTransaction } from './helpers/transaction';
import { Transaction } from './helpers/transaction.interface';

require('dotenv').config();

type MyContext = Context & ConversationFlavor;
type MyConversation = Conversation<MyContext>;
const bot = new Bot<MyContext>(process.env.BOT_TOKEN);

async function createCategoryKeyboard(){
  const categories = [{id: "1", name: 'Mercado'}, {id:"2", name: 'Restaurante'}]
  const trans = await getTransactions();
  const categoryKeyboard = new InlineKeyboard();
  categories.forEach(category =>{
    categoryKeyboard.text(category.name, category.id).row()
  });
  trans.forEach(tx =>{
    categoryKeyboard.text(tx.description, tx.description)
  });
  return categoryKeyboard;
}

async function registerTransaction(conversation: MyConversation, ctx: MyContext) {
  let transactionData: Transaction = {
    description: '',
    value: 0,
    categoryId: 0,
    userId: ctx.from.id,
    registerDate: new Date(),
    isShared: false
  };
  const transactionTypeKeyboard = new InlineKeyboard().text('Gasto').text('Ingreso').text('Prestamo');
  const isSharedKeyboard = new InlineKeyboard().text('Si', 'true').text('No', 'false');
  const categoriesKeyboard = await conversation.external(()=> createCategoryKeyboard());
  await ctx.reply('Tipo de transacción: ', { reply_markup: transactionTypeKeyboard });
  const resTransactionType = await conversation.waitFor('callback_query',()=>{ctx.reply('Escoge del menú')});
  resTransactionType.deleteMessage();
  //resTransactionType.editMessageReplyMarkup({reply_markup:undefined});
  //const res = await conversation.waitForCallbackQuery(RegExp('^inlineKey'));
  await ctx.reply(`Tipo escogido: ${resTransactionType.update.callback_query.data}`);
  if(resTransactionType.update.callback_query.data === 'Gasto'){
    await ctx.reply('¿Es compartido?: ', { reply_markup: isSharedKeyboard });
    const resIsShared = await conversation.waitFor('callback_query', ()=>{ctx.reply('Escoge del menú')});
    resIsShared.deleteMessage();
    transactionData.isShared = JSON.parse(resIsShared.update.callback_query.data);
    await ctx.reply(`Compartido: ${resIsShared.update.callback_query.data}`);
    /*await ctx.reply('Categoria? ', { reply_markup: categoriesKeyboard });
    const resCategory = await conversation.waitFor('callback_query')
    transactionData.categoryId = parseInt(resCategory.update.callback_query.data);
    await ctx.reply(`Categoria: ${transactionData.categoryId}`);*/
  }
  await ctx.reply('Valor?');
  transactionData.value = await conversation.form.number(()=>{ctx.reply('Debe ser un número valido')});
  await ctx.reply(`Valor ${transactionData.value}`);
  await ctx.reply(`JSON:${JSON.stringify(transactionData)}`);
  //conversation.external(()=>createTransaction(transactionData));
  await ctx.reply('Chao');
  return;
}

bot.use(session({ initial: () => ({}) }));
bot.use(conversations());
bot.use(createConversation(registerTransaction));

bot.command('start', async (ctx) => {
  ctx.reply(`Bienvenido ${JSON.stringify(ctx.from)}! Bot Up and running!!.`);
});

bot.command('tx', async (ctx) => {
  ctx.reply('Registrar Transacción');
  await ctx.conversation.enter('registerTransaction');
});

bot.on('message', (ctx) => ctx.reply('Usa los comandos!'));

bot.api.setMyCommands([
  { command: 'tx', description: 'Registrar transacción' },
  { command: 'start', description: 'Bienvenida' },
]);

if (process.env.NODE_ENV === 'production') {
  const app = express();
  app.use(express.json());
  app.use(webhookCallback(bot, 'express'));

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Bot listening on port ${PORT}`);
  });
} else {
  bot.start();
}