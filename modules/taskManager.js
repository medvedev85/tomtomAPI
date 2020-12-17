class TaskManager {
  constructor(maxRunningTasks) {
    this.maxRunningTasks = parseInt(maxRunningTasks);
    this.runningTasksCount = 0;
    this.requests = {};
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

  setNewTask(id, requestId, task) {
    let clients = this.clients;
    let queue = this.queue;
    let requests = this.requests;

    if (!requests[requestId]) {
      requests[requestId] = [];
    }

    this.requests[requestId].push(task);

    if (!clients[id]) {
      clients[id] = [];
    }

    clients[id].push(requestId);
    this.clients[id] = Array.from(new Set(this.clients[id])); //arr.includes(item, from)

    queue.push(id);
    this.queue = Array.from(new Set(this.queue)); //arr.includes(item, from)
  }

  deleteRequestId(id, requestId) {
    if (this.requests[requestId]) {
      delete this.requests[requestId];
    }

    for (let i = 0; i < this.clients[id].length; i++) {
      let request = this.clients[id][i];
      
      if (request == requestId) {
        this.clients[id].splice(i, 1);
      }
    }
  }

  getTask() {
    if (this.nextStep >= this.queue.length) {
      this.nextStep = 0;
    }

    let clients = this.clients;
    let queue = this.queue;
    let requests = this.requests;
  
    let id = queue[this.nextStep];
    let requestId = clients[id][clients[id].length-1];
    let task = requests[requestId].shift();

    if (!requests[requestId].length) {
      delete requests[requestId];
      clients[id].splice(clients.length-1, 1);
    }

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