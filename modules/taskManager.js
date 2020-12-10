class TaskManager {
  constructor(maxRunningTasks) {
    this.maxRunningTasks = maxRunningTasks;
    this.runningTasksCount = 0;
    this.clients = [];
    this.queue = [];
    this.startProcessing();
  }

  setNewTask(id, task) {
    let clients = this.clients;
    let check = false;
    //console.log(this.runningTasksCount)

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
  // Таск менеджер выполняет промисы, не знает какие приходят задачи синхронные или асинхронные.
  // Он должен вызвать промис оператором (). и подписаться на результат с помощью then, или await. 
  // до вызова увеличивает счетчик активных задач, а после завершения уменьшает.

  // задача - промис.
  // let task = (ms) => {return new Promise( (resolve, reject) => {
  //   setTimeout(() => { resolve() }, ms);
  // });
  // let taskPromise = task(10000);
  // taskManager.addTask(id, taskPromise);

  // ... 
  // let task = nextTask();
  // task().then( () => {... });

  startProcessing() {
    const self = this;
    let count = this.runningTasksCount;
    let max = this.maxRunningTasks
    let queue = this.queue;

    if (count < max && queue.length) {
      this.runTask();
      this.runningTasksCount++;
    }
    //console.log(this.runningTasksCount)

    setTimeout(() => { self.startProcessing() }, 200);
  }

  /*
    startProcessingOld() {
      const self = this;
      let count = this.runningTasksCount;
      let max = this.maxRunningTasks
      let queue = this.queue;
  
      if (count < max && queue.length) { //нахер тут промис?************************************************************
        let promise = new Promise(function (resolve, reject) {
          self.runTask();
          
          resolve();
        });
  
        promise.then(() => {
          if (count < max && queue.length) {
            self.runTask();
          }
          self.runningTasksCount++;
        },
  
          function (error) {
            console.log(error);
          }
        );
  
        this.runningTasksCount++;
      }
      setTimeout(() => { self.startProcessing() }, 200);
    }
  */

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
      let task = clients[nextStep].tasks.shift();

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

  runTask() {
    let self = this;
    let task = this.getTask();
    let taskPromise = task.task();

    //console.log(this.runningTasksCount)
    taskPromise.then(() => {
      self.runningTasksCount--;
      //console.log(self.runningTasksCount)
    },

      function (error) {
        console.log(error);
      }
    );
  }
}

module.exports = TaskManager;