if (process.env.NODE_ENV === 'development') {
  require('dotenv-safe').config();
}

const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const compression = require('compression');
const helmet = require('helmet');
const cors = require('cors');
const passport = require('passport');

const app = express();
const path = require('path');
const initMongo = require('./config/mongo');

// Setup express server port from ENV, default: 3000
app.set('port', process.env.PORT || 5000);
// Enable only in development HTTP request logger middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
// for parsing json
app.use(
  bodyParser.json({
    limit: '20mb',
  }),
);
// for parsing application/x-www-form-urlencoded
app.use(
  bodyParser.urlencoded({
    limit: '20mb',
    extended: true,
  }),
);

// Init all other stuff
app.use(cors());
app.use(passport.initialize());
app.use(compression());
app.use(
  helmet({
    contentSecurityPolicy: false,
  }),
);
app.use(express.static(`${__dirname}/public`));
app.set('views', path.join(__dirname, 'views'));
// app.engine('html', require('ejs').renderFile)
app.set('view engine', 'html');
app.use('/api', require('./routes/api/index.js'));
app.use('/woocommerce', require('./webhooks/woocommerce'));
app.use('/support-board', require('./webhooks/supportBoard'));

// require('./exportarContactos.js');

// Handle Production
// if (process.env.NODE_ENV === 'production') {
// static folder
// Handle SPA
app.get(/.*/, (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});
// }

app.listen(app.get('port'));

// Init MongoDB
initMongo();
//sincronizar todofull con google contact
if (process.env.NODE_ENV === 'production') {
  require('./sync/googlePeople');
  require('./CronJobs/cron-jobs');
}
//gestion global de errores
process.on('uncaughtException', function (err) {
  console.log('JF -> Caught exception: ' + err);
});
