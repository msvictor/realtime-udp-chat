const socket = require("dgram").createSocket("udp4");
const Readline = require("readline");

class Client {
  constructor() {
    process.stdin.resume();
    this.SERVER_PORT = 3333;
    this.SERVER_HOST = "localhost";
    this.USER_PORT = 3334;
    this.USER_HOST = "localhost";

    this.userAddress = "";
    this.user = null;
    this.readline = Readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    this.onConnection();
    this.onSendingMessage();
    this.onDisconnection();
    this.excepitionHandler();
    process.on("exit", this.exitHandler.bind());
  }

  onConnection() {
    socket.on("listening", () => {
      this.userAddress = socket.address();
    });

    this.readline.question("Please enter a username ", answer => {
      this.user = answer;
      let msg = {
        header: {
          type: "connecting"
        }
      };

      let message = new Buffer(JSON.stringify(msg));
      socket.send(
        message,
        0,
        message.length,
        this.SERVER_PORT,
        this.SERVER_HOST
      );
    });

    socket.bind(this.USER_PORT, this.USER_HOST);
  }

  onSendingMessage() {
    socket.on("message", (msg, rinfo) => {
      let messageObject = JSON.parse(msg.toString());

      if (messageObject.header.type === "Sending") {
        console.log(Buffer.from(messageObject.body.message).toString());
      } else {
        console.log("unknownsage");
      }
    });

    this.readline.on("lineinput", () => {
      let msg = {
        header: {
          type: "Sending"
        },
        body: {
          message: new Buffer(
            `${this.user}-${this.userAddress}: ${input}`
          ).toJSON()
        }
      };

      let message = new Buffer(JSON.stringify(msg));
      socket.send(
        message,
        0,
        message.length,
        this.SERVER_PORT,
        this.SERVER_HOST
      );

      console.log(`you: ${input}`);
    });
  }

  onDisconnection() {
    socket.on("message", (msg, rinfo) => {
      let messageObject = JSON.parse(msg.toString());

      if (messageObject.header.type === "close") {
        console.log(Buffer.from(messageObject.body.message).toString());
        process.exit();
      }
    });
  }

  excepitionHandler() {
    socket.on("error", err => {
      console.log(`server error: ${err.stack}`);
    });
  }

  exitHandler() {
    this.readline.close();

    let msg = {
      header: {
        type: "close"
      },
      body: {
        message: new Buffer(`${this.user} has left the chat`).toJSON()
      }
    };

    let message = new Buffer(JSON.stringify(msg));
    socket.send(message, 0, message.length, this.SERVER_PORT, this.SERVER_HOST);

    console.log("all clean!");
    process.exit();
  }
}

module.exports = new Client();
