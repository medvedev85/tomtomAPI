const WebSocketServer = new require('ws');
//const sessionExpireMs = 604800000; //хранить сессии 7 дней
const sessionExpireMs = 30000; //хранить сессии 7 дней (сейчас не используется)
const maxthreads = 10; //сколько можем обрабатывать запросов одновременно

let sessions = {
    clients: [], // все клиенты
    threads: [], // потоки для tomtom
    queue: [] // откуда идет отсчет
};

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

function queryCreator(msg, dir) {
    let motif = msg.motif;
    let str = `../meme-5.2.0/scripts/iupac2meme ${motif} > ${dir}/query_motifs`;
    execProcess(str, () => { requestInTomtom(dir, msg) });
}

function requestInTomtom(dir, msg) {
    console.log("функция requestInTomtom запустилась ", dir);
    const fs = require("fs");
    let str = `../meme-5.2.0/src/tomtom -no-ssc -oc ${dir} -evalue -dist pearson -thresh 10.0 -time 100 ${dir}/query_motifs ../meme-5.2.0/db/JASPAR/JASPAR2020_CORE_non-redundant_pfms_meme`;
    execProcess(str, () => {
        endJob(dir, msg);
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

function makeRandom(liters) {
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

function startJob(msg, client) {
    //informQueues();
    let dir = '../meme-5.2.0/apiDir/' + makeRandom(20);

    console.log(111)
    client.dirs.push(dir);
    sessions.threads.push(msg);

    dirCreator(dir); //создали папку
    queryCreator(msg, dir); //создали query_motifs.txt
}

function endJob(dir, msg) {
    let motif = msg.motif;
    let requestId = msg.requestId;
    let tomtom = parseTomtom(dir, motif); //получили JSON из tomtom.tsv

    for (let i = 0; i < sessions.clients.length; i++) {
        let dirs = sessions.clients[i].dirs;

        for (let j = 0; j < dirs.length; j++) {
            if (dirs[j] === dir) {
                console.log("endJob: отправляем сообщение на фронт");
                sessions.clients[i].ws.send(tomtom);
                saveSassion(sessions.clients[i], requestId, tomtom);
                dirs.splice(j, 1);
            }
        }
    }

    queueManager();

    deleteDir(dir); //удаляем папку после отправки ответа
}

function security(str) {
    return /^[atgcwrkdmyhsvbnATGCWRKDMYHSVBN ]+$/.test(str);
}

function queueManager() {
    let { clients, threads, queue } = sessions;
    let repeat = false;

    for (let i = 0; i < clients.length; i++) {
        let client = clients[i];

        if (client.queue.length) {
            let msg = client.queue.pop();
            queue.push({ msg, client });
            client.queue.splice(i, 1);
        }

        if (client.queue.length) {
            repeat = true;
        }
    }

    if (repeat) {
        queueManager();
        return false;
    }

    if (queue.length) {
        for (let j = 0; j < queue.length; j++) {
            if (threads.length < maxthreads) {
                threads.push(queue[j]);
                queue.splice(j, 1);
            }
        }
    }


    if (threads.length) {
        for (let k = 0; k < threads.length; k++) {
            let { msg, client } = threads[k];
            console.log(msg)

            startJob(msg, client);
            threads.splice(k, 1);
        }
    }
}

function startQueue() {
    let { threads, queue } = sessions;

    if (!queue.length) {
        queueManager();
    }
}

function informQueues() {
    for (let id in sessions.clients) {
        for (let j = 0; j < queue.length; j++) {
            if (id == queue[j]["id"]) {
                let str = `{"method":"queue","msg":"Ваша позиция в очереди: ${j + maxthreads}, вся очередь: ${queue.length + maxthreads}"}`;
                sessions.clients[id].send(str);
            }
        }
    }
}

function checkOldSession(client) {
    if (client.oldSession.length) {
        return true;
    } else {
        return false;
    }
}

class Client {
    constructor(ws, id) {
        this.ws = ws;
        this.id = id;
        this.dirs = [];
        this.queue = [];
        this.oldSession = [];
        this.visitCounter = 1;
        this.active = true;
    }
}

// WebSocket-сервер на порту 3000
let webSocketServer = new WebSocketServer.Server({ port: 3000 });
webSocketServer.on('connection', function (ws) {
    let client;
    let str = "";
    let id = "";

    try {
        str = '{"method":"session","msg":"true"}';
        ws.send(str);
        console.log("Начинаем обмен данными с новым клиентом");
    } catch (error) {
        console.log("Ошибка: не удается отправить тестовый запрос");
    }

    ws.on('message', function (incomingMessage) {
        let message = {};
        let method = "";
        let msg = "";

        try {
            message = JSON.parse(incomingMessage);
            method = message["method"];
            msg = message["msg"];
        } catch (error) {
            str = '{"method":"error","msg":"Error: invalid data format"}';
            ws.send(str);
        }

        switch (method) {
            case "tomtom": //сделать реквест (пусть приходит с фронта объединение мотивов в один запрос)
                if (security(msg.motif)) {
                    client.queue.push(msg);
                    startQueue();
                } else {
                    str = '{"method":"error","msg":"Error: invalid motive format"}';
                    client.ws.send(str);
                }
                break;
            case "cookie":
                if (msg == "needCookie") {
                    id = makeRandom(20);
                    client = new Client(ws, id);
                    sessions.clients.push(client);
                    str = `{"method":"cookie", "msg":"${id}"}`;
                    ws.send(str);
                    console.log("новое соединение " + id);
                } else {
                    id = msg;
                    let oldClients = false;

                    for (let i = 0; i < sessions.clients.length; i++) {
                        if (sessions.clients[i].id == id) {
                            client = sessions.clients[i];
                            client.ws = ws;
                            client.visitCounter++;
                            client.active = true;
                            oldClients = true;
                        }
                    }

                    if (!oldClients) {
                        client = new Client(ws, id);
                        sessions.clients.push(client);
                    }

                    console.log("восстановлено соединение " + id);

                    let old = checkOldSession(client);

                    if (old) {
                        str = '{"method":"reminder","msg":"have old session"}';
                        ws.send(str);
                    }
                }
                break;
        }
    });

    ws.on('close', function () {
        console.log('соединение закрыто ' + id);
        client.active = false;
    });

});

console.log("Сервер запущен");