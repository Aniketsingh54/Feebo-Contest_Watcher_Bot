const {
  default: makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
} = require("@whiskeysockets/baileys");

// Import the Express module
const express = require('express');
let chalk;
(async () => {
  chalk = (await import('chalk')).default;
})();
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


const request = require('request-promise');
const cheerio = require('cheerio');
const fs = require("fs");
const flatted = require('flatted');
const moment = require('moment-timezone');
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
  let upcoming_contests = "*Upcoming Contests*\n\n";

  //codeforces
  try{
    const url = "https://codeforces.com/api/contest.list?gym=false";
    const responsecf = await fetch(url);
    const usrJSON = await responsecf.json();
    const contests = usrJSON?.result;
    const contestsize = usrJSON?.result.length;

    upcoming_contests+="*Codeforces*\n\n";
    let c=0;
    for (let i = contestsize - 1; i >= 0; i--) {
      if (usrJSON?.result[i]?.relativeTimeSeconds <= 0 && c<3) {
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
        c+=1
      }
    }
  }
  catch(error)
  {
    upcoming_contests+="Codeforces not available\n\n";
  }
  
  // atcoder
  try{
    c=0;
    const atcoder = "https://atcoder.jp/";
    upcoming_contests+="*Atcoder*\n\n";
    const response = await request(atcoder);
    let $ = cheerio.load(response);
    let text = $(':header:contains("Active Contests"), :header:contains("Upcoming Contests") + div').children('table').children('tbody').children('tr');
    text.each(function (){
      if(c==3) return false;
      const row = $(this).children('td');
      const time = row.eq(0).find('a').text();
      const name = row.eq(1).find('a').text();
      const momentJST = moment.tz(time, 'Asia/Tokyo');
      const momentIST = momentJST.tz('Asia/Kolkata');
      const dateTimeIST = momentIST.format('DD/MM/YYYY HH:mm:ss');
      upcoming_contests +=  "name : "+name+"\nTime and date : "+dateTimeIST+"\n\n";
      c+=1;
      return true;
    });
  }
  catch(error)
  {
    upcoming_contests+="Atcoder not available";
  }
  send(sock, numberWa, reply, upcoming_contests);
}

// Check rating of a user using their UID.json file

async function checkRating(sock, numberWa, reply, UID) {
  const filePath = "contests/" + UID + ".json";
  try {
    var data = JSON.parse(fs.readFileSync(filePath));
  } catch (error) {
    const errorText = "I don't know you!!!\nCan you please add your cp handles.";
    send(sock, numberWa, reply, errorText);
    return;
  }
  let text ="*Ratings below*\n\n";
  if(data.hasOwnProperty("codeforces"))
  {
    text+= "*Codeforces :*\n\n";    
    const url = "https://codeforces.com/api/user.info?handles=" + data.codeforces.handle;
    const response = await fetch(url);
    const usrJSON = await response.json();
    if (usrJSON.status !== "FAILED") 
    {
      data.codeforces.rating = usrJSON?.result[0]?.rating;
      data.codeforces.rank  =usrJSON?.result[0]?.rank;
      text += "User : " + data.codeforces.handle + "\nRating : " + data.codeforces.rating + "\nRank : *" + data.codeforces.rank +"*\n\n";   
    }
    else
    {
      text += "Codeforces Handle invalid !!!\n\n";
    }
  }
  // if(data.hasOwnProperty("atcoder"))
  // {
  //   text+= "*Atcoder :*\n\n";    
  //   const url = "https://www.codechef.com/users/" + data.atcoder.handle;
  //   const response = await request(url);
  //   let $ = cheerio.load(response);
  //   let rating = $('table[class="dl-table mt-2]').children('tr').children('td').eq(1).children('span').eq(0).text();
  //   let rank = $('div[class="col-md-3 col-sm-12"]').children('h3').children('b');
  //   console.log(rank);
  //   data.atcoder.rating = 0;
  //   data.atcoder.rank = rank.text();
  //   text += "User : " + data.atcoder.handle + "\nRating : " + data.atcoder.rating + "\nRank : " + data.atcoder.rank +"\n\n";
  // }
  if(data.hasOwnProperty("codechef"))
  {
    text+= "*Codechef :*\n\n";    
    const url = "https://www.codechef.com/users/" + data.codechef.handle;
    const response = await request(url);
    let $ = cheerio.load(response);
    let rating = $('div[class="rating-number"]').text();
    let rank = $('div[class="rating-star"]').children('span');
    let actualrank = "";
    rank.each(function(){
      const sp = $(this).text();
      actualrank+=sp;
    })
    data.codechef.rating = rating;
    data.codechef.rank =actualrank;
    text += "User : " + data.codechef.handle + "\nRating : " + data.codechef.rating + "\nRank : " + data.codechef.rank +"\n\n";   
  }
  // if(data.hasOwnProperty("leetcode"))
  // {
  //   text+= "*Leetcode :*\n\n";    
  //   const url = "https://leetcode.com/u/" + data.leetcode.handle;
  //   const response = await request(url);
  //   let $ = cheerio.load(response);
  //   let rating = $('div[class="text-label-1 dark:text-dark-label-1 flex items-center text-2xl"]').text();
  //   data.leetcode.rating = usrJSON?.result[usrJSON?.result.length - 1]?.newRating;
  //   text += "Your handle is " + data.leetcode.handle + "\nYour rating is " + data.leetcode.rating + ".\n\n";
  // }
  send(sock, numberWa, reply, text);
  savedata(data, UID);
}

// Add new UID.json to contests folder

async function addhandle(UID, id, type) 
{
  const filePath = "contests/" + UID + ".json";
  var usr;
  try {
    usr = JSON.parse(fs.readFileSync(filePath));
  } catch (error) {
    console.log(error);
      usr = new Object();
  }

  if(type==="cf")
  {
    let cf = new Object();
    cf.handle = id;
    cf.rating = 0;
    cf.rank = "";
    usr.codeforces = cf; 
  }
  else if(type ==="lc")
  {
    let lc = new Object();
    lc.handle = id;
    lc.rating = 0;
    lc.rank = "";
    usr.leetcode = lc;
  }
  else if(type ==="cc")
  {
    let cc = new Object();
    cc.handle = id;
    cc.rating = 0;
    cc.rank = "";
    usr.codechef = cc;
  }
  else if(type ==="ac")
  {
    let ac = new Object();
    ac.handle = id;
    ac.rating = 0;
    ac.rank ="";
    usr.atcoder = ac;
  }
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
// quotes to be motivated 
function getRandomQuoteFromFile() {
  try {
    // Read the JSON file synchronously
    const data = fs.readFileSync('./motivational_quotes.json', 'utf8');
    // Parse the JSON data
    const quotes = JSON.parse(data).quotes;
    // Get a random quote
    const randomIndex = Math.floor(Math.random() * quotes.length);
    return quotes[randomIndex];
  } catch (err) {
    console.error('Error reading or parsing the file:', err);
    return null;
  }
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
    version: [2, 2413, 1],
  });

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) {
      console.log(qr);
    }
    if (connection === "close") {
      const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('Connection closed due to', lastDisconnect.error, ', reconnecting', shouldReconnect);
      if (shouldReconnect) {
        await sleep(10000);
        connectToWhatsApp();
      }
    } else if (connection === "open") {
      await sleep(15000)
      console.clear();
      console.log("              ('-.     ('-. .-. .-')                     ")
      console.log("            _(  OO)  _(  OO)\\  ( OO )                    ")
      console.log("   ,------.(,------.(,------.;-----.\\  .-'),-----.       ")
      console.log("('-| _.---' |  .---' |  .---'| .-.  | ( OO'  .-.  '      ")
      console.log("(OO|(_\\     |  |     |  |    | '-' /_)/   |  | |  |      ")
      console.log("/  |  '--. (|  '--. (|  '--. | .-. `. \\_) |  |\\|  |      ")
      console.log("\\_)|  .--'  |  .--'  |  .--' | |  \\  |  \\ |  | |  |      ")
      console.log("  \\|  |_)   |  `---. |  `---.| '--'  /   `'  '-'  '      ")
      console.log("   `--'     `------' `------'`------'      `-----'       ")
      return;
    }
  });

  // if message upserted
  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    // console.log(messages);
    
    let name = messages[0]?.pushName;
    const Message = messages[0]?.message;
    // console.log(Message,type);
    try {
      if (type === "notify") {
        let captureMessage; console.log(chalk.blue.bold(name)+" : ");
        if (Message.hasOwnProperty("conversation"))
          captureMessage = Message.conversation;
        else if (Message.hasOwnProperty("extendedTextMessage") && Message.extendedTextMessage.hasOwnProperty("text"))
          captureMessage = Message.extendedTextMessage.text;
        else if(Message.hasOwnProperty("reactionMessage") && Message.reactionMessage.hasOwnProperty("text"))
          captureMessage = "Reacted " + Message.reactionMessage.text;
        else if(Message.hasOwnProperty("stickerMessage"))
          captureMessage = "sent a sticker"
        else if(Message.hasOwnProperty("imageMessage"))
          captureMessage = "sent an image";
        else if(Message.hasOwnProperty("documentMessage"))
          captureMessage = "sent a document";
        else{
          captureMessage = "[Unknown operation performed]...";
          return;          
        }

        console.log(captureMessage);
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
            "Enter your Handle. reply as 'feebo handle platform_name handle_name'\n\nAllowed platform names are cf(Codeforces),lc(Leetcode),cc(Codechef),ac(Atcoder)\n\nfor eg : feebo handle cf aniket54";
          send(sock, numberWa, reply, handleText);
        } else if (compareMessage === "feebo 2") {
          checkRating(sock, numberWa, reply, UID);
        } else if (compareMessage === "feebo 3") {
          loadContests(sock, numberWa, reply);
        } else if (compareMessage === "feebo 4") {
          const getquesText =
            "Write your demand as 'feebo get rating count',this will provide you 'count' no. of questions of 'rating' rating.\n\n for eg : feebo get 1500 4";
          send(sock, numberWa, reply, getquesText);
        } 
        else if(compareMessage === "feebo link"){
          send(sock,numberWa,reply,"https://codeforces.com/contests?filterTypes=div2&filterTypes=div1div2&filterTypes=educational&filterTypes=ton&filterRated=yes&filterTried=&filterSubstring=");
        }
        else {
          try {
            let newmessage = compareMessage.split(" ");
            if (newmessage[0] === "feebo") {
              if (newmessage[1] === "handle") {
                if(newmessage[2] === "cf" || newmessage[2] === "cc" || newmessage[2] === "lc" || newmessage[2] === "ac")
                {
                  addhandle(UID, newmessage[3],newmessage[2]);
                  const success = "Handle saved successfully.";
                  send(sock, numberWa, reply, success);
                }
              } else if (newmessage[1] === "get") {
                let rating, count;
                rating = newmessage[2];
                count = newmessage[3];
                console.log(rating, count);
                getQuestions(sock, numberWa, reply, rating, count);
              }
              else if(newmessage[1]=== "spam")
              {
                let n = newmessage[2];
                let text =""
                for(let i=3;i<newmessage.length;i++)
                {
                  text+=newmessage[i] + " ";
                }
                for(let i=0;i<n;i++)
                {
                  send(sock,numberWa,reply,text);
                  sleep(200);
                }
              }
              else if(newmessage[1] === "virtual")
              {
                let clink = "https://codeforces.com/contest/" + (Math.floor(Math.random() * 100) + 1900);
                clink += "\n\n"+ getRandomQuoteFromFile()
                send(sock,numberWa,reply,clink);
              }
              else if(newmessage[1] === "quote")
              {
                send(sock,numberWa,reply,getRandomQuoteFromFile());
              }
            }
          } catch (error) {
            console.log("error ", error);
          }
        }
      }
      else if(type==="append")
      {
        console.log(chalk.blue.bold("Feebo")+" : ")
        console.log(Message?.extendedTextMessage?.text);

      }
    } catch (error) {
      console.log("error ", error);
    }
  });

  sock.ev.on("creds.update", saveCreds);
}

connectToWhatsApp().catch((err) => console.log("unexpected error: " + err)); // catch any errors
function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}