import 'babel-polyfill'
import fetch from 'node-fetch'
import 'colors'
import { findAPortNotInUse } from 'portscanner'
import _ from 'lodash'
import Koa from 'koa'
import http from 'http'
import bodyParser from 'koa-bodyparser'
import Router from 'koa-router'
import { Mailgun } from 'mailgun'
import nodemailer from 'nodemailer'
const router = Router()
const app = new Koa()
const server = require('http').Server(app.callback())

/* DEPENDING ON IF YOU USE MAILGUN OR SMTP, YOU WILL COMMENT OUT ONE VARIABLE*/
const mg = new Mailgun(/* ENTER YOUR MAILGUN API KEY HERE AS A STRING */)
const smtp = nodemailer.createTransport({
  host: 'smtp-mail.outlook.com',
  port: 587,
  auth: {
    user: 'EMAIL@DOMAIN.COM', // ENTER YOUR EMAIL USERNAME HERE
    pass: 'PASSWORD' // ENTER YOUR PASSWORD HERE
  }
})
/* DEPENDING ON IF YOU USE MAILGUN OR SMTP, YOU WILL COMMENT OUT ONE VARIABLE*/

let pastSentEmail
const getAvailibility = async () => {
  process.stdout.write('!')
  let contact = false
  const resp = await fetch('https://reserve.cdn-apple.com/US/en_US/reserve/iPhone/availability.json')
  const respJson = await resp.json()
  const stores = { // THIS IS THERE YOU PUT THE LIST OF STORES YOU WANT CHECKED. USE THE STORES.JSON TO FIND THE STORE IDS
    Carlsbad: 'R294',
    'North County': 'R285',
    UTC: 'R082',
    'Fashion Valley': 'R040',
    'Chula Vista': 'R213',
  }
  const isAvailibleJson = model => {
    const resp = {}
    _.each(stores, (storeId, storeName) => {
      const noneOrAll = _.get(respJson, [storeId, model])
      const isNone = noneOrAll === 'NONE'
      const isAll = noneOrAll === 'ALL'
      if (isAll) {
        resp[storeName] = true
        contact = true
      }
    })
    return resp
  }
  const availability = { // THIS IS THERE YOU PUT THE LIST OF PHONES YOU WANT CHECKED. USE THE PRODUCT-OFFERING.JSON TO FIND THE PHONE MODELS
    'T-Mobile': {
      'iPhone 7': {
        'Jet Black': {
          '125GB': isAvailibleJson('MNA52LL/A'),
          '256GB': isAvailibleJson('MNAA2LL/A'),
        }
      },
      'iPhone 7 Plus': {
        'Jet Black': {
          '125GB': isAvailibleJson('MN5L2LL/A'),
          '256GB': isAvailibleJson('MN5R2LL/A'),
        }
      }
    }
  }
  const body = {
    contact,
    availability,
    link: 'https://reserve.cdn-apple.com/US/en_US/reserve/iPhone/availability?channel=1&sourceID=email&rv=0&path=&iPP=U&appleCare=Y',
  }
  if (contact) process.stdout.write('.')
  if (contact && JSON.stringify(pastSentEmail) !== JSON.stringify(body)) {
    console.log(JSON.stringify(availability, null, 2))
    pastSentEmail = body
    /* DEPENDING ON IF YOU USE MAILGUN OR SMTP, YOU WILL COMMENT OUT ONE AREA*/
    mg.sendText('EMAIL@DOMAIN.COM' /* PUT YOUR SENDER ADDRESS HERE */, ['EMAIL@DOMAIN>COM' /* PUT YOUR "SEND TO" EMAIL HERE */], 'Good news! An iPhone reservation is availible!', `<pre>${JSON.stringify(body, null, 2)}</pre>`)
    const mailOptions = {
      from: '"FIRSTNAME LASTNAME" <EMAIL@DOMAIN.COM>', /* PUT YOUR SENDER ADDRESS HERE */
      to: 'EMAIL@DOMAIN.COM', /* PUT YOUR "SEND TO" EMAIL HERE */
      subject: 'Good news! An iPhone reservation is availible!',
      html: `<pre>${JSON.stringify(body, null, 2)}</pre>`
    }
    smtp.sendMail(mailOptions, (err, info) => {
      if (err) console.error(err)
      else console.log('Message sent: ' + info.response);
    })
    /* DEPENDING ON IF YOU USE MAILGUN OR SMTP, YOU WILL COMMENT OUT ONE AREA*/
  }
  return body
}
setInterval(getAvailibility, 10000)
const entry = (async (f) => {
  findAPortNotInUse(1337, 1337, '127.0.0.1', (err, port) => {
    if (err) throw err
    router
      .get('/getAvailibility', async (ctx, next) => {
        try {
          await next()
          ctx.body = await getAvailibility()
        } catch (err) {
          ctx.body = err
        }
      })
    app
      .use(bodyParser())
      .use(router.routes())
      .use(router.allowedMethods())
      .use((ctx, next) => {
        console.log(ctx.url)
        return next()
      })
    server.listen(port)
    console.log('Listening to port', port)
  })
})()
