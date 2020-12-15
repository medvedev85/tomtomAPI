const TaskManager = require('./taskManager');
const taskManager = new TaskManager(10);
const _memePath = "/home/ubuntu/meme-5.2.0";
const _taskDir = "/home/ubuntu/workDir";

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

function queryCreator(msg, dir, onJobFinished) {

  let motif = msg.motif;
  let str = `${_memePath}/scripts/iupac2meme ${motif} > ${dir}/query_motifs`;
  return () => {
    return new Promise((resolve, reject) => {
      function requestInTomtom(dir, msg, onJobFinished) { //должен возвращать функцию, которая возвращает промис

        console.log("функция requestInTomtom запустилась ", dir);
        const fs = require("fs");
        let str = `${_memePath}/src/tomtom -no-ssc -oc ${dir} -evalue -dist pearson -thresh 10.0 -time 100 ${dir}/query_motifs ${_memePath}/db/JASPAR/JASPAR2020_CORE_non-redundant_pfms_meme`;
        execProcess(str, () => {
          let motif = msg.motif;
          let tomtom = parseTomtom(dir, motif); //получили JSON из tomtom.tsv

          deleteDir(dir); //удаляем папку после отправки ответа
          //endJob(dir, msg, onJobFinished);
          console.log("finished tomtom");
          onJobFinished(tomtom);
          resolve();
        });
        console.log("создаем tsv и xml файлы");

      }
      execProcess(str, () => { requestInTomtom(dir, msg, onJobFinished); });
    });
  }
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

function saveSession(client, requestId, tomtom) {
  let date = new Date();
  let obj = {
    requestId: requestId,
    date: date,
    visitCounter: client.visitCounter,
    tomtom: tomtom,
  };

  client.oldSession.push(obj);
}

let startJob = function (msg, client, onJobFinished) {
  let dir = `${_taskDir}/` + makeRandom(20);

  client.dirs.push(dir);

  dirCreator(dir); //создали папку
  let task = queryCreator(msg, dir, onJobFinished); //создали query_motifs.txt
  taskManager.setNewTask(client, task);
}

module.exports = {
  startJob: startJob,
  makeRandom: makeRandom
};