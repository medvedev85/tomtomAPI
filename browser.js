if (!window.WebSocket) {
  document.body.innerHTML = 'WebSocket в этом браузере не поддерживается.';
}

// создать подключение
let socket = new WebSocket("ws://54.157.128.148:3000");

function security(str) {
  return /^[atgcwrkdmyhsvbnATGCWRKDMYHSVBN ]+$/.test(str);
}

// отправить сообщение из формы publish
document.forms.publish.onsubmit = function () {
  let outgoingMessage = this.message.value;
  let securityTest = security(outgoingMessage);

  if(securityTest) {
    socket.send(outgoingMessage);
  } else {
    alert("а вот хер!");
  }
  
  return false;
};

// обработчик входящих сообщений
socket.onmessage = function (event) {
  let incomingMessage = event.data;
  showMessage(incomingMessage);
  console.log(incomingMessage);
};

// показать сообщение в div#subscribe
function showMessage(message) {
  let messageElem = document.createElement('div');
  messageElem.appendChild(document.createTextNode(message));
  document.getElementById('subscribe').appendChild(messageElem);
}
