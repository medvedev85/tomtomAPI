const TaskManager = require('./taskManager');
const taskManager = new TaskManager(10);
const makeRandom = require('./common');
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

function queryCreator(motif, client, onJobFinished) {
  return () => {
    return new Promise((resolve, reject) => {
      let dir = `${_taskDir}/` + makeRandom(20);
      client.dirs.push(dir);
      dirCreator(dir); //создали папку
      let str = `${_memePath}/scripts/iupac2meme ${motif} > ${dir}/query_motifs`;

      function requestInTomtom(dir, motif, onJobFinished) {

        console.log("функция requestInTomtom запустилась ", dir);
        const fs = require("fs");
        let str = `${_memePath}/src/tomtom -no-ssc -oc ${dir} -evalue -dist pearson -thresh 10.0 -time 100 ${dir}/query_motifs ${_memePath}/db/JASPAR/JASPAR2020_CORE_non-redundant_pfms_meme`;
        execProcess(str, () => {
          let tomtom = parseTomtom(dir, motif); //получили JSON из tomtom.tsv

          deleteDir(dir); //удаляем папку после отправки ответа
          
          console.log("finished tomtom");
          onJobFinished(tomtom);
          resolve();
        });
        console.log("создаем tsv и xml файлы");

      }
      execProcess(str, () => { requestInTomtom(dir, motif, onJobFinished); });
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

let startJob = function (motif, client, requestId, onJobFinished) {
  let task = queryCreator(motif, client, onJobFinished); //создали query_motifs.txt
  taskManager.setNewTask(client, requestId, task);
}

module.exports = startJob;


/*
1) таскменеджер с тестами
2) исправить историю, + добавить в историю текущий реквест id
3) удаление задач
4) база + добавить статус в requests (в работе, остановлен, досчитан)
5) база: results переименовать в task, хранить все запросы, если завершен - заполнить результатом
*/