class TaskManager { //добавить коллбек и спрятать геттреадс
  constructor () {
    this.clients = [];
    this.queue = [];
  }
  
  setNewTask(id, task) {
    let clients = this.clients;
    let check = false;

    for (let i = 0; i < clients.length; i++) {
      if (clients[i].id == id) {
        clients[i].tasks.push(task);
        check = true;
      }
    }

    if (!check) {
      let tasks = [task];
      clients.push({ id, tasks });
    }
    this.getThreads();
  }

  deleteEmptyClients() {
    let clients = this.clients;

    for (let i = 0; i < clients.length; i++) {
      if (!clients[i].tasks.length) {
        clients.splice(i, 1);
        this.deleteEmptyClients();
        break;
      }
    }
  }

  getClients() {
    let clients = this.clients;
    let arr = [];

    for (let i = 0; i < clients.length; i++) {
      let id = clients[i].id;
      let tasks = clients[i].tasks.slice();
      arr.push({ id, tasks });
    }
    return arr;
  }

  getThreads() {
    let nextStep = 0;
    let clients = this.getClients();
    let threads = [];

    while (clients.length) {
      if (nextStep >= clients.length || nextStep < 0) {
        nextStep = 0;
      }

      let client = clients[nextStep].id;
      let task = clients[nextStep].tasks.pop();

      if (clients[nextStep].tasks.length < 1) {
        clients.splice(nextStep, 1);
        nextStep--;
      }

      threads.push({ task, client });

      nextStep++;
      this.nextStep = nextStep;
    }

    this.queue = threads;
  }

  getTask() {
    let clients = this.clients;
    let task = this.queue.shift();

    for (let i = 0; i < clients.length; i++) {
      if (task.client == clients[i].id) {
        let cltTasks = clients[i].tasks;

        for (let j = 0; j < cltTasks.length; j++) {
          if (task.task == cltTasks[j]) {
            cltTasks.splice(j, 1);
          }
          if (!cltTasks.length) {
            clients.splice(i, 1);
          }
        }
      }
    }

    return task;
  }

  getTasks(amount) {
    while(amount && this.queue.length) {
      let task = this.getTask();
      task.task();
      amount--;
    }
  }
}
/*
module.exports = {
  TaskManager: TaskManager
};



 /* {
    let id = "job007"; //тесты
    let testJob = function(delaySec) {
      setTimeout(() => {
        console.log("job done: ", id);
      }, delaySec * 1000);
    }
    TaskManager.setNewTask(clientId, () => { job(10); });
    TaskManager.setNewTask(clientId, job1);
    TaskManager.setNewTask(clientId, job2);
    TaskManager.setNewTask(clientId, job3);
    TaskManager.setNewTask(clientId, job4);
  }
  //------------------------------------
  let parameters = [lalala]; //сервис
  let tomtomJob = function() {
    runTomtomScript(parameters);
  }
  TaskManager.setNewTask(clientId, tomtomJob);
//----------------------------------------*/



 /* function processNext()
  {
    queue;
    job = queue.getNextTask()
    job();
    threadPool...
  }*/