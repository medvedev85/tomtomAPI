if (!window.WebSocket) {
  document.body.innerHTML = 'WebSocket в этом браузере не поддерживается.';
}

let socket = new WebSocket("ws://54.157.128.148:3000");
let requests = {};
let network = false;

function makeRandomMotif(liters) {
  deleteOldResults();
  reminderRequest();

  let text = "";
  let possible = "ATGCWRKDMYHSVBN";

  for (let i = 0; i < liters; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return text;
}

function createTestMotifs(amt) {
  let motifsArr = [];

  for (let i = 0; i < amt; i++) {
    motifsArr.push(makeRandomMotif(8));
  }

  return motifsArr;
}

function deleteOldResults() {
  let oldTable = document.getElementsByClassName("tableResults");

  for (let i = 0; i < oldTable.length; i++) {
    oldTable[i].remove();
  }
}

function sendMessage(str) {
  if (!network) {
    return alert("подождите, соединение с сервером устанавливается");
  }

  socket.send(str);
}

function start() {
  let includingMotifs = document.getElementById("createMotifs").value;
  let motifs = createTestMotifs(includingMotifs);
  let requestId = "random requestId " + makeRandomMotif(12);
  let str = `{"method":"tomtom","msg":{"requestId":"${requestId}","motifs":${JSON.stringify(motifs)}}}`;

  sendMessage(str);
}

// обработчик входящих сообщений
socket.onmessage = function (event) {
  let incomingMessage = JSON.parse(event.data);
  let method = incomingMessage["method"];
  let msg = incomingMessage["msg"];

  switch (method) {
    case "error":
      alert(msg);
      break;
    case "tomtom":
      fillTable(msg);
      break;
    case "cookie":
      cookieWriter("name", msg);
      console.log("new cookie" + msg);
      break;
    case "session":
      console.log("запрос от сервера на установку соединения");
      network = true;
      getSession();
      break;
    case "reminder":
      notifyOldSession(msg);
      break;
    default: console.log("неопознанное сообщение: " + incomingMessage);
  }
};

function reminderRequest() {
  let str = `{"method":"reminderRequest", "msg":""}`;

  sendMessage(str);
}

function notifyOldSession(oldSession) {
  let elem = document.getElementById("motifsTableBody");
  let html = "";

  for (let i = 0; i < oldSession.length; i++) {
    let requestId = oldSession[i].requestId;
    let date = oldSession[i].date;


    html += `<tr>	
                    <td><a href="javascript:void(0)" onclick="printOldRequest('${requestId}');" >${requestId}</a> (${date}) </td>	
                 </tr>`;
  }

  elem.innerHTML = html;
}

function printOldRequest(requestId) {
  let str = `{"method":"requestOld", "msg":{"requestId":"${requestId}"}}`;

  sendMessage(str);
}

function getSession() {
  let cookie = getCookie("name");
  let str = "";

  if (cookie) {
    str = `{"method":"cookie", "msg":"${cookie}"}`;
    console.log("уже есть cookie: " + cookie);
    sendMessage(str);
  } else {
    console.log("отправляем запрос на получение новых cookie");
    str = '{"method":"cookie", "msg":"needCookie"}';
    sendMessage(str);
  }
}

// показать сообщение в div#subscribe
function showMessage(message) {
  let messageElem = document.createElement('div');
  messageElem.appendChild(document.createTextNode(message));
  document.getElementById('subscribe').appendChild(messageElem);
}

function fillTable(obj) {
  let table = document.getElementById("table_body");

  if (!obj.tsv[0] || !table || document.getElementById(obj.tsv[0].Query_ID)) {
    return;
  }

  let html = "";
  let style = "";
  let buttonSummary = "";

  for (let i = 0; i < obj.tsv.length; i++) {
    let tsv = obj.tsv[i];
    let queryID = tsv.Query_ID;
    let targetID = tsv.Target_ID;
    let optimalOffset = tsv.Optimal_offset;
    let pValue = tsv["p-value"];
    let eValue = tsv["E-value"];
    let qValue = tsv["q-value"];
    let overlap = tsv.Overlap;
    let queryConsensus = tsv.Query_consensus;
    let targetConsensus = tsv.Target_consensus;
    let orientation = tsv.Orientation;

    if (i === 0 && obj.tsv.length > 1) {
      buttonSummary = `<a id="${queryID}" style="text-decoration:none; color:grey;" href="javascript:void(0)" onclick="showAlltargets('${queryID}');" >&#9658; </a>`
    } else if (i === 0 && obj.tsv.length === 1) {
      buttonSummary = buttonSummary = `<a style="text-decoration:none;" href=http://jaspar.genereg.net/matrix/${targetID}/ target="_blank">&#8195;&nbsp;</a>`;
    } else {
      style = `class="${queryID}" style="display:none;"`;
      buttonSummary = `<a style="text-decoration:none;" href=http://jaspar.genereg.net/matrix/${targetID}/ target="_blank">&#8195;&nbsp;</a>`;
    }

    let row = `
          <tr ${style} class="tableResults">
              <td nowrap>${buttonSummary}<a href=http://jaspar.genereg.net/matrix/${targetID}/ target="_blank">${queryID}</a></td>
              <td nowrap><div class="tooltip">${targetID}<img class="tooltipimage" src="http://jaspar.genereg.net/static/logos/svg/${targetID}.svg"/></div></td>
              <td nowrap>${optimalOffset}</td>
              <td nowrap>${pValue}</td>
              <td nowrap>${eValue}</td>
              <td nowrap>${qValue}</td>
              <td nowrap>${overlap}</td>
              <td nowrap>${queryConsensus}</td>
              <td nowrap>${targetConsensus}</td>
              <td nowrap>${orientation}</td>
          </tr>`;
    html += row;
  }

  table.insertAdjacentHTML('afterend', html);
}

function showAlltargets(motif) {
  let elem = document.getElementsByClassName(motif);
  let href = document.getElementById(motif);

  if (elem[0].style.display == "none") {
    for (let i = 0; i < elem.length; i++) {
      document.getElementsByClassName(motif)[i].style.display = "table-row";
      href.innerHTML = "&#9660; ";
    }
  } else {
    for (let i = 0; i < elem.length; i++) {
      document.getElementsByClassName(motif)[i].style.display = "none";
      href.innerHTML = "&#9658; ";
    }
  }
}

function cookieWriter(name, value) {
  document.cookie = encodeURIComponent(name) + '=' + encodeURIComponent(value);
}

function getCookie(name) {
  let matches = document.cookie.match(new RegExp(
    "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
  ));
  return matches ? decodeURIComponent(matches[1]) : undefined;
}