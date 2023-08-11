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
  const diceCount = Math.min(10, params[0]); // Limit to 10 dices by command
  const diceSize = Math.max(2, Math.min(100, params[1])); // Limit to a dice size of 100 max and 2 min
  const textArray = [];
  for (let i = 0; i < diceCount; i++) {
    textArray.push(`<b>${generateRandomNumber(seed, 1, diceSize).toString()}</b>`);
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

function exctractDiceCommands(str) {
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
      let matches = exctractDiceCommands(imagename);

      if (matches && matches.length > 0) {
        let seed = imagename; //Initialize seed with filename

        // Check if there is only one dice. If so, final log will be simplified
        const results = [];
        let includeCommandInResult = 1;
        let diceTypeMessage = "des dés";
        if (matches.length == 1) {
          if (parseInt(matches[0].split("d")[0]) == 1) {
            diceTypeMessage = `un dé à ${Math.max(2, parseInt(Math.min(100, matches[0].split("d")[1])))} faces`;
            includeCommandInResult = 0;
          }
        }

        matches = matches.slice(0, 10);  // Limit to 10 dice commands

        matches.forEach((match) => {
          seed = strHash(seed.concat(authorName, match));  // Update seed
          const res = executeDiceCommand(match, seed, includeCommandInResult);
          results.push(res);
        });

        const message = results.join(" | ");

        const diceResultBox = document.createElement('div');
        diceResultBox.className = 'diceResultBox';
        diceResultBox.innerHTML = `
          <div>
          <span class="diceResultText">🎲 <b>${authorName}</b> lance ${diceTypeMessage} !<br>${message}</span>
          </div>
        `;

        post.appendChild(diceResultBox);
      }
    }
  });
}

function addCmdToFuturePost() {
  const posts = document.querySelectorAll('.drop_bloc'); //Get post
  posts.forEach((post) => {
    let cmdbox = post.querySelector('.diceResultBox'); //Get post
    if (!cmdbox) {
      cmdbox = document.createElement('div');
      cmdbox.className = 'diceResultBox';
    }
    const hidden = post.querySelector('input[type="hidden"]');
    const filename = hidden.value; //Get image source path
    const imagename = filename.split(".")[0]; //Get the file name of image without the extension
    const matches = exctractDiceCommands(imagename);
    if (matches) {
      const message = matches.join(" | ");
      cmdbox.innerHTML = `
            <div>
            <span class="diceResultText"><span style="font-size: 10px;">🎲 ${message}</span></span>
            </div>
          `;
      post.appendChild(cmdbox);
    }
  }
  )
}

function addReminder() {
  const responseBloc = document.querySelector('div[id="repondreTopic"]');
  const noteBox = document.createElement('div');
  noteBox.className = 'diceResultBox';
  noteBox.innerHTML = `
            <details>
            <summary>🎲 <b>Règles D6tron</b> 🍋</summary>
            <span class="diceResultText">
            Pour lancer un dé, ajoutez à la fin du nom de votre fichier le mot "<b>roll</b>" suivi de vos lancers au format <b>XdN</b> (1d6, 3d8, 2d100, etc.)<br>
            <br>
            <u>Exemples :</u><br>
            Lancer <b>un dé 6</b> : <span style="color: #FFDC63;">monfichier</span>.png&nbsp➔&nbsp<span style="color: #FFDC63;">monfichier</span>_<b>roll_1d6</b>.png<br>
            Lancer <b>2d100 et 3d8</b> : <span style="color: #FFDC63;">monautrefichier</span>.jpg&nbsp➔&nbsp<span style="color: #FFDC63;">monautrefichier</span>_<b>roll_2d100_3d8</b>.jpg<br>
            <br>
            <span style="font-size: 10px;">Un encart de confirmation apparaît sous votre fichier déposé ci-dessus si un lancer est détecté !</span>
            </details>
          `;
  responseBloc.appendChild(noteBox);
}


addRandomNumbersToPosts();
addReminder();

// TODO: understand how to call a function when an update is made instead of on a time interval :(
// Poll for changes every 1 second 
setInterval(addCmdToFuturePost, 1000);