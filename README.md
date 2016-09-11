# Apple Reservations Checker

### Requirements

You either need to use (Mailgun)[http://mailgun.com] or an email provider that supports SMTP and [NodeJS](https://nodejs.org) v6.5.0.

### Configuration

#### Clone repo

```bash
git clone git@github.com:MystK/apple-reservations-checker.git
cd apple-reservations-checker
```

#### Install NPM dependencies

```bash
npm install
```

#### Edit config file

Edit the code in `.env` and set either your Mailgun API key or your SMTP credentials as well as your email notification settings (TO_EMAIL, FROM_EMAIL, etc).
If you use SMTP, change `MAIL_DRIVER` to "smtp".

#### Start the checker
```bash
npm start
```
