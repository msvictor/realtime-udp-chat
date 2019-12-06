const socket = require("dgram").createSocket("udp4");

class Server {
  constructor() {
    process.stdin.resume();
    this.PORT = 3333;
    this.HOST = "localhost";
    this.clients = [];

    this.onServerStart();
    this.onClientConnect();
    this.onClientDisconnect();
    this.onMessageCatch();
    this.excepitionHandler();
    process.on("exit", this.exitHandler.bind());
  }

  async onServerStart() {
    socket.on("listening", () => {
      const address = socket.address();
      console.log(`server listening ${address.address}:${address.port}`);
    });

    await socket.bind(this.PORT, this.HOST);
  }

  async onClientConnect() {
    await socket.on("message", (data, rinfo) => {
      let menssageObject = JSON.parse(data.toString());

      if (menssageObject.header.type === "connecting") {
        console.log(`new connection of  ${rinfo.address}:${rinfo.port}`);
        this.clients.push({
          address: rinfo.address,
          port: rinfo.port
        });
      }
    });
  }

  async onClientDisconnect() {
    await socket.on("message", (data, rinfo) => {
      let menssageObject = JSON.parse(data.toString());

      if (menssageObject.header.type === "close") {
        let index = this.clients.findIndex(client => {
          return client.address === rinfo.address && client.port === rinfo.port;
        });
        console.log(
          `disconnection of  ${this.clients[index].address}:${this.clients[index].port}`
        );
        this.clients.splice(index, 1);
      }
    });
  }

  async onMessageCatch() {
    await socket.on("message", (data, rinfo) => {
      let menssageObject = JSON.parse(data.toString());

      if (menssageObject.header.type === "Sending") {
        let tasks = [];
        for (let client of this.clients) {
          if (client.address === rinfo.address && client.port === rinfo.port) {
            continue;
          }
          tasks.push(
            new Promise((resolve, reject) => {
              try {
                resolve(
                  socket.send(data, 0, data.length, client.port, client.address)
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
      }
    });
  }

  async excepitionHandler() {
    await socket.on("error", err => {
      console.log(`server error: ${err.stack}`);
      socket.close();
    });
  }

  async exitHandler() {
    let tasks = [];
    for (let client of clients) {
      let data = {
        header: {
          type: "close"
        },
        body: {
          message: Buffer.from(
            "Server shutting down. Have a nice day!"
          ).toJSON()
        }
      };
      let message = Buffer.from(JSON.stringify(data));

      await tasks.push(
        new Promise((resolve, reseject) => {
          resolve(
            socket.send(message, 0, message.length, client.port, client.address)
          );
        })
      );
    }
    console.log("all clean!");
    process.exit();
  }
}

module.exports = new Server();
