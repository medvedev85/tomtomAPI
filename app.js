const WebSocketServer = new require('ws');
const { startJob, makeRandom } = require('./modules/integration.js');
const Client = require('./modules/clientConstructor.js');
const { json } = require('express');
const webSocketServer = new WebSocketServer.Server({ port: 3000 });

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

function checkOldSession(client) {
    for (let requestId in client.oldSession) {
        if (client.oldSession[requestId]) {
            return true
        }
    }
    return false;
}

function saveSession(client, requestId, tomtom) {
    let date = new Date()

    if (!client.oldSession[requestId]) {
        client.oldSession[requestId] = [];
    }

    client.oldSession[requestId].push({
        date: date.getDate() + "." + date.getMonth() + "." + date.getFullYear(),
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
                if (security(msg.motif)) {
                    let onJobFinished = (tomtom) => {
                        let requestId = msg.requestId;

                        client.ws.send(tomtom);
                        saveSession(client, requestId, tomtom);
                    }

                    startJob(msg, client, onJobFinished);
                } else {
                    str = '{"method":"error","msg":"Error: invalid motive format"}';
                    client.ws.send(str);
                }
                break;
            case "requestOld":
                let requestId = msg;

                for (let i = 0; i < client.oldSession[requestId].length; i++) {
                    let tomtom = client.oldSession[requestId][i].tomtom;
                    client.ws.send(tomtom);
                }
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

                        str = `{"method":"reminder","msg":${JSON.stringify(requests)}}`;
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