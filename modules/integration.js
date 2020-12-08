function dirCreator(dir) {
  console.log("dirCreator: " + dir);
  const fs = require("fs");

  if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
  }
}

function execProcess(command, callback) {
  console.log("execProcess: ", command);
  let process = require("child_process").exec(command);

  process.on('exit', () => {
      console.log("process exited: ", command);
      if (callback) {
          console.log("running callback: ");
          callback();
      }
  });
}

function queryCreator(msg, dir, clients) {
  let motif = msg.motif;
  let str = `../meme-5.2.0/scripts/iupac2meme ${motif} > ${dir}/query_motifs`;
  execProcess(str, () => { requestInTomtom(dir, msg, clients) });
}

function requestInTomtom(dir, msg, clients) {
  console.log("функция requestInTomtom запустилась ", dir);
  const fs = require("fs");
  let str = `../meme-5.2.0/src/tomtom -no-ssc -oc ${dir} -evalue -dist pearson -thresh 10.0 -time 100 ${dir}/query_motifs ../meme-5.2.0/db/JASPAR/JASPAR2020_CORE_non-redundant_pfms_meme`;
  execProcess(str, () => {
      endJob(dir, msg, clients);
      console.log("finished tomtom");
  });
  console.log("создаем tsv и xml файлы");
}

function tsvJSON(inputTsv) {
  if (!inputTsv) {
      console.log("error: not found tomtom.tsv");
      return;
  }

  let tsv = inputTsv.slice(0, inputTsv.indexOf("#") - 2);
  let lines = tsv.split('\n');
  let headers = lines.shift().split('\t');

  return lines.map(line => {
      let data = line.split('\t');

      return headers.reduce((obj, nextKey, index) => {
          obj[nextKey] = data[index];

          return obj;
      }, {});
  });
}

function xmlJSON(inputXml) {
  const xml2js = require('xml2js');
  let json;

  xml2js.parseString(inputXml, (err, result) => {
      if (err) {
          throw err;
      }

      json = JSON.stringify(result, null, 4);
  });

  return json;
}

function parseTomtom(dir, motif) {
  const fs = require("fs");
  let fileTsv = tsvJSON(fs.readFileSync(`${dir}/tomtom.tsv`, "utf8"));
  let fileXml = xmlJSON(fs.readFileSync(`${dir}/tomtom.xml`, "utf8"));

  return '{"method": "tomtom", "msg": {"motif": "' + motif + '", "tsv": ' + JSON.stringify(fileTsv, null, 4) + ', "xml": ' + fileXml + '}}';
}

function deleteDir(path) {
  const fs = require("fs");

  if (fs.existsSync(path)) {
      fs.readdirSync(path).forEach(function (file) {
          let curPath = path + "/" + file;

          if (fs.lstatSync(curPath).isDirectory()) {
              deleteFolderRecursive(curPath);
          } else {
              fs.unlinkSync(curPath);
          }
      });

      fs.rmdirSync(path);
  }
};

let makeRandom = function (liters) {
  let text = "";
  let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (let i = 0; i < liters; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return text;
}

function saveSassion(client, requestId, tomtom) {
  let date = new Date();
  let obj = {
      requestId: requestId,
      date: date,
      visitCounter: client.visitCounter,
      tomtom: tomtom,
  };

  client.oldSession.push(obj);
}

let startJob = function (msg, client, clients) {
  //informQueues();
  let dir = '../meme-5.2.0/apiDir/' + makeRandom(20);

  console.log(client)
  client.dirs.push(dir);

  dirCreator(dir); //создали папку
  queryCreator(msg, dir, clients); //создали query_motifs.txt
}

function endJob(dir, msg, clients) {
  let motif = msg.motif;
  let requestId = msg.requestId;
  let tomtom = parseTomtom(dir, motif); //получили JSON из tomtom.tsv

  for (let i = 0; i < clients.length; i++) {
      let dirs = clients[i].dirs;

      for (let j = 0; j < dirs.length; j++) {
          if (dirs[j] === dir) {
              console.log("endJob: отправляем сообщение на фронт");
              clients[i].ws.send(tomtom);
              saveSassion(clients[i], requestId, tomtom);
              dirs.splice(j, 1);
          }
      }
  }

  deleteDir(dir); //удаляем папку после отправки ответа
}

module.exports = {
  startJob: startJob,
  makeRandom: makeRandom
};