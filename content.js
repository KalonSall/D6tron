function intHash(str) {
  let hash = 0;
  if (str.length === 0) return hash;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash;
}

function strHash(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return hash.toString();
}

function generateRandomNumber(seed, min, max) {
  const hashedSeed = intHash(seed.toString());
  const rng = (Math.abs(hashedSeed) % (max - min + 1)) + min;
  return rng;
}

function executeDiceCommand(command, seed, includeCommandInResult) {
  const params = command.split("d");
  const diceCount = params[0];
  const diceSize = params[1];
  const textArray = [];
  for (let i = 0; i < diceCount; i++) {
    let randomNumber = generateRandomNumber(seed, 1, diceSize).toString();
    if (diceSize == 2) {
      randomNumber = (randomNumber == "1") ? "Pile" : "Face";
    }
    textArray.push(`<b>${randomNumber}</b>`);
    seed = strHash(seed.concat((diceSize * (i + 1) * 123456).toString()))
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

  //Very dirty exception, my ancestors are ashamed
  if (!matches) {
    const topicId = parseInt(document.location.href.split("/")[4]);
    if (topicId == 3330) {
      const postdatematches = str.match(/^([0-9]+)-/g);
      if (postdatematches) {
        const postdate = parseInt(postdatematches[0].replace("-", ""));
        if (postdate < 20230814000000) {
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
      const diceSize = Math.max(2, Math.min(100, params[1])); // Limit to a dice size of 100 max and 2 min
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
            diceTypeMessage = `un dé à ${Math.max(2, parseInt(Math.min(100, matches[0].split("d")[1])))} faces`;
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
          }
        }

        matches.forEach((match) => {
          seed = strHash(seed.concat(authorName, match));  // Update seed
          const res = executeDiceCommand(match, seed, includeCommandInResult);
          results.push(res);
        });

        const message = results.join(`<span style="color: #76a7aa;"> | </span>`);

        const diceResultBox = document.createElement('div');
        diceResultBox.className = 'diceResultBox';
        const rollDiceMessage = document.createElement('div');
        rollDiceMessage.innerHTML = `🎲 <b>${authorName}</b> lance ${diceTypeMessage} !`;
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
    manual.innerHTML = `Pour lancer un dé, ajoutez à la fin du nom de votre fichier le mot "<b>roll</b>" suivi de vos lancers au format <b>XdN</b> (1d6, 3d8, 2d100, etc.)`

    const examples = document.createElement('p');
    examples.style.fontSize = "13px";
    examples.innerHTML = `
    <u>Exemples :</u>
    <br>
    Lancer <b>un dé 6</b> : <span style="color: #FFDC63;"><b>monfichier</b></span>.png&nbsp➔&nbsp<span style="color: #FFDC63;"><b>monfichier</b></span>_<b>roll_1d6</b>.png
    <br>
    Lancer <b>2d100 et 3d8</b> : <span style="color: #FFDC63;"><b>monautrefichier</b></span>.jpg&nbsp➔&nbsp<span style="color: #FFDC63;"><b>monautrefichier</b></span>_<b>roll_2d100_3d8</b>.jpg
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
      const imagename = filename.split(".")[0]; //Get the file name of image without the extension
      const matches = extractDiceCommands(imagename);
      if (matches) {
        if (!cmdbox) {
          cmdbox = document.createElement('div');
          cmdbox.className = 'diceCommandBox';
        }
        const message = matches.join(", ");
        cmdbox.innerHTML = `<span class="diceResultText">🎲 ${message}</span>`;
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