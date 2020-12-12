class TaskManager {
  constructor(maxRunningTasks) {
    this.maxRunningTasks = parseInt(maxRunningTasks);
    this.runningTasksCount = 0;
    this.clients = {};
    this.queue = [];
    this.nextStep = 0;
    this.startProcessing();
  }

  startProcessing() {
    const self = this;
    const max = this.maxRunningTasks;

    while ((max == 0 || this.runningTasksCount < max) && this.queue.length) {
      this.runTask();
      this.runningTasksCount++;
    }

    setTimeout(() => { self.startProcessing() }, 50);
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
      this.nextStep--;
    }

    this.nextStep++;

    return task;
  }

  runTask() {
    let self = this;
    let task = this.getTask();
    let taskPromise = task();

    taskPromise.then(() => {
      self.runningTasksCount--;
    },

      function (error) {
        console.log(error);
      }
    );
  }
}

module.exports = TaskManager;