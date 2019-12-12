const socket = require("dgram").createSocket("udp4");

class Server {
  constructor() {
    /**
     * This variables give the host and port to the server
     */
    this.PORT = 3333;
    this.HOST = "localhost";

    /**
     * This array store all the clients log on server
     */
    this.clients = [];

    /**
     * This method give a feedback that the server is running
     */
    this.onServerStart();

    /**
     * This method watch all the clients that connect on server
     */
    this.onClientConnect();

    /**
     * This method watch all messages sent from client side
     */
    this.onMessageCatch();

    /**
     * This method watch all the clients that disconnect from server
     */
    this.onClientDisconnect();

    /**
     * This method catch erros from server
     */
    this.exceptionHandler();

    /**
     * This function is triggered when the server process is stopped
     */
    process.on("exit", this.exitHandler.bind());
  }

  /**
   * This method start a socket with a host and a port specified and watch when
   * a socket is getting up and give a log message with the address and the port
   * of the new socket.
   */
  onServerStart() {
    socket.bind(this.PORT, this.HOST);

    socket.on("listening", () => {
      const address = socket.address();
      console.log(`server listening ${address.address}:${address.port}`);
    });
  }

  /**
   * This method watch when a clinet connect on the server and give a log message
   * with the address and the port of the client
   */
  onClientConnect() {
    socket.on("message", (data, rinfo) => {
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

  /**
   * This method watch when a clinet disconnect from the server and give a log message
   * then remove the client from the array
   */
  onClientDisconnect() {
    socket.on("message", (data, rinfo) => {
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

  /**
   * This method watch all messages sent from clients and give a log message if
   * all message are catch
   */
  onMessageCatch() {
    socket.on("message", (data, rinfo) => {
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

  /**
   * This method watch errors given from the socket
   */
  exceptionHandler() {
    socket.on("error", err => {
      console.log(`server error: ${err.stack}`);
      socket.close();
    });
  }

  /**
   * This method is triggered when the socket process is stopped. This log out
   * all the clients from the server, send a message with the status, give a
   * feedback message then kill the socket process
   */
  exitHandler() {
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

      tasks.push(
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

/**
 * This line export a instance of the class
 */
module.exports = new Server();
