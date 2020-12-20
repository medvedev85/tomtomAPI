const WebSocketServer = new require('ws');
const startJob = require('./modules/integration');
const Client = require('./modules/clientConstructor');
const makeRandom = require('./modules/common');
const webSocketServer = new WebSocketServer.Server({ port: 3000 });
const sequelize = require('./modules/dbConstructor');
let clients = []; // все клиенты

function security(str) {
    return /^[atgcwrkdmyhsvbnATGCWRKDMYHSVBN ]+$/.test(str);
}

//https://sequelize.org/ - старый, можно найти поновее
// nodejs ORM (sequalize)  mongo, postgres, sqlite3, 
// tables:
// clients: id, дата последнего входа
// 1: petya 
// 2: vasya


// requests: id(requestsId), clientId(foreign key), дата создания
// 1: 1(вася напр.)
// 2: 1
// 3: 2
// 4: 1


// results: id, requestId, tomtom, можно добавить время на выполнение запроса
// 1: 1: {json}
// 2: 1: {json}
// .... 
// 

// один ко многим: client -> request
// один ко многим: request -> result

// 1-1, 1-n, n-m

// id . db.Clients.find(id) -> db.Request.findByClicentid(clientId) -> db.Results.find(requestId) -> ... {json} -
//

sequelize.sync().then(result=>{
    console.log(result);
  })
  .catch(err=> console.log(err));

function checkOldSession(client) {
    for (let requestId in client.oldSession) {
        if (client.oldSession[requestId]) {
            return true
        }
    }
    return false;
}

function saveSession(client, requestId, tomtom) {
    let date = new Date();

    if (!client.oldSession[requestId]) {
        client.oldSession[requestId] = [];
    }

    client.oldSession[requestId].unshift({
        date: date.getDate() + "." + (date.getMonth() + 1) + "." + date.getFullYear(),
        tomtom: tomtom
    });
}

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
        let requestId = "";

        try { //переделать на ифы
            message = JSON.parse(incomingMessage);
            method = message["method"];
            msg = message["msg"];
        } catch (error) {
            str = '{"method":"error","msg":"Error: invalid data format"}';
            ws.send(str);
        }

        switch (method) {
            case "tomtom":
                requestId = msg.requestId;

                for (let i = 0; i < msg.motifs.length; i++) {
                    let motif = msg.motifs[i];
                    if (security(motif)) {
                        let onJobFinished = (tomtom) => {
                            client.ws.send(tomtom);
                            saveSession(client, requestId, tomtom);
                        }

                        startJob(motif, client, requestId, onJobFinished);
                    } else {
                        str = `{"method":"error","msg":"Error: invalid motive format (${motif})"}`;
                        client.ws.send(str);
                    }
                }
                break;

            case "requestOld":
                console.log(msg)
                requestId = msg.requestId;
                let requestedSession = client.oldSession[requestId];
                client.ws.send(JSON.stringify(requestedSession));
                break;

            case "requestHistory":
                let old = checkOldSession(client);

                if (old) {
                    let requests = [];

                    for (let requestId in client.oldSession) {
                        let date = client.oldSession[requestId][0].date;

                        requests.push({ requestId, date });
                    }

                    str = `{"method":"history","msg":${JSON.stringify(requests)}}`;
                    ws.send(str);
                }
                break;

            case "deleteOldRequest":
                requestId = msg.requestId;

                delete client.oldSession[requestId];
                
                break;

            case "cookie":
                if (msg == "needCookie") {
                    id = makeRandom(20);
                    client = new Client(ws, id);

                    clients.push(client);
                    str = `{"method":"cookie", "msg":"${id}"}`;
                    ws.send(str);
                    console.log("новое соединение " + id);
                } else {
                    id = msg;
                    let oldClients = false;

                    for (let i = 0; i < clients.length; i++) {
                        if (clients[i].id == id) {
                            client = clients[i];

                            client.ws = ws;
                            //client.visitCounter++;
                            client.active = true;
                            oldClients = true;
                        }
                    }

                    if (!oldClients) {
                        client = new Client(ws, id);
                        clients.push(client);
                    }

                    console.log("восстановлено соединение " + id);

                    let old = checkOldSession(client);

                    if (old) {
                        let requests = [];

                        for (let requestId in client.oldSession) {
                            let date = client.oldSession[requestId][0].date;

                            requests.push({ requestId, date });
                        }

                        str = `{"method":"history","msg":${JSON.stringify(requests)}}`;
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