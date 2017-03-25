const utils = require("./utils");
const { $, readFileAsString } = utils;

const stageJsonToCanvas = require("./stageJsonToCanvas");

//==============================================================================

const $panelDrop = $(".panel-drop");

$panelDrop.addEventListener("dragover", evt => {
  evt.stopPropagation();
  evt.preventDefault();
  evt.dataTransfer.dropEffect = "copy";
});

$panelDrop.addEventListener("drop", evt => {
  evt.stopPropagation();
  evt.preventDefault();

  let file = evt.dataTransfer.files[0];

  readStageJson(file);
});

const $btnUpdate = $(".btn-update");

$btnUpdate.addEventListener("click", updateStageJson);

//==============================================================================

function readStageJson(file) {
  readFileAsString(file).then(string => {
    let json = JSON.parse(string);
    window._cacheStageJson = string;

    // Get start time
    for(let i = 0 ; i < json.length ; i++) {
      if(json[i].sec !== "" && json[i].sec !== 0) {
        $("#options-start").value = json[i].sec;
        break;
      }
    }

    let canvas = stageJsonToCanvas(json, {});
    let oldCanvas = $(".pane-left canvas");

    if(oldCanvas) changeCanvas(oldCanvas, canvas);
    else {
      $(".pane-left").innerHTML = "";
      $(".pane-left").appendChild(canvas);
    }
  });
}

function changeCanvas(oldCanvas, newCanvas) {
  let ctx = oldCanvas.getContext("2d");
  ctx.clearRect(0, 0, oldCanvas.width, oldCanvas.height);

  oldCanvas.width = newCanvas.width;
  oldCanvas.height = newCanvas.height;

  ctx.drawImage(
    newCanvas,
    0, 0, newCanvas.width, newCanvas.height,
    0, 0, newCanvas.width, newCanvas.height
  );
}

function parseTextarea(selector, regex, fn) {
  let content = $(selector).value;
  content = content.split("\n").filter(line => !line.startsWith(";")).map(line => line.trim());

  for(let line of content) {
    let match = line.match(regex);
    if(!match) continue;

    fn(match);
  }
}

function updateStageJson() {
  if(!window._cacheStageJson) return;

  let json = JSON.parse(window._cacheStageJson);

  let options = {
    start: parseFloat($("#options-start").value),
    sofuran: [],
    baseBpm: parseFloat($("#options-baseBpm").value),

    upbeat: parseFloat($("#options-upbeat").value),
    measure: {},

    beatsPerColumn: parseInt($("#options-beatsPerColumn").value),
    column: {},

    info: {},
    style: $("#options-style").value,
    mirror: $("#options-mirror").checked,
  };

  parseTextarea("#options-sofuran", /(\d+|\d+\.\d+)\s*::\s*(\d+|\d+\.\d+)/, match => {
    options.sofuran.push({ time: parseFloat(match[1]), bpm: parseFloat(match[2]) });
  });

  parseTextarea("#options-measure", /(\d+)\s*::\s*(\d+|\d+\.\d+)/, match => {
    options.measure[match[1]] = parseFloat(match[2]);
  });

  parseTextarea("#options-column", /(\d+)\s*::\s*(\d+)/, match => {
    options.column[match[1]] = parseFloat(match[2]);
  });

  let canvas = stageJsonToCanvas(json, options);
  let oldCanvas = $(".pane-left canvas");

  changeCanvas(oldCanvas, canvas);
}
