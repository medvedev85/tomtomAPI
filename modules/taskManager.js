class TaskManager {
  constructor(maxRunningTasks) {
    this.maxRunningTasks = maxRunningTasks;
    this.runningTasksCount = 0;
    this.clients = {};
    this.queue = [];
    this.nextStep = 0;
    this.startProcessing();
  }

  startProcessing() {
    const self = this;
    let queue = this.queue;
    let max = this.maxRunningTasks;

    while (this.runningTasksCount < max && queue.length) {
      this.runTask();
      this.runningTasksCount++;
    }

    setTimeout(() => { self.startProcessing() }, 200);
  }

  setNewTask(id, task) {
    let clients = this.clients;
    let queue = this.queue;

    if (!clients[id]) {
      clients[id] = [];
    }

    clients[id].push(task);
    queue.push(id);
    this.queue = Array.from(new Set(queue));
  }

  getTask() {
    if (this.nextStep >= this.queue.length) {
      this.nextStep = 0;
    }

    let clients = this.clients;
    let queue = this.queue;
    let id = queue[this.nextStep];
    let task = clients[id].shift();

    if (!clients[id].length) {
      delete clients[id];
      queue.splice(this.nextStep, 1);
      this.nextStep--
    }

    this.nextStep++;

    return task;
  }

  runTask() {
    let self = this;
    let task = this.getTask();
    let taskPromise = new Promise(function (resolve, reject) {
      setTimeout(task, 3000);
      resolve();
    });

    taskPromise.then(() => {
      console.log(self.runningTasksCount);
      self.runningTasksCount--;
    },

      function (error) {
        console.log(error);
      }
    );
  }
}