
/* sample loading */

var loadSampleWithUrl = function(context, url, callback) {
  var request = new XMLHttpRequest();
  request.open("GET", url, true);
  request.responseType = "arraybuffer";
  request.onload = function() {
    context.decodeAudioData(request.response, callback);
  };
  request.send();
};

var getBuffersFromSampleNames = function(names, context, callback) {
  var buffers = {};
  var queue = 0;

  names.map(function(name) {
    var url = ["sounds/", name, ".wav"].join("");
    queue++;
    loadSampleWithUrl(context, url, function(buffer) {
      buffers[name] = buffer;
      if (--queue === 0) callback(buffers);
    });
  });
};

/* sample playing */

var playSampleWithBuffer = function(context, buffer, start, volume) {
  var gainNode = context.createGainNode();
  var source = context.createBufferSource();

  source.buffer = buffer;
  source.connect(gainNode);
  gainNode.connect(context.destination);
  gainNode.gain.value = volume;
  source.noteOn(start);
};

/* table writing */

var writeValueIntoCell = function(value, tr) {
  var td = cabin("div.td");
  var holder = cabin("div.td-holder");
  td.title = value;
  holder.appendChild(td);
  tr.appendChild(holder);
  return td;
};

var writeValuesIntoRow = function(values, table) {
  var tr = cabin("div.tr");
  table.appendChild(tr);
  return values.map(function(value) {
    return writeValueIntoCell(value, tr);
  });
};

var writeValuesIntoTable = function(patterns, div) {
  return patterns.map(function(values) {
    return writeValuesIntoRow(values, div);
  });
};

var writeIndicatorsIntoTable = function(length, div) {
  var tr = cabin("div.tr.indicators");
  var tds = [];
  for(var i = 0; i < length; i++) {
    tds.push(writeValueIntoCell(0, tr));
  }
  div.appendChild(tr);
  return tds;
};

/* listening for value changes */

var listenForValuesFromRows = function(rows, values, limit) {
  rows.forEach(function(tr, i) {
    tr.forEach(function(td, j) {
      td.addEventListener("mouseup", function() {
        var v = parseInt(td.title);
        td.title = values[i][j] = v = (v === limit) ? 0 : (v + 1);
      }, true);
    });
  });
};

var renderPatternIntoRows = function(pattern, rows) {};

var getMetronome = function(context, bpm, readCount, clickback) {
  var clickRate = (60 / bpm) / readCount;
  var lastTime;

  return function() {
    var current = context.currentTime;

    if (!lastTime) {
      lastTime = current + clickRate;
      clickback(0);
    } else {
      if (current > lastTime + clickRate) {
        lastTime += clickRate;
        clickback(current - lastTime);
      }
    }
  };
};









/* run the program */

var originals = values.map(function(v) { return v.concat([]); }); // copy
var length = values[0].length - 1;

var volumes = {
  4: 1,
  3: 0.5,
  2: 0.25,
  1: 0.15
};

var diagram = document.getElementById("diagram");
var indicators = writeIndicatorsIntoTable(length+1, diagram);
var rows = writeValuesIntoTable(values, diagram);
listenForValuesFromRows(rows, values, 4);

var context = new webkitAudioContext();
var names = ["hihat", "snare", "kick"];
var bpm = 100;

getBuffersFromSampleNames(names, context, function(buffers) {

  var i = 0;
  var metronome = getMetronome(context, bpm, 4, function(lag) {
    var last = ((i - 1) >= 0) ? (i-1) : length;
    
    var totalVolume = values.reduce(function(acc, row, j) {
      var volume = row[i];
      rows[j][last].className = "td";
      rows[j][i].className = "td current";
      (volume !== 0) && playSampleWithBuffer(context, buffers[names[j]], 0, volumes[volume]);
      return acc + volume;
    }, 0);
    
    indicators[i].title = Math.min(totalVolume, 4);
    indicators[last].title = 0;
    
    i = (i === length) ? 0 : (i + 1);
  });

  setTimeout(function() {
    playSampleWithBuffer(context, buffers.kick, 0, 0);
    setInterval(metronome, 0);
  }, 2000);
});



