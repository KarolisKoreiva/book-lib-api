'use strict';

const express = require('express');
const logger = require('morgan');
const Cloudant = require('@cloudant/cloudant');
const bodyParser = require('body-parser');
const cfenv = require('cfenv');
const vcapLocal = {}; //(require('./vcap-local.json')) ? require('./vcap-local.json') : {};

// Global constants
const app = express();
const appEnv = cfenv.getAppEnv(vcapLocal ? {vcap: vcapLocal} : {});
var db;

// Database init
Cloudant(appEnv.getServiceCreds('cloudant-kk'),
  (error, cloudant, pong) => {
    if (error) {
      return console.log('Failed to initialize Cloudant: ' + error.message);
    }
    console.log('Database initialized. Welcome to ' + pong.vendor.name);
    cloudant.db.list((error, dblist) => {
      if (error) {
        return console.log(error);
      }
      dblist.forEach(singleDb => {
        if (singleDb.toString() === 'book-lib-kk') {
          db = cloudant.db.use('book-lib-kk');
          console.log('Connected to ' + singleDb + ' database');
        } else {
          cloudant.db.create('book-lib-kk', (error, db) => {
            if (error) {
              return console.log(error);
            }
            console.log('Database ' + db + ' created.');
          });
          console.log('Not connected to ' + singleDb);
        }
      });
    });
  });

let clearedDoc = {
  title: String,
  author: String,
  year: String,
  description: String,
  genre: [],
};

// Initialization
app.use(logger('dev'));
app.use(bodyParser.urlencoded({
  extended: true,
}));
app.use(bodyParser.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,PATCH,DELETE');
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});
app.use(express.static(__dirname + '/public'));

// Handling requests
app.get('/', (req, res) => {
  res.sendfile('index.html');
});

app.get('/books', (req, res) => {
  let resDoc = [];
  db.list({ include_docs: true }, (error, body) => {
    if (error) {
      return console.log(error);
    }
    body.rows.forEach(document => {
      console.log(document.doc);
      clearedDoc = document.doc;
      resDoc.push(clearedDoc);
    });
    res.send(resDoc);
  });
});

app.get('/book/:id', (req, res) => {
  let id = req.params.id;
  db.get(id, (error, body) => {
    if (error) {
      return console.log(error);
    }
    console.log(body);
    res.send(body);
  });
});

app.post('/book', (req, res) => {
  db.insert(req.body, (error, response) => {
    if (error) {
      return console.log(error);
    }
    console.log(response);
    res.send(response);
  });
});

app.put('/book', (req, res) => {
  db.insert(req.body, (error, response) => {
    if (error) {
      return console.log(error);
    }
    console.log(response);
    res.send(response);
  });
});

app.delete('/book/:id/:rev', (req, res) => {
  let id = req.params.id;
  let rev = req.params.rev;
  db.destroy(id, rev, (error, response) => {
    if (error) {
      return console.log(error);
    }
    console.log(response);
    res.send(response);
  });
});

// Starting server
var port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log('Server started on ' + port);
});
