const dgram = require("dgram");

class Server {
  constructor() {
    process.stdin.resume();
    this.socket = dgram.createSocket("udp4");
    this.port = 3333;
    this.host = "localhost";
    this.clients = [];

    this.onServerStart();
    this.onClientConnect();
    this.onClientDisconnect();
    this.onMessageCatch();
    this.excepitionHandler();
    process.on("exit", this.exitHandler.bind());
  }

  onServerStart() {
    this.socket.on("listening", () => {
      const address = this.socket.address();
      console.log(`server listening ${address.address}:${address.port}`);
    });

    this.socket.bind(this.port, this.host);
  }

  onClientConnect() {
    this.socket.on("message", (msg, rinfo) => {
      let menssageObject = JSON.parse(msg.toString());

      if (menssageObject.header.type === "connecting") {
        console.log(`new connection of  ${rinfo.address}:${rinfo.port}`);
        this.clients.push({
          address: rinfo.address,
          port: rinfo.port
        });
      } else {
        this.excepitionHandler();
      }
    });
  }

  onClientDisconnect() {
    this.socket.on("message", (msg, rinfo) => {
      let menssageObject = JSON.parse(msg.toString());
      if (menssageObject.header.type === "close") {
        let index = this.clients.findIndex(client => {
          return client.address === rinfo.address && client.port === rinfo.port;
        });
        console.log(
          `disconnection of  ${this.clients[index].address}:${this.clients[index].port}`
        );
        this.clients.splice(index, 1);
      } else {
        this.excepitionHandler();
      }
    });
  }

  onMessageCatch() {
    this.socket.on("message", (msg, rinfo) => {
      let menssageObject = JSON.parse(msg.toString());

      if (menssageObject.header.type == "Sending") {
        let tasks = [];
        for (client of this.clients) {
          if (client.address === rinfo.address && client.port === rinfo.port) {
            continue;
          }
          tasks.push(
            new Promise((resolve, reject) => {
              try {
                resolve(
                  this.socket.send(
                    msg,
                    0,
                    msg.length,
                    client.port,
                    client.address
                  )
                );
              } catch (error) {
                reject(0);
              }
            })
          );
        }
        Promise.all(tasks).then(result =>
          console.log("all messages sent, everything ok!")
        );
      } else {
        this.excepitionHandler();
      }
    });
  }

  excepitionHandler() {
    this.socket.on("error", err => {
      console.log(`server error: ${err.stack}`);
      this.socket.close();
    });
  }

  exitHandler() {
    let tasks = [];
    for (let client of this.clients) {
      let msg = {
        header: {
          type: "close"
        },
        body: {
          message: new Buffer("Server shutting down. Have a nice day!").toJSON()
        }
      };
      let message = new Buffer(JSON.stringify(msg));

      tasks.push(
        new Promise((resolve, reseject) => {
          resolve(
            this.socket.send(
              message,
              0,
              message.length,
              client.port,
              client.address
            )
          );
        })
      );
    }
    console.log("all clean!");
    process.exit();
  }
}

module.exports = new Server();
