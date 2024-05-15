const {
  default: makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
} = require("@whiskeysockets/baileys");

// Import the Express module
const express = require('express');

// Create an Express application
const app = express();

// Define a route
app.get('/', (req, res) => {
    res.send('Hello, feebo!');
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});


// functions

const fs = require("fs");

// Get random questions of specified rating

async function getQuestions(sock, numberWa, reply, rating, count) {
  let folder, files;
  try {
    folder = "./problems/" + rating;
    files = fs.readdirSync(folder);
  } catch (error) {
    send(
      sock,
      numberWa,
      reply,
      "Codeforces doesn't support that rating hehe try again",
    );
    return;
  }
  // console.log(files);
  const link = "https://codeforces.com/problemset/problem/";
  let text = "*Questions*\n\n";
  const MIN_LIMIT = 0,
    MAX_LIMIT = 1000;
  if (count < MIN_LIMIT || count > MAX_LIMIT) {
    send(
      sock,
      numberWa,
      reply,
      "Please enter count in valid range i.e. [0,1000]",
    );
    return;
  }
  const finalcount = Math.floor(count);
  if (count != finalcount) {
    send(sock, numberWa, reply, "Count is not an integer");
    return;
  }
  for (let i = 0; i < count; i++) {
    const randomElement = files[Math.floor(Math.random() * files.length)];
    var data = JSON.parse(fs.readFileSync(folder + "/" + randomElement));
    text += "Name : " + data.problem.name + "\n\n";
    text +=
      "Link : " +
      link +
      data.problem.contestId +
      "/" +
      data.problem.index +
      "\n\n";
  }
  send(sock, numberWa, reply, text);
}

//Load upcoming contests

async function loadContests(sock, numberWa, reply) {
  const url = "https://codeforces.com/api/contest.list?gym=false";
  const response = await fetch(url);
  const usrJSON = await response.json();
  const contests = usrJSON?.result;
  const contestsize = usrJSON?.result.length;

  let upcoming_contests = "*Upcoming Contests*\n\n";

  for (let i = contestsize - 1; i >= 0; i--) {
    if (usrJSON?.result[i]?.relativeTimeSeconds <= 0) {
      var myDate = new Date(usrJSON?.result[i]?.startTimeSeconds * 1000);
      const date = myDate.toLocaleString(undefined, {
        timeZone: "Asia/Kolkata",
      });
      upcoming_contests +=
        "name : " +
        usrJSON?.result[i]?.name +
        "\nTime and date : " +
        date +
        "\n\n";
    }
  }
  send(sock, numberWa, reply, upcoming_contests);
}

// Check rating of a user using their UID.json file

async function checkRating(sock, numberWa, reply, UID) {
  const filePath = "contests/" + UID + ".json";
  try {
    var data = JSON.parse(fs.readFileSync(filePath));
  } catch (error) {
    const errorText = "I don't know you!!!\nCan you please add your CF handle.";
    send(sock, numberWa, reply, errorText);
    return;
  }
  const url = "https://codeforces.com/api/user.rating?handle=" + data.handle;
  const response = await fetch(url);
  const usrJSON = await response.json();
  if (usrJSON.status === "FAILED") {
    send(
      sock,
      numberWa,
      reply,
      "Your Handle is invalid , please enter a valid CF id.",
    );
    return;
  }
  data.rating = usrJSON?.result[usrJSON?.result.length - 1]?.newRating;

  const text =
    "Your handle is " + data.handle + "\nYour rating is " + data.rating + ".";

  send(sock, numberWa, reply, text);
  savedata(data, UID);
}

// Add new UID.json to contests folder

async function addhandle(UID, cfhandle) {
  const usr = new Object();
  usr.handle = cfhandle;
  usr.rating = 0;
  savedata(usr, UID);
}

// save data from javascript object to json files

const savedata = (obj, UID) => {
  const finish = (error) => {
    if (error) {
      console.error(error);
      return;
    }
  };
  const jsondata = JSON.stringify(obj, null, 2);
  fs.writeFile("contests/" + UID + ".json", jsondata, finish);
};

// send message to numberWa
async function send(sock, numberWa, reply, message) {
  await sock.sendMessage(
    numberWa,
    {
      text: message,
    },
    {
      quoted: reply,
    },
  );
}

//constants

let sock;
let Welcome =
  "\n\nEnter command in form of\nfeebo command_no\n\n\
            1) Add handle\n\n\
            2) Show rating\n\n\
            3) Show upcoming contests\n\n\
            4) Get new questions\n\n\
            for eg : feebo 1";

//main source code

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info_baileys");

  //Establishing connection through QR code
  sock = makeWASocket({
    printQRInTerminal: true,
    auth: state,
  });

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) {
      console.log(qr);
    }
    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect?.error?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) {
        connectToWhatsApp();
      }
    } else if (connection === "open") {
      console.log("open connection");
      return;
    }
  });

  // if message upserted
  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    // console.log(messages);
    
    const chalk = require('chalk');
    let name = messages[0]?.pushName;
    const Message = messages[0]?.message;
    console.log(chalk.blue.bold(name)+" : ");
    console.log(Message);
    try {
      if (type === "notify") {
        let captureMessage;
        if (Message.hasOwnProperty("conversation"))
          captureMessage = Message.conversation;
        else if (
          Message.hasOwnProperty("extendedTextMessage") &&
          Message.extendedTextMessage.hasOwnProperty("text")
        )
          captureMessage = Message.extendedTextMessage.text;
        else return;

        const numberWa = messages[0]?.key?.remoteJid;
        const compareMessage = captureMessage.toLocaleLowerCase();
        const reply = messages[0];
        let UID = messages[0]?.key?.participant;

        if (UID == undefined) {
          UID = messages[0]?.key?.remoteJid;
        }

        if (compareMessage === "feebo") {
          const Welcometext =
            "Hello, I am Feebo. How can I help you " + name + "?" + Welcome;
          send(sock, numberWa, reply, Welcometext);
        } else if (compareMessage === "feebo 1") {
          const handleText =
            "Enter your CF Handle. reply as 'feebo handle handle_name'\n\nfor eg : feebo handle aniket54";
          send(sock, numberWa, reply, handleText);
        } else if (compareMessage === "feebo 2") {
          checkRating(sock, numberWa, reply, UID);
        } else if (compareMessage === "feebo 3") {
          loadContests(sock, numberWa, reply);
        } else if (compareMessage === "feebo 4") {
          const getquesText =
            "Write your demand as 'feebo get rating count',this will provide you 'count' no. of questions of 'rating' rating.\n\n for eg : feebo get 1500 4";
          send(sock, numberWa, reply, getquesText);
        } else {
          try {
            let newmessage = compareMessage.split(" ");
            if (newmessage[0] === "feebo") {
              if (newmessage[1] === "handle") {
                addhandle(UID, newmessage[2]);
                const success = "Handle saved successfully.";
                send(sock, numberWa, reply, success);
              } else if (newmessage[1] === "get") {
                let rating, count;
                rating = newmessage[2];
                count = newmessage[3];
                console.log(rating, count);
                getQuestions(sock, numberWa, reply, rating, count);
              }
            }
          } catch (error) {
            console.log("error ", error);
          }
        }
      }
    } catch (error) {
      console.log("error ", error);
    }
  });

  sock.ev.on("creds.update", saveCreds);
}

connectToWhatsApp().catch((err) => console.log("unexpected error: " + err)); // catch any errors
