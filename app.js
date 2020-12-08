const WebSocketServer = new require('ws');
const TaskManager = require('./modules/taskManager.js');
const { startJob, makeRandom } = require('./modules/integration.js');

//const sessionExpireMs = 604800000; //хранить сессии 7 дней
//const maxthreads = 10; //сколько можем обрабатывать запросов одновременно

const taskManager = new TaskManager(10);

let clients = []; // все клиенты

class Client {
    constructor(ws, id) {
        this.ws = ws;
        this.id = id;
        this.dirs = [];
        this.oldSession = [];
        this.visitCounter = 1;
        this.active = true;
    }
}

function security(str) {
    return /^[atgcwrkdmyhsvbnATGCWRKDMYHSVBN ]+$/.test(str);
}

/*function informQueues() {
    for (let id in clients) {
        for (let j = 0; j < queue.length; j++) {
            if (id == queue[j]["id"]) {
                let str = `{"method":"queue","msg":"Ваша позиция в очереди: ${j + maxthreads}, вся очередь: ${queue.length + maxthreads}"}`;
                clients[id].send(str);
            }
        }
    }
}*/

function checkOldSession(client) {
    if (client.oldSession.length) {
        return true;
    } else {
        return false;
    }
}
/*
function getTests(id, task) {
    for (let i = 0; i < id; i++) {
        for (let j = 0; j < task; j++) {
            
            taskManager.setNewTask(i, () => {
                setTimeout(() => {
                    console.log(`id: ${i + 1}`, `task: ${j + 1}`);
                    //taskManager.runningTasksCount--;
                    
                }, 4000);
            });
        }
    }
}
getTests(2,2)*/

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
                    //client.queue.push(msg);
                    taskManager.setNewTask(client, () => {
                        console.log(321321321)
                        startJob(msg, client, clients);
                    });

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