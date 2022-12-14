/**
 * Parses a Discord message CSV. This function will take a list of lines as input,
 * and spit out a nicely formatted object with all of the information of the CSV.
 * To prevent finding a comma where we didn't mean to, say in the message, I am checking whether
 * or not there is a comma at the end of the line, because a comma at the end indicates that
 * there is no attatchment information, getting the ID and Timestamp, then grabing the rest,
 * because the rest is the message.
 *
 * @TODO desc antiquated, fix this ^
 */
Array.prototype.parse = function () {
  let csv = {
    ID: [],
    Timestamp: [],
    Contents: [],
    Attachments: [],
  };
  // console.log(this)
  this.forEach((lines) => {
    if (lines.length === 0) {
      return;
    }
    let inMessage = false;
    let message = '';

    // for debuging
    // csv.ID.push(new String(lines));
    // csv.Contents.push(lines);

    if (lines.includes('"')) {
      lines.split('\n').forEach((line) => {
        if (line.includes('"')) {
          let lineArr = line.split(',');
          lineArr.splice(0, 2);
          message += '\n' + lineArr;
          if ((line.split('"').length - 1) % 2 === 1) {
            if (inMessage) {
              console.log(message);
              inMessage = false;
            } else inMessage = true;
          } else {
            // console.log(line, "\n", inMessage)
          }
        } else if (!inMessage) {
          let vals = line.split(',');
          if (vals.every((e) => e === '')) {
            return;
          }
          csv.ID.push(vals[0]);
          csv.Timestamp.push(vals[1]);
          csv.Contents.push(vals[2]);
          csv.Attachments.push(vals[3]);
          if (vals[3] === undefined) {
            console.log(vals);
          }
        } else if (inMessage) {
          // console.log(line, (line.split("\"").length - 1))
          message += '\n' + line;
        }
        // console.log(line, inMessage, (line.split("\"").length - 1))
      });
    } else {
      lines.split('\n').forEach((line) => {
        let vals = line.split(',');
        if (vals.every((e) => e === '')) {
          return;
        }
        csv.ID.push(vals[0]);
        csv.Timestamp.push(vals[1]);
        csv.Contents.push(vals[2]);
        csv.Attachments.push(vals[3]);
        if (vals[3] === undefined) {
          console.log(vals);
        }
      });
    }
  });
  return csv;
};

var promises;
var tempMap;
var a;
const init = async () => {
  console.clear();
  promises = [];
  const dirHandle = await window.showDirectoryPicker();
  await logFiles(dirHandle);
  console.log(promises);
  tempMap = promises.map((p) => p.CSV.split('\r\n'));
  tempMap.forEach(function (e) {
    e.shift();
  });
  tempMap = tempMap.flat().parse();
  console.log(tempMap);
};
async function logFiles(handle) {
  for await (const entry of handle.values()) {
    let temp = {
      CSV: '',
      Type: '',
      URL: '',
      ServerName: '',
      Channel: '',
      Original: {},
    };
    if (entry.kind !== 'file' && entry.kind !== 'directory') {
      continue;
    }
    if (entry.kind == 'directory') {
      await logFiles(entry);
    }
    if (entry.kind == 'file') {
      // promises.push(await entry.getFile().then(async (file) => {return await file.text();}));
      await entry.getFile().then(async (file) => {
        if (file.type == 'text/csv') {
          temp.CSV = await file.text();
        } else if (file.type == 'application/json') {
          let channel = JSON.parse(await file.text());
          temp.Original = channel;
          if (channel.guild === undefined) {
            temp.Type = 'DM';
            temp.URL = `https://discord.com/channels/@me/${channel.id}`;
          } else {
            temp.Type =
              channel.type === 0
                ? 'Channel'
                : channel.type === 2
                ? 'VC'
                : 'Probably A Thread or Something';
            temp.ServerName = channel.guild.name;
            temp.Channel = channel.name;
            temp.URL = `https://discord.com/channels/${channel.guild.id}/${channel.id}`;
          }
        }
      });
    }
    if (promises.length === 0) {
      promises.push(temp);
    } else {
      let lastPromise = promises[promises.length - 1];
      if (temp.CSV !== '' && lastPromise.CSV === '') {
        promises[promises.length - 1].CSV = temp.CSV;
      } else if (temp.CSV === '' && lastPromise.CSV !== '') {
        temp.CSV = lastPromise.CSV;
        promises[promises.length - 1] = temp;
      } else {
        promises.push(temp);
      }
    }
  }
  return promises;
}

const dirButton = document.getElementById('dirPicker');
dirButton.addEventListener('click', init);
