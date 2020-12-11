function getResult(clientCount, taskCount) {
  let expectedResult = "";

  for (let taskId = 0; taskId < taskCount; taskId++) {
    let clientId = 0;

    while (clientId != clientCount) {
      expectedResult += clientId + "." + taskId + ", ";
      clientId++;
    }
  }
  return expectedResult;
}

async function getTests(clientCount, taskCount, maxTaskCount, taskDuration) {
  const taskManager = new TaskManager(maxTaskCount);
  let expectedResult = getResult(clientCount, taskCount);
  let result = "";
  let startTime = Date.now();
  let taskInWork = 0;

  let timeoutMs = taskDuration * clientCount * taskCount;
  let promise = new Promise(function (res, rej) {
    setTimeout(() => {
      console.log("timeout!", timeoutMs)
      rej();
    }, timeoutMs);

    for (let i = 0; i < clientCount; i++) {
      for (let j = 0; j < taskCount; j++) {
        let task = () => {
          return new Promise(function (resolve, reject) {
            console.log("start ", i, j);
            taskInWork++;

            if (taskInWork > maxTaskCount) {
              reject("задач в работе слишком много! ", "В работе: ", taskInWork, " допустимо не больше: ", maxTaskCount);
            }

            setTimeout(() => {
              taskInWork--; //+ (оттслеживать вне таскменеджера)
              result += i + "." + j + ", ";
              let deltat = parseInt((Date.now() - startTime) / 1000);
              console.log(`${deltat}, id: ${i + 1}`, `task: ${j + 1}`);

              resolve();
              if (i == clientCount - 1 && j == taskCount - 1) {
                res();
              }
            }, taskDuration);
          });
        }

        taskManager.setNewTask(i, task);
      }
    }
  });
  console.log("Start")
  try {
    await promise;
  } catch(err) {
    console.log("Failed: ", err)
  }
  console.log("finisheds")

  if (result == expectedResult) {
    console.log("результат ожидаемый");
  } else {
    console.log("результат получен неверный");
  }
}