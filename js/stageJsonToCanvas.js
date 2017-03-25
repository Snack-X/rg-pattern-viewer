//==============================================================================
// Constants

const SZ_BEAT = 48; // height of one beat

const SZ_LANE = 22; // width of one lane
const SZ_NOTEAREA = SZ_LANE * 5;

const SZ_COLUMN_MARGIN = 20; // margin of a column
const SZ_COLUMN = SZ_NOTEAREA + SZ_COLUMN_MARGIN * 2;

const SZ_INFO = 50; // height of information on top
const SZ_PADDING = 30; // padding of image

const SZ_NOTE = 6; // radius of a note
const SZ_LONG = 12; // width of a long note body
const SZ_SLIDE = 8; // width of a slide(true slide) connection

const ST_NOTE = {
  pink: "#ef3294",
  blue: "#2496f8",
  orange: "#f78200",
  black: "#000000",
};

const ST_LONG = {
  pink: "#f093b2",
  blue: "#73def7",
  orange: "#fcc64a",
  black: "#aaaaaa",
};

const ST_ASSIST = {
  "1": "#000000",
  "2": "#aaaaaa",
  "3": "#dddddd",
  bpm: "#ff0000",
};

//==============================================================================
// Helpers

function drawLine(ctx, sx, sy, ex, ey, width, stroke) {
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(ex, ey);

  ctx.lineWidth = width;
  ctx.strokeStyle = stroke;

  ctx.stroke();
  ctx.closePath();
}

function drawCircle(ctx, x, y, radius, fill) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.closePath();
}

function drawRect(ctx, sx, sy, ex, ey, fill) {
  var width = ex - sx;
  var height = ey - sy;

  ctx.fillStyle = fill;
  ctx.fillRect(sx, sy, width, height);
}

function _timeToBeat(options, time) {
  if(options.sofuran && options.sofuran.length > 0) {
    let beat = 0, timePassed = 0;

    for(let i = 0 ; i < options.sofuran.length ; i++) {
      let nowSofuran = options.sofuran[i];
      let nextSofuran = options.sofuran[i + 1];

      if(nextSofuran) {
        if(time < nextSofuran.time) {
          beat += nowSofuran.bpm / 60 * (time - timePassed);
          return beat;
        }
        else {
          let interval = nextSofuran.time - nowSofuran.time;
          beat += nowSofuran.bpm / 60 * interval;
          timePassed += interval;
        }
      }
      else {
        beat += nowSofuran.bpm / 60 * (time - timePassed);
        return beat;
      }
    }
  }
  else return options.baseBpm / 60 * time;
}

function timeToBeat(options, time) {
  return Math.round(_timeToBeat(options, time) * 48) / 48;
}

//==============================================================================
// Canvas rendering - First Stage
//   Draw everything in one long canvas

function firstStage(json, options) {
  // 1. Calculate total length
  //    BPM changes are taken into account on calculation
  let timeStart = options.start;
  let timeEnd = json[json.length - 1].sec;

  let length = timeEnd - timeStart;
  let totalBeats = timeToBeat(options, length);

  // 2. Calculate size of canvas
  let canvasWidth = SZ_PADDING * 2 + SZ_NOTEAREA;
  let canvasHeight = SZ_PADDING * 2 + totalBeats * SZ_BEAT;

  let imageTop = SZ_PADDING, imageBottom = canvasHeight - SZ_PADDING;
  let imageLeft = SZ_PADDING, imageRight = canvasWidth - SZ_PADDING;

  // 3. Make canvas
  let cv = document.createElement("canvas");
  cv.width = canvasWidth;
  cv.height = canvasHeight;

  let ctx = cv.getContext("2d");
  ctx.imageSmoothingEnabled = true;

  // 4. Draw notes
  // 4-1) Draw long note body, slide(true slide) connection
  let longStatus = [null, false, false, false, false, false];
  let slideGroup = {};

  for(let note of json) {
    let type = note.type;
    let time = note.sec;
    let endPos = note.finishPos;
    let status = note.status;
    let groupId = note.groupId;

    let delta = time - timeStart;

    // Options
    if(options.mirror) endPos = [0, 5, 4, 3, 2, 1][endPos];

    // Long note body
    if(type === 1 || type === 2) {
      let longStart = longStatus[endPos];
      let beat = timeToBeat(options, delta);

      if(type === 2 && longStart === false) {
        longStatus[endPos] = beat;
      }
      else if((type === 1 && longStart !== false) || type === 2) {
        let longEnd = beat;

        // x should be at the center of a lane
        let x = imageLeft + SZ_LANE * (endPos - 0.5);

        let sx = x - (SZ_LONG / 2);
        let ex = x + (SZ_LONG / 2);

        let sy = imageBottom - (longStart * SZ_BEAT);
        let ey = imageBottom - (longEnd   * SZ_BEAT);

        drawRect(ctx, sx, sy, ex, ey, ST_LONG[options.style]);
        longStatus[endPos] = false;
      }
    }

    // Slide connection
    if(groupId !== 0) {
      let slideBefore = slideGroup[groupId];
      let beat = timeToBeat(options, delta);

      // Workaround for nasty slide group reusing
      if(slideBefore && (beat - slideBefore[1] < 4)) {
        let sx = imageLeft + (SZ_LANE * (slideBefore[0] - 1)) + (SZ_LANE / 2);
        let ex = imageLeft + (SZ_LANE * (endPos         - 1)) + (SZ_LANE / 2);

        let sy = imageBottom - (slideBefore[1] * SZ_BEAT);
        let ey = imageBottom - (beat           * SZ_BEAT);

        drawLine(ctx, sx, sy, ex, ey, SZ_SLIDE, ST_LONG[options.style]);
      }

      slideGroup[groupId] = [endPos, beat];
    }
  }

  // 4-2) Draw note and arrow
  for(let note of json) {
    let type = note.type;
    let time = note.sec;
    let endPos = note.finishPos;
    let status = note.status;

    let delta = time - timeStart;

    // Options
    if(options.mirror) {
      endPos = [0, 5, 4, 3, 2, 1][endPos];
      status = [0, 2, 1][status];
    }

    if(type === 1 || type === 2) {
      let beat = timeToBeat(options, delta);

      // x should be at the center of a lane
      let x = imageLeft + SZ_LANE * (endPos - 0.5);
      let y = imageBottom - (beat * SZ_BEAT);

      drawCircle(ctx, x, y, SZ_NOTE, ST_NOTE[options.style]);

      // Long note has a circle inside
      // Draw two circles for a outline effect
      if(type === 2) {
        drawCircle(ctx, x, y, SZ_NOTE - 3, "#ffffff");
        drawCircle(ctx, x, y, SZ_NOTE - 3.5, ST_NOTE[options.style]);
      }

      // Draw arrow
      if(status !== 0) {
        ctx.beginPath();

        // MAGIC LIES HERE
        var r = status === 1 ? -1 : 1;
        ctx.moveTo(x - (5 * r), y - 1);
        ctx.lineTo(x - (5 * r), y + 1);
        ctx.lineTo(x,           y + 1);
        ctx.lineTo(x,           y + 4);
        ctx.lineTo(x + (5 * r), y);
        ctx.lineTo(x,           y - 4);
        ctx.lineTo(x,           y - 1);

        ctx.fillStyle = "#ffffff";
        ctx.fill();

        ctx.closePath();
      }
    }
  }

  // 5. Draw informations
  // 5-1) BPM changes
  if(options.sofuran.length === 0) {
    options.sofuran.push({ time: 0, bpm: options.baseBpm });
  }

  for(let i = 0 ; i < options.sofuran.length ; i++) {
    let sx = imageLeft, ex = imageRight;
    let beat = timeToBeat(options, options.sofuran[i].time);
    let y = imageBottom - (beat * SZ_BEAT) - 0.5;

    drawLine(ctx, sx, y, ex, y, 1, ST_ASSIST.bpm);

    ctx.font = "bold 14px";
    ctx.fillStyle = ST_ASSIST.bpm;
    ctx.fillText(options.sofuran[i].bpm, ex + 2, y + 4);
  }

  return cv;
}

//==============================================================================
// Canvas rendering - Second Stage
//   Cut first canvas into columns

function secondStage(firstCanvas, options) {
  // 1. Calculate height of each column
  //      with pre-defined measure lengths and column informations
  let firstCanvasWidth = firstCanvas.width - (SZ_PADDING * 2);
  let firstCanvasHeight = firstCanvas.height - (SZ_PADDING * 2);

  let columns = [];
  let measureNumber = 1, beatCount = 0;
  let totalBeatCount = beatCount;

  if(options.upbeat !== 0) {
    measureNumber = 2;
    beatCount = options.upbeat;
  }

  while(totalBeatCount * SZ_BEAT < firstCanvasHeight) {
    let measureLength = 4;

    // Pre-defined measure length
    if(options.measure[measureNumber]) {
      measureLength = options.measure[measureNumber];
    }

    let bpc = options.beatsPerColumn;

    if(options.column[columns.length + 1])
      bpc = options.column[columns.length + 1];

    if(bpc < beatCount + measureLength) {
      columns.push(beatCount);
      beatCount = 0;
    }

    totalBeatCount += measureLength;
    beatCount += measureLength;
    measureNumber += 1;
  }

  if(beatCount !== 0) columns.push(beatCount);

  // 2. Make canvas
  let canvasWidth = (SZ_PADDING * 2) + (SZ_COLUMN * columns.length);
  let canvasHeight = (SZ_PADDING * 2) + (options.beatsPerColumn * SZ_BEAT) + SZ_INFO;

  let cv = document.createElement("canvas");
  cv.width = canvasWidth;
  cv.height = canvasHeight;

  let ctx = cv.getContext("2d");
  ctx.imageSmoothingEnabled = true;

  drawRect(ctx, 0, 0, canvasWidth, canvasHeight, "#ffffff");

  // 3. Draw everything
  measureNumber = 1, beatCount = 0, totalBeatCount = 0;;
  let measureLength = 4;

  for(let col = 0 ; col < columns.length ; col++) {
    let columnLeft = SZ_PADDING + (col * SZ_COLUMN) + SZ_COLUMN_MARGIN;
    let columnRight = columnLeft + SZ_NOTEAREA;
    let columnBottom = canvasHeight - SZ_PADDING;
    let columnTop = columnBottom - (columns[col] * SZ_BEAT);

    if(col !== 0) {
      columnBottom -= options.upbeat * SZ_BEAT;
      columnTop -= options.upbeat * SZ_BEAT;
    }

    // 3-1) Assist lines + measure numbers
    drawLine(ctx, columnLeft,  columnTop, columnLeft,  columnBottom, 1, ST_ASSIST[1]);
    drawLine(ctx, columnRight, columnTop, columnRight, columnBottom, 1, ST_ASSIST[1]);

    if(measureNumber === 1 && options.upbeat !== 0) measureLength = options.upbeat;

    for(let beat = 0 ; beat < columns[col] * 2 ; beat++) {
      // Note: beat is doubled
      let stroke = ST_ASSIST[3];
      if(beat % 2 === 0) stroke = ST_ASSIST[2];

      let y = columnBottom - (SZ_BEAT * beat / 2);

      if(beatCount === measureLength) {
        stroke = ST_ASSIST[1];

        ctx.font = "bold 14px";
        let textSize = ctx.measureText(measureNumber);
        ctx.fillStyle = "#000000";
        ctx.fillText(measureNumber, columnLeft - textSize.width - 4, y + measureLength * SZ_BEAT);

        measureNumber += 1;
        beatCount = 0;

        if(options.measure[measureNumber]) measureLength = options.measure[measureNumber];
        else measureLength = 4;
      }

      drawLine(ctx, columnLeft, y, columnRight, y, 1, stroke);
      beatCount += 0.5;
    }

    ctx.font = "bold 14px";
    let textSize = ctx.measureText(measureNumber);
    ctx.fillStyle = "#000000";
    ctx.fillText(measureNumber, columnLeft - textSize.width - 4, columnTop + measureLength * SZ_BEAT);

    drawLine(ctx, columnLeft, columnTop,    columnRight, columnTop,    1, ST_ASSIST[1]);
    drawLine(ctx, columnLeft, columnBottom, columnRight, columnBottom, 1, ST_ASSIST[1]);

    // 3-2) From first canvas
    let sx = 0, swidth = firstCanvas.width;
    let sheight = SZ_BEAT * columns[col];
    let sy = firstCanvas.height - SZ_PADDING - (SZ_BEAT * totalBeatCount) - sheight;

    let x = columnLeft - SZ_PADDING;
    let y = columnTop;

    sy -= SZ_PADDING;
    sheight += SZ_PADDING * 2;
    y -= SZ_PADDING;

    ctx.drawImage(firstCanvas, sx, sy, swidth, sheight, x, y, swidth, sheight);

    // 3-3) Gradients at the bottom and top of a column
    let gradientWidth = SZ_NOTEAREA + SZ_COLUMN_MARGIN * 2;
    let gradientHeight = SZ_PADDING;

    let gradientW2T = ctx.createLinearGradient(0, y, 0, y + gradientHeight);
    gradientW2T.addColorStop(0, "#ffffff");
    gradientW2T.addColorStop(0.4, "#ffffff");
    gradientW2T.addColorStop(1, "rgba(255, 255, 255, 0)");

    let gradientT2W = ctx.createLinearGradient(0, columnBottom, 0, columnBottom + gradientHeight);
    gradientT2W.addColorStop(0, "rgba(255, 255, 255, 0)");
    gradientT2W.addColorStop(0.6, "#ffffff");
    gradientT2W.addColorStop(1, "#ffffff");

    ctx.fillStyle = gradientW2T;
    ctx.fillRect(columnLeft - SZ_COLUMN_MARGIN, y, gradientWidth, gradientHeight);
    ctx.fillStyle = gradientT2W;
    ctx.fillRect(columnLeft - SZ_COLUMN_MARGIN, columnBottom, gradientWidth, gradientHeight);

    totalBeatCount += columns[col];
  }

  // 4. Informations
  // let diffName = ["", "DEBUT", "REGULAR", "PRO", "MASTER", "MASTER+"];
  // let infoText = `${config.music.title} [${diffName[config.difficulty]}] ─ Max Combo ${config.maxCombo}`;
  // ctx.font = "24px";
  // ctx.fillStyle = "#000000";
  // ctx.fillText(infoText, SZ_PADDING, 42);

  return cv;
}

//==============================================================================
// Finally

function normalizeOptions(json, userOptions = {}) {
  let defaultOptions = {
    start: 0,
    sofuran: [],
    baseBpm: 120,

    upbeat: 0,
    measure: {},

    beatsPerColumn: 16,
    column: {},

    info: {},
    style: "black", // pink | blue | orange | black
    mirror: false,
  };

  for(let i = 0 ; i < json.length ; i++) {
    if(json[i].type === 100) defaultOptions.info.maxCombo = json[i].status;

    if(json[i].sec !== "" && json[i].sec !== 0) {
      defaultOptions.start = json[i].sec;
      break;
    }
  }

  let options = Object.assign(defaultOptions, userOptions);

  return options;
}

function stageJsonToCanvas(json, userOptions) {
  let options = normalizeOptions(json, userOptions);
  let firstCanvas = firstStage(json, options);
  let finalCanvas = secondStage(firstCanvas, options);

  return finalCanvas;
};

//==============================================================================

module.exports = stageJsonToCanvas;
