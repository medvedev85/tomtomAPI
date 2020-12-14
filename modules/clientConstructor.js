class Client {
  constructor(ws, id) {
      this.ws = ws;
      this.id = id;
      this.dirs = [];
      this.oldSession = {};
      this.active = true;
  }
}

module.exports = Client;