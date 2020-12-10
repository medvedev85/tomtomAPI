let testArr = [];
let checker = 0;
let expectedResult = "";
let result = "";
let timeTest = 0;
let taskInWork = 0;


/////////////////////////        ТаскМенеджер        /////////////////////////     
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

  startProcessing() {
    const self = this;
    let count = this.runningTasksCount;
    let max = this.maxRunningTasks
    let queue = this.queue;

    if (count < max && queue.length) {
      this.runTask();
      this.runningTasksCount++;

      taskInWork++;
      startProcessingTasksCountTest();
    }

    setTimeout(() => { self.startProcessing() }, 200);

    startProcessingTimeTest();
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

    taskPromise.then(() => {
      self.runningTasksCount--;
    },

      function (error) {
        console.log(error);
      }
    );
  }
}


///////////////////////////          тесты          /////////////////////////////////////////

const maxRunningTasks = 10;
const taskManager = new TaskManager(maxRunningTasks);

checkAllTests();

function startProcessingTasksCountTest() {
  if (taskInWork > maxRunningTasks) {
    console.log("Слишком много задач в работе!!!");
  }
}

function startProcessingTimeTest() {
  timeTest++;

  if (timeTest == 1) {
    console.log("TaskManager.startProcessing запущен");
  } else if (timeTest % 300 == 0) {
    console.log("TaskManager.startProcessing продолжает работу");
  }
}

function testNewTaskManager() {
  let advance = 0;

  for (let key in taskManager) {
    if (key == 'maxRunningTasks' && taskManager[key] == maxRunningTasks) {
      advance++;
    }
    if (key == 'runningTasksCount' && taskManager[key] == 0) {
      advance++;
    }
    if (key == 'clients' && taskManager[key].length == 0) {
      advance++;
    }
    if (key == 'queue' && taskManager[key].length == 0) {
      advance++;
    }
  }

  if (advance == 4) {
    console.log("taskManager успешно создан");
  } else {
    console.log("taskManager не соответствует ожиданиям");
  }
}

function randomInteger(min, max) {
  let rand = min + Math.random() * (max + 1 - min);
  return Math.floor(rand);
}

function job(x) {
  result += x;
}

function checkResult() {
  if (result == expectedResult) {
    console.log("результат ожидаемый");
  }
}

function getResult(id, task) {
  for (let j = 0; j < task; j++) {
    let i = 0;
    while (i != id) {
      expectedResult += i + "." + j + ", ";
      i++;
    }
  }
}

function getTests(id, task) {
  getResult(id, task);

  for (let i = 0; i < id; i++) {
    for (let j = 0; j < task; j++) {
      testArr.push({ i, j });

      taskManager.setNewTask(i, () => {
        return new Promise((function (resolve, reject) {
          setTimeout(() => {
            taskInWork--;
            result += i + "." + j + ", ";
            console.log(`id: ${i + 1}`, `task: ${j + 1}`);
            //taskManager.runningTasksCount--;
            checkArr(i, j);

            //checkResult();

          }, 4000);
          resolve();
        }));

      });
    }
  }

}

function checkArr(i, j) {
  for (let k = 0; k < testArr.length; k++) {
    if (testArr[k].i == i && testArr[k].j == j) {
      testArr.splice(k, 1);
    }
  }
  if (!testArr.length && !taskManager.queue.length) {
    console.log("все задачи выполнены!");
  }
  checkResult();
}

function checkAllTests() {
  testNewTaskManager();
  getTests(5, 5);
}