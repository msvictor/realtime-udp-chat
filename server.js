const dgram = require("dgram");

class Server {
  constructor() {
    this.socket = dgram.createSocket("udp4");
    this.port = 3333;
    this.host = "localhost";
    this.clients = [];

    this.excepitionHandler();
    this.connection();
    this.disconnection();
    this.message();
    this.broadcast();
    this.startServer();
  }

  startServer() {
    this.socket.on("listening", () => {
      const address = this.socket.address();
      console.log(`server listening ${address.address}:${address.port}`);
    });

    this.socket.bind(this.port, this.host);
  }

  connection() {
    this.socket.on("message", (_, rinfo) => {
      console.log(`new connection of  ${rinfo.address}:${rinfo.port}`);
    });
  }

  disconnection() {
    this.socket.on("message", (_, rinfo) => {
      console.log(`disconnection of  ${rinfo.address}:${rinfo.port}`);
    });
  }

  message() {
    this.socket.on("message", (msg, rinfo) => {
      let menssageObject = JSON.parse(msg.toString());

      if (menssageObject.header.type === "connecting") {
        console.log(`new connection of  ${rinfo.address}:${rinfo.port}`);
        this.clients.push({
          address: rinfo.address,
          port: rinfo.port
        });
      } else if (menssageObject.header.type == "Sending") {
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
      }
    });
  }

  broadcast() {}

  excepitionHandler() {
    this.socket.on("error", err => {
      console.log(`server error: ${err.stack}`);
      this.socket.close();
    });
  }
}

module.exports = new Server();
