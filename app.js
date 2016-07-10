const
    express = require("express"),
    app = express(),
    bodyParser  = require("body-parser"),
    methodOverride = require("method-override"),
    fs = require('fs'),
    path = require('path'),
    contentTypes = require('./utils/content-types'),
    sysInfo = require('./utils/sys-info'),
    env = process.env;


app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(methodOverride());

var router = express.Router();

var respondStaticUrl = function(url, res) {
  fs.readFile('./static' + url, function (err, data) {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
    } else {
      let ext = path.extname(url).slice(1);
      res.setHeader('Content-Type', contentTypes[ext]);
      if (ext === 'html') {
        res.setHeader('Cache-Control', 'no-cache, no-store');
      }
      res.end(data);
    }
  });
}

router.get('/', function(req, res) {
  respondStaticUrl("/index.html", res);
});

router.get('/health', function(req, res) {
  res.writeHead(200);
  res.end();
});

var infoGenPollResponse = function (req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-cache, no-store');
  res.end(JSON.stringify(sysInfo[url.slice(6)]()));
}

router.get('/info/gen', infoGenPollResponse);
router.get('/info/poll', infoGenPollResponse);

app.use(router);

app.listen(env.NODE_PORT || 3000, env.NODE_IP || 'localhost', function () {
  console.log(`Application worker ${process.pid} started...`);
});
