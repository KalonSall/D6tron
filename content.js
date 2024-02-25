const keyword_Roll_Update_Activation_Date = "20230814000000"
const v1_1_05_Seed_Parameter_Change_Activation_Date ="20240310000000"
const DICE_MAX_SIZE = 100
const DICE_MIN_SIZE = 2

function generateSeededRandomInt(str) {
  let hash = 0;
  if (str.length === 0) return hash;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash;
}

function generateSeededRandomString(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return hash.toString();
}

function generateSeededRandomNumberInRange(seed, min, max) {
  //Get unbound random number
  const hashedSeed = generateSeededRandomInt(seed.toString());
  //Use it to get a random number in wanted range
  const randomNumber = (Math.abs(hashedSeed) % (max - min + 1)) + min;
  return randomNumber;
}

function executeDiceCommand(command, seed, includeCommandInResult) {
  const params = command.split("d");
  const diceCount = parseInt(params[0]);
  const diceSize = parseInt(params[1]);
  const textArray = [];
  for (let i = 0; i < diceCount; i++) {
    let randomNumber = generateSeededRandomNumberInRange(seed, 1, diceSize).toString();
    if (diceSize == 2) {
      randomNumber = (randomNumber == "1") ? "Pile" : "Face";
    }
    textArray.push(`<b>${randomNumber}</b>`);
    seed = generateSeededRandomString(seed.concat((diceSize * (i + 1) * 123456).toString()))
  }
  let end = ""
  if (textArray.length > 1) {
    end = textArray.pop()
  }
  let result = `${textArray.join(", ")}`;
  if (includeCommandInResult) {
    result = `${diceCount}d${diceSize} : ` + result;
  }
  if (end.length > 0) {
    result = [result, end].join(" et ");
  }
  return result;
}

function extractDiceCommands(str) {
  let matches = null;
  const pattern = /[0-9]+[d][0-9]+/g;
  str = str.toLowerCase();
  if (str.includes("roll")) {
    const splitstr = str.split("roll");
    matches = splitstr.pop().match(pattern);
  }

  //Exception to keep results from before 14/09/2023
  if (!matches) {
    const topicId = parseInt(document.location.href.split("/")[4]);
    if (topicId == 3330) {
      const postdatematches = str.match(/^([0-9]+)-/g);
      if (postdatematches) {
        const postdate = parseInt(postdatematches[0].replace("-", ""));
        if (postdate < keyword_Roll_Update_Activation_Date) {
          matches = str.match(pattern);
        }
      }
    }
  }

  if (matches) {
    matches = matches.slice(0, 10);   // Limit to 10 dice commands
    for (let i = 0; i < matches.length; i++) {
      const params = matches[i].split("d");
      const diceCount = Math.min(10, params[0]); // Limit to 10 dices by command
      const diceSize = Math.max(DICE_MIN_SIZE, Math.min(DICE_MAX_SIZE, params[1])); // Limit to a dice size of 100 max and 2 min
      matches[i] = diceCount.toString() + "d" + diceSize.toString();
    }
  }
  return matches;
}

function addRandomNumbersToPosts() {
  const posts = document.querySelectorAll('.post'); // Get post
  posts.forEach((post) => {
    const lazyImageElement = post.querySelector('img.lazy');  // Get image of post
    if (lazyImageElement) {
      const infosAuteurDiv = post.querySelector('.infos_auteur');
      const pElement = infosAuteurDiv.querySelector('p');
      const authorName = pElement.textContent.trim();

      const dataSrcValue = lazyImageElement.getAttribute('data-src'); // Get image source path
      const pathArray = dataSrcValue.split("/");
      const filename = pathArray.pop();
      const imagename = filename.split(".")[0]; // Get the file name of image without the extension

      
      let postdate = null
      const postdatematches = imagename.match(/^([0-9]+)-/g);
      if (postdatematches) {
        postdate = parseInt(postdatematches[0].replace("-", ""));
      }

      // Find XdN command matches in filename
      let matches = extractDiceCommands(imagename);

      if (matches && matches.length > 0) {
        let seed = imagename; //Initialize seed with filename

        // Check if there is only one dice. If so, final log will be simplified
        const results = [];
        let includeCommandInResult = 1;
        let diceTypeMessage = "des dés";
        if (matches.length == 1) {
          includeCommandInResult = 0;
          if (parseInt(matches[0].split("d")[0]) == 1) {
            diceTypeMessage = `un dé à ${Math.max(DICE_MIN_SIZE, parseInt(Math.min(DICE_MAX_SIZE, matches[0].split("d")[1])))} faces`;
            if (parseInt(matches[0].split("d")[1]) == 6) {
              diceTypeMessage = `un dé`;
            }
            if (parseInt(matches[0].split("d")[1]) == 2) {
              diceTypeMessage = `une pièce`;
            }
          } else {
            if (parseInt(matches[0].split("d")[1]) == 2) {
              diceTypeMessage = `des pièces`;
            } 
            else if (parseInt(matches[0].split("d")[1]) != 6) {
              diceTypeMessage = `des dés à ${Math.max(DICE_MIN_SIZE, parseInt(Math.min(DICE_MAX_SIZE, matches[0].split("d")[1])))} faces`;
            }
          }
        }

        matches.forEach((match) => {
          if(postdate && postdate<v1_1_05_Seed_Parameter_Change_Activation_Date){
            seed = generateSeededRandomString(seed.concat(authorName, match));  // Update seed
          } else {
            seed = generateSeededRandomString(seed.concat(match));  // Update seed
          }
          const res = executeDiceCommand(match, seed, includeCommandInResult);
          results.push(res);
        });

        const message = results.join(`<span style="color: #76a7aa;"> | </span>`);

        const diceResultBox = document.createElement('div');
        diceResultBox.className = 'diceResultBox';
        const rollDiceMessage = document.createElement('div');
        
        // Clear existing content of rollDiceMessage
        rollDiceMessage.textContent = '';
        
        // Create the necessary elements
        const diceIcon = document.createElement('span');
        diceIcon.textContent = '🎲 ';
        
        const authorElement = document.createElement('b');
        authorElement.textContent = authorName;
        
        const dicemessage = document.createElement('span');
        dicemessage.textContent = ` lance ${diceTypeMessage} !`;
        
        // Append elements to rollDiceMessage
        rollDiceMessage.appendChild(diceIcon);
        rollDiceMessage.appendChild(authorElement);
        rollDiceMessage.appendChild(dicemessage);

        const resultDiceMessage = document.createElement('div');
        resultDiceMessage.style.fontSize = "22px";
        resultDiceMessage.style.marginTop = "4px";
        resultDiceMessage.innerHTML = `${message}`;

        diceResultBox.appendChild(rollDiceMessage)
        diceResultBox.appendChild(resultDiceMessage)
        post.appendChild(diceResultBox);
      }
    }
  });
}

function addReminder() {
  const responseBloc = document.querySelector('div[id="repondreTopic"]');
  if (responseBloc) {
    const noteBox = document.createElement('div');
    noteBox.className = 'manualBox';

    const details = document.createElement('details');
    details.className = 'manualDetails';
    details.style.fontSize = '14px';
    details.style.margin = '3px';

    const summary = document.createElement('summary');
    summary.style.fontWeight = 'bold';
    summary.textContent = `Comment faire un jet de dés 🎲`

    const manual = document.createElement('p');
    manual.innerHTML = `Pour lancer un dé, ajoutez à la fin du nom de votre fichier le mot "<b>roll</b>" suivi de vos lancers au format <b>XdN</b> (1d6, 3d8, 2d100, etc.)
    <br>⚠️ Pas de nom de fichier de plus de <b>28 lettres</b> !`

    const examples = document.createElement('p');
    examples.style.fontSize = "13px";
    examples.innerHTML = `
    <u>Exemples :</u>
    <br>
    Lancer <b>un dé 6</b> : <span style="color: #FFDC63;"><b>fichier</b></span>.png&nbsp➔&nbsp<span style="color: #FFDC63;"><b>fichier</b></span>-<b>roll-1d6</b>.png
    <br>
    Lancer <b>2d100 et 3d8</b> : <span style="color: #FFDC63;"><b>fichier</b></span>.jpg&nbsp➔&nbsp<span style="color: #FFDC63;"><b>fichier</b></span>-<b>roll-2d100-3d8</b>.jpg
    `

    const footNote = document.createElement('p');
    footNote.style.fontSize = "11px";
    footNote.textContent = `Un encart de confirmation apparaît sous votre fichier déposé ci-dessus si un lancer est détecté !`;

    details.appendChild(summary);
    details.appendChild(manual);
    details.appendChild(examples);
    details.appendChild(footNote);
    noteBox.appendChild(details);

    responseBloc.appendChild(noteBox);
  }
}

function addCmdToFuturePost(mutationsList, observer) {
  //Check if there is a change in the uploaded images
  let needUpdate = false;
  mutationsList.forEach((mutation) => {
    if (mutation.target.className == "drop_area" || mutation.target.getAttribute('type') == "hidden") {
      needUpdate = true;
    }
  })
  //If a change is detected, update the cmdbox
  if (needUpdate) {
    const posts = document.querySelectorAll('.drop_bloc');  // Get drop zone
    posts.forEach((post) => {
      let cmdbox = post.querySelector('.diceCommandBox');
      const hidden = post.querySelector('input[type="hidden"]');
      const filename = hidden.value; //Get image file name
      const filenameTooLong = filename.length>"perline-dee-mort-dee-roll-1d.jpg".length;
      const imagename = filename.split(".")[0]; //Get the file name of image without the extension
      const matches = extractDiceCommands(imagename);
      if (matches) {
        if (!cmdbox) {
          cmdbox = document.createElement('div');
          cmdbox.className = 'diceCommandBox';
        }
        const message = matches.join(", ");  
        cmdbox.innerHTML = `<span class="diceResultText">🎲 ${message}</span>`
        if (filenameTooLong) {
          cmdbox.innerHTML = `<span class="diceResultText">⚠️ D6tron\nNom trop long</span>`;
          cmdbox.style.fontSize = "10px";
          cmdbox.style.backgroundColor = "#FF0000";
        } else {
          cmdbox.style.fontSize = "";
          cmdbox.style.backgroundColor = "";
        }
        post.appendChild(cmdbox);
      }
      else if (cmdbox) {
        post.removeChild(cmdbox);
      }
    })
  }
}

function ObserveUploadedImagesToUpdateCmdToFuturePost() {
  const drop_area = document.querySelector('.drop_zone')
  if (drop_area) {
    const observer = new MutationObserver(addCmdToFuturePost);
    const observeOptions = { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'value'] };
    observer.observe(drop_area, observeOptions);
  }
}

addRandomNumbersToPosts();
addReminder();
ObserveUploadedImagesToUpdateCmdToFuturePost()