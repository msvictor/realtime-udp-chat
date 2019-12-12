const socket = require("dgram").createSocket("udp4");
const Readline = require("readline");

class Client {
  constructor() {
    /**
     * This variables give the host and port from the server
     */
    this.SERVER_HOST = "localhost";
    this.SERVER_PORT = 3333;

    /**
     * This variable give the host to user
     */
    this.USER_HOST = "localhost";

    /**
     * This variable give a random port to user
     */
    this.USER_PORT;

    /**
     * This variable will be used to store the user address
     */
    this.userAddress = "";

    /**
     * This variable will be used to store the user nickname
     */
    this.user = null;

    /**
     * This variable will be used to process the user input and output on the
     * interface
     */
    this.readline = Readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    /**
     * This method watch when the user is connecting on the chat
     */
    this.onConnection();

    /**
     * This method send the user message
     */
    this.onSendingMessage();

    /**
     * This method watch when the user is disconnecting from the chat
     */
    this.onDisconnection();

    /**
     * This method catch erros from user connection
     */
    this.excepitionHandler();

    /**
     * This function is triggered when the user connection process is stopped
     */
    process.on("exit", this.exitHandler.bind());
  }

  /**
   * This method start a socket with a host and a port specified and watch when
   * a socket as a user is getting up for store his address. Besides that
   * the user is asked to provide a nick name for use the chat.
   */
  onConnection() {
    socket.bind(this.USER_PORT, this.USER_HOST);

    socket.on("listening", () => {
      this.userAddress = socket.address();
    });

    this.readline.question("Please enter a username: ", answer => {
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
  }

  /**
   * This method watch the send process from the user then catch the message write
   * and send to all other users
   */
  onSendingMessage() {
    socket.on("message", (data, rinfo) => {
      let messageObject = JSON.parse(data.toString());

      if (messageObject.header.type === "Sending") {
        console.log(Buffer.from(messageObject.body.message).toString());
      } else {
        console.log("unknownsage");
      }
    });

    this.readline.on("line", input => {
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

  /**
   * This method watch when a user disconnect from the chat and kill the socket
   * process
   */
  onDisconnection() {
    socket.on("message", (data, rinfo) => {
      let messageObject = JSON.parse(data.toString());

      if (messageObject.header.type === "close") {
        console.log(Buffer.from(messageObject.body.message).toString());
        process.exit();
      }
    });
  }

  /**
   * This method watch errors given from the socket
   */
  excepitionHandler() {
    socket.on("error", err => {
      console.log(`server error: ${err.stack}`);
    });
  }

  /**
   * This method is triggered when the socket process is stopped. This stop the
   * interface process, give a log message with the user that was disconnect
   */
  exitHandler() {
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
    socket.send(message, 0, message.length, this.SERVER_PORT, this.SERVER_HOST);

    console.log("all clean!");
    process.exit();
  }
}

/**
 * This line export a instance of the class
 */
module.exports = new Client();
