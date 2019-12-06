const socket = require("dgram").createSocket("udp4");
const Readline = require("readline");

class Client {
  constructor(host, port) {
    process.stdin.resume();
    this.SERVER_HOST = "localhost";
    this.SERVER_PORT = 3333;
    this.USER_HOST = host;
    this.USER_PORT = port;

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

  async onConnection() {
    socket.on("listening", () => {
      this.userAddress = socket.address();
    });

    await this.readline.question("Please enter a username ", answer => {
      this.user = answer;
      let data = {
        header: {
          type: "connecting"
        }
      };

      let message = Buffer.from(JSON.stringify(data));
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

  async onSendingMessage() {
    socket.on("message", (data, rinfo) => {
      let messageObject = JSON.parse(data.toString());

      if (messageObject.header.type === "Sending") {
        console.log(Buffer.from(messageObject.body.message).toString());
      } else {
        console.log("unknownsage");
      }
    });

    await this.readline.on("line", input => {
      let { address, port } = this.userAddress;
      let data = {
        header: {
          type: "Sending"
        },
        body: {
          message: Buffer.from(
            `${this.user}-${address}:${port} → ${input}`
          ).toJSON()
        }
      };

      let message = Buffer.from(JSON.stringify(data));
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

  async onDisconnection() {
    await socket.on("message", (data, rinfo) => {
      let messageObject = JSON.parse(data.toString());

      if (messageObject.header.type === "close") {
        console.log(Buffer.from(messageObject.body.message).toString());
        process.exit();
      }
    });
  }

  async excepitionHandler() {
    await socket.on("error", err => {
      console.log(`server error: ${err.stack}`);
    });
  }

  async exitHandler() {
    this.readline.close();

    let data = {
      header: {
        type: "close"
      },
      body: {
        message: Buffer.from(`${this.user} has left the chat`).toJSON()
      }
    };

    let message = Buffer.from(JSON.stringify(data));
    await socket.send(
      message,
      0,
      message.length,
      this.SERVER_PORT,
      this.SERVER_HOST
    );

    console.log("all clean!");
    process.exit();
  }
}

module.exports = new Client();
