var express = require('express'),
    http = require('http'),
    fs = require('fs');

var app = express();

// Задаем пути поиска css и img файлов
app.use('/', express.static(__dirname));

// Создаем сервер
http.createServer(app).listen(80, function(){
  console.log("Server started");
});

// При входе на главную страницу выдаем index.html
app.get('/', function(req, res, next){
  fs.readFile('./html/motif_locations.html', function(err, info){
    if (err) throw err;
    res.end(info);
  })
});

