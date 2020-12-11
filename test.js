let testArr = [];
let checker = 0;
let expectedResult = "";
let result = "";
let timeTest = 0;
let taskInWork = 0;

const maxRunningTasks = 10;
const taskManager = new TaskManager(maxRunningTasks);

//checkAllTests();

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

      let task = () => {
        return new Promise(function (resolve, reject) {
          setTimeout(() => {
            taskInWork--; //+ (оттслеживать вне таскменеджера)
            result += i + "." + j + ", ";
            console.log(`id: ${i + 1}`, `task: ${j + 1}`);
            //taskManager.runningTasksCount--;
            checkArr(i, j);
          }, 1000);
          resolve();
        });
      }

      let task2 = () => {
        setTimeout(() => {
          taskInWork--; //+ (оттслеживать вне таскменеджера)
          result += i + "." + j + ", ";
          console.log(`id: ${i + 1}`, `task: ${j + 1}`);
          //taskManager.runningTasksCount--;
          checkArr(i, j);
        }, 1000);
      }

      taskManager.setNewTask(i, task2);
    }
  }

}

function checkArr(i, j) {//-
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
  testNewTaskManager();// -
  getTests(5, 5); // + (вызывать с разными параметрами + сделать разное время на задачу)
}

//убивать таскменеджер после 1 теста из серии тестов, чтобы не перемешивать