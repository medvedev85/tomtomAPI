function getResult(clientCount, requestCount, taskCount, fulfillRequest, fulfillTask) {
  let expectedResult = "";

  for (let taskId = 0; taskId < taskCount; taskId++) {
    let clientId = 0;
    for (let j = 0; j < requestCount; j++) {

      while (clientId != clientCount) {
        if (requestCount < fulfillRequest && taskCount < fulfillTask) {
          expectedResult += clientId + "." + taskId + ", ";
          clientId++;
        }
      }
    }
  }
  return expectedResult;
}

async function getTests(clientCount, requestCount, taskCount, maxTaskCount, taskDuration, fulfillRequest, fulfillTask) {
  const taskManager = new TaskManager(maxTaskCount);
  let timeoutId = -1;
  let expectedResult = getResult(clientCount, taskCount);
  let result = "";
  let taskInWork = 0;
  let task;

  let timeoutMs = taskDuration * clientCount * taskCount * 100 + 210000;
  let promise = new Promise(function (res, rej) {
    timeoutId = setTimeout(() => {
      console.log("timeout!", timeoutMs)
      rej();
    }, timeoutMs);

    for (let i = 0; i < clientCount; i++) {
      for (let j = 0; j < requestCount; j++) {
        for (let j = 0; j < taskCount; j++) {
          if (requestCount < fulfillRequest && taskCount < fulfillTask) {
            task = () => {
              return new Promise(function (resolve, reject) {

                taskInWork++;

                if (maxTaskCount >= 1 && taskInWork > maxTaskCount) {
                  reject("задач в работе слишком много! ", "В работе: ", taskInWork, " допустимо не больше: ", maxTaskCount);
                }

                setTimeout(() => {
                  taskInWork--; //+ (оттслеживать вне таскменеджера)
                  result += i + "." + j + ", ";

                  resolve();
                  if (i == clientCount - 1 && j == taskCount - 1) {
                    res();
                  }
                }, taskDuration);
              });
            }
          } else {
            task = () => {
              return new Promise(function (resolve, reject) {
                taskManager.deleteRequestId(i, j);
                resolve();
              });
            }
          }

          taskManager.setNewTask(i, i + "r", task);
        }
      }
    }
  });

  console.log(clientCount, taskCount, maxTaskCount, taskDuration);

  try {
    await promise
  } catch (err) {
    console.log("Failed: ", err);
  } finally {
    clearTimeout(timeoutId);
  }

  let ok = result == expectedResult;

  if (ok) {
    console.log("результат ожидаемый");
  } else {
    console.log("результат получен неверный, ожидаем: ", expectedResult, " получили: ", result);
  }

  return ok;
}

async function runAllTests() {
  await getTests(1, 1, 1, 10, 50, 1, 1);
  await getTests(1000, 1, 1, 10, 50, 1, 5);
  await getTests(1000, 1, 1, 1000, 50, 6, 7);
  await getTests(1, 100, 10, 10, 50, 8, 9);
  await getTests(1, 1, 1, 10000, 50, 10, 5);
  await getTests(1, 1, 1, 0, 50, 1, 8);
  await getTests(100, 100, 5, 10, 0, 5, 5);
}