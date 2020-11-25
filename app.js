const WebSocketServer = new require('ws');
const saveSession = 604800; //хранить сессии 7 дней

// подключенные клиенты
let clients = {};
// папки на каждый запрос
let calls = {};
// очередь
let round = [];
// сейчас в работе
let inWork = [];
// сохраненные сессии
let oldSession = {};

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

function queryCreator(motif, dir) {
    console.log("queryCreator: " + dir);
    let str = `../meme-5.2.0/scripts/iupac2meme ${motif} > ${dir}/query_motifs`;
    execProcess(str, () => { console.log("старт requestInTomtom"); requestInTomtom(dir) });
}

function requestInTomtom(dir) {
    console.log("функция requestInTomtom запустилась ", dir);
    const fs = require("fs");
    console.log("requestInTomtom: " + dir);
    let str = `../meme-5.2.0/src/tomtom -no-ssc -oc ${dir} -evalue -dist pearson -thresh 10.0 -time 100 ${dir}/query_motifs ../meme-5.2.0/db/JASPAR/JASPAR2020_CORE_non-redundant_pfms_meme`;
    execProcess(str, () => {
        endJob(dir);
        console.log("finished tomtom")
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

function parseTomtom(dir) {
    const fs = require("fs");
    let fileTsv = tsvJSON(fs.readFileSync(`${dir}/tomtom.tsv`, "utf8"));
    let fileXml = xmlJSON(fs.readFileSync(`${dir}/tomtom.xml`, "utf8"));

    return '{"announce": "tomtom", "msg": {"tsv": ' + JSON.stringify(fileTsv, null, 4) + ', "xml": ' + fileXml + '}}';
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

function makeRandom(liters) {
    let text = "";
    let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (let i = 0; i < liters; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return text;
}

function startJob(motifs, id) {
    let dir = '../meme-5.2.0/apiDir/' + makeRandom(20);
    calls[id].push(dir);
    inWork.push(motifs);

    console.log("new dir: " + calls[id]);

    dirCreator(dir); //создали папку
    queryCreator(motifs, dir); //создали query_motifs.txt
}

function endJob(dir) {
    let tomtom = parseTomtom(dir); //получили JSON из tomtom.tsv
    console.log("endJob: начало");

    for (let key in calls) {
        let room = calls[key];
        for (let i = 0; i <= room.length; i++) {
            if (room[i] === dir) {
                console.log("endJob: отправляем сообщение на фронт");
                clients[key].send(tomtom);

                oldSession[key].push(tomtom);
                setTimeout(() => { delete oldSession[key]; }, saveSession);
            }
        }
    }

    inWork.pop();

    if (round.length) {
        let nextMotif = round.pop();

        startJob(nextMotif["message"], nextMotif["id"]);
    }

    deleteDir(dir); //удаляем папку после отправки ответа
}

function security(str) {
    return /^[atgcwrkdmyhsvbnATGCWRKDMYHSVBN ]+$/.test(str);
}

function toastmaster(message, id) {
    if (inWork.length < 10) {
        startJob(message, id);
    } else {
        round.push({ "message": message, "id": id });
    }
}

function informQueues() {
    for (let i in clients) {
    }
}

function checkOldSession(id) {
    if (oldSession[id]) {
        return true;
    } else {
        return false;
    }
}

// WebSocket-сервер на порту 3000
let webSocketServer = new WebSocketServer.Server({ port: 3000 });
webSocketServer.on('connection', function (ws) {
    let id = "";
    let str = "";

    try {
        str = '{"announce":"session","msg":"true"}';
        ws.send(str);
        console.log("Начинаем обмен данными с новым клиентом");
    } catch (error) {
        console.log("Ошибка: не удается отправить тестовый запрос");
    }

    ws.on('message', function (incomingMessage) {
        message = JSON.parse(incomingMessage);
        let announce = message["announce"];
        let msg = message["msg"];

        switch (announce) {
            case "tomtom":
                if (security(msg)) {
                    calls[id] = [];
                    oldSession[id] = [];
                    toastmaster(msg, id);
                } else {
                    str = '{"announce":"error","msg":"Error: invalid motive format"}';
                    clients[id].send(str);
                }
                break;
            case "cookie":
                if (msg == "needCookie") {
                    id = makeRandom(20);
                    str = `{"announce":"cookie", "msg":"${id}"}`;
                    clients[id] = ws;
                    ws.send(str);
                    console.log("новое соединение " + id);
                } else {
                    id = msg;
                    clients[msg] = ws;
                    console.log("восстановлено соединение " + id);

                    let old = checkOldSession(id);

                    if(old) {
                        str = '{"announce":"reminder","msg":"have old session"}';
                        ws.send(str);
                    }
                }
                break;
        }
    });

    ws.on('close', function () {
        console.log('соединение закрыто ' + id);
        delete clients[id];
        delete calls[id];
    });

});

console.log("Сервер запущен");