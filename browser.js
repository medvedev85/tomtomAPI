if (!window.WebSocket) {
  document.body.innerHTML = 'WebSocket в этом браузере не поддерживается.';
}

let socket = new WebSocket("ws://54.157.128.148:3000");

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

function sendMessage(str) {
  let securityTest = security(str);

  if (securityTest) {
    socket.send(str);
  } else {
    alert("а вот хер!");
  }
}

function start() {
  let includingMotifs = document.getElementById("createMotifs").value;
  let motifs = createMotifStr(includingMotifs);

  for (let i = 0; i < includingMotifs; i++) {
    sendMessage(motifs[i]);
  }
}

// обработчик входящих сообщений
socket.onmessage = function (event) {
  let incomingMessage = JSON.parse(event.data);
  
  fillTable(incomingMessage);
};

// показать сообщение в div#subscribe
function showMessage(message) {
  let messageElem = document.createElement('div');
  messageElem.appendChild(document.createTextNode(message));
  document.getElementById('subscribe').appendChild(messageElem);
}

function fillTable(obg) {
  let table = document.getElementById("table_body");
  if (!table) {
    return;
  }
  table.innerHTML = "";
  let html = "";

  for (let i = 0; i < obg.tsv.length; i++) {
    let tsv = obg.tsv[i];
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

    let row = `
          <tr>
              <td><a href=http://jaspar.genereg.net/matrix/${targetID}/ target="_blank" >${queryID}</a></td>
              <td><div class="tooltip">${targetID}<img class="tooltipimage" src="http://jaspar.genereg.net/static/logos/svg/${targetID}.svg"/></div></td>
              <td>${optimalOffset}</td>
              <td>${pValue}</td>
              <td>${eValue}</td>
              <td>${qValue}</td>
              <td>${overlap}</td>
              <td>${queryConsensus}</td>
              <td>${targetConsensus}</td>
              <td>${orientation}</td>
          </tr>`;
    html += row;
  }
  table.innerHTML = html;
  //table.append(html);
}