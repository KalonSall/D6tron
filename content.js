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
  const diceCount = Math.min(10, params[0]); //Limit to 10 dices by command
  const diceSize = Math.max(2, Math.min(100, params[1])); //limit to a dice size of 100 max and 2 min
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

function addRandomNumbersToPosts() {

  const posts = document.querySelectorAll('.post'); //Get post

  posts.forEach((post) => {
    const lazyImageElement = post.querySelector('img.lazy');  //Get image of post
    if (lazyImageElement) {
      const infosAuteurDiv = post.querySelector('.infos_auteur');
      const pElement = infosAuteurDiv.querySelector('p');
      const authorName = pElement.textContent.trim();

      const dataSrcValue = lazyImageElement.getAttribute('data-src'); //Get image source path
      const pathArray = dataSrcValue.split("/");
      const filename = pathArray.pop();
      const imagename = filename.split(".")[0].toLowerCase(); //Get the file name of image without the extension

      //Find XdN command matches in filename
      const pattern = /[0-9]+[d][0-9]+/g;
      let matches = imagename.match(pattern);

      if (matches && matches.length > 0) {
        let seed = imagename; //Initialize seed with filename

        //Check if there is only one dice. If so, final log will be simplified
        const results = [];
        let includeCommandInResult = 1;
        let diceTypeMessage = "des dés";
        if (matches.length == 1) {
          if (parseInt(matches[0].split("d")[0]) == 1) {
            diceTypeMessage = `un dé à ${Math.max(2, parseInt(Math.min(100, matches[0].split("d")[1])))} faces`;
            includeCommandInResult = 0;
          }
        }

        matches = matches.slice(0, 10);  //Limit to 10 dice commands

        matches.forEach((match) => {
          seed = strHash(seed.concat(authorName, match));  //Update seed
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


window.addEventListener('load', addRandomNumbersToPosts);

