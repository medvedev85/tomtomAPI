if (!window.WebSocket) {
  document.body.innerHTML = 'WebSocket в этом браузере не поддерживается.';
}

//////////////////для тестов/////////////////////////
let testMotif = [];
let roundMotif = [];

function testRound() {
  let checker = 0;

  for (let i = 0; i < testMotif.length; i++) {
    for (let j = 0; j < roundMotif.length; j++) {
      if (testMotif[i] == roundMotif[j]) {
        checker++;
        break;
      }
    }
  }


  if (checker == testMotif.length) {
    console.log("очередь отработала как ожидалось, ошибки нет");
  } else {
    console.log("что-то не так с очередью!");
  }
}
/////////////////////////////////////////////////////
let socket = new WebSocket("ws://54.157.128.148:3000");
let network = false;

function security(str) {
  return /^[atgcwrkdmyhsvbnATGCWRKDMYHSVBN ]+$/.test(str);
}

function makeRandomMotif(liters) {
  let text = "";
  let possible = "ATGCWRKDMYHSVBN";

  for (let i = 0; i < liters; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return text;
}

function createMotifStr(amt) {
  let str = [];

  for (let i = 0; i < amt; i++) {
    str.push(makeRandomMotif(8));
  }

  return str;
}

function sendMessage(str, sec) {
  if (!network) {
    return alert("подождите, соединение с сервером устанавливается");
  }
  //ИСПРАВИТЬ ПРОВЕРКУ БЕЗОПАСНОСТИ!!!!!
  let securityTest = true;//security(str);

  if (securityTest || sec) {
    console.log(str);
    socket.send(str);
  } else {
    alert("а вот хер!");
  }
}

function start() {
  let includingMotifs = document.getElementById("createMotifs").value;
  let motifs = createMotifStr(includingMotifs);
  let requestId = "random requestId " + makeRandomMotif(12);

  //////////////////////////////////
  testMotif = motifs; //для тестов
  //////////////////////////////////

  for (let i = 0; i < includingMotifs; i++) {
    let str = `{"method":"tomtom", "msg":{"requestId": "${requestId}", "motif":"${motifs[i]}"}}`;
    sendMessage(str);
  }
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
      roundMotif.push(msg.motif); //для тестов

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
      let elem = document.getElementById("serverMessages");

      if (msg == "have old session") {
        elem.innerHTML = "Продолжить предыдущую сессию?";
      }
      break;
    default: console.log("неопознанное сообщение: " + incomingMessage);
  }
};

function getSession() {
  let cookie = getCookie("name");
  let str = "";

  if (cookie) {
    str = `{"method":"cookie", "msg":"${cookie}"}`;
    console.log("уже есть cookie: " + cookie);
    sendMessage(str, true);
  } else {
    console.log("отправляем запрос на получение новых cookie");
    str = '{"method":"cookie", "msg":"needCookie"}';
    sendMessage(str, true);
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
          <tr ${style}>
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
  //table.innerHTML = html;
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