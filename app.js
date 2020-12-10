const WebSocketServer = new require('ws');
const { startJob, makeRandom } = require('./modules/integration.js');
const Client = require('./modules/clientConstructor.js');
const webSocketServer = new WebSocketServer.Server({ port: 3000 });

let clients = []; // все клиенты

function security(str) {
    return /^[atgcwrkdmyhsvbnATGCWRKDMYHSVBN ]+$/.test(str);
}

function checkOldSession(client) {
    if (client.oldSession.length) {
        return true;
    } else {
        return false;
    }
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
            case "tomtom": //сделать реквест (пусть приходит с фронта объединение мотивов в один запрос)
                if (security(msg.motif)) {
                    let requestId = msg.requestId;
                    let onJobFinished = (tomtom) => {
                        client.ws.send(tomtom); //сохранение сессии сюда
                        saveSession(client, requestId, tomtom);
                    }
                    startJob(msg, client, onJobFinished);
                } else {
                    str = '{"method":"error","msg":"Error: invalid motive format"}';
                    client.ws.send(str);
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
                            client.visitCounter++;
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