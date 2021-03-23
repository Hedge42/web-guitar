var cMajor = [0, 2, 4, 5, 7, 9, 11];
var tuning = [4, 11, 7, 2, 9, 4];

window.onload = setupUI;

var _minfret = 0;
var _maxfret = 15

function setupUI() {
    // https://jqueryui.com
    $("#fret-range").slider({
        range: true,
        min: 0,
        max: 24,
        values: [0, 15],
        slide: sliderUpdate,
    });
    setFretRangeText(0, 15);

    $("#guitar-font-slider").slider({
        min: 8,
        max: 24,
        value: 14,
        slide: guitarTextSliderUpdate
    });
    setGuitarFontSizeLabelText(14);

    $("#intervals input").checkboxradio();
    $("#sign").selectmenu({ change: update });
    $("#mode").selectmenu({ change: update });
    $("#key").selectmenu({ change: update });
    $("#addTopString").button();
    $("#addTopString").on("click", addTopString);
    $("#addBottomString").button();
    $("#addBottomString").on("click", addBottomString);

    $("#amount").val($("#fret-range").slider("values", 0) + " - "
        + $("#fret-range").slider("values", 1));
    $("#guitar").on("click", clickHandler);

    buildTuningArea();
    update();
}
function addTopString() {
    var tuningItem = createTuningItem(0);
    prependTuningItem(tuningItem);
    update();
}
function addBottomString() {
    var tuningItem = createTuningItem(0);
    appendTuningItem(tuningItem);
    update();
}
function getUserTuning() {
    tuning = [];
    var strings = $("#strings");
    for (var i = 0; i < strings.children().length; i++) {
        var li = strings.children().eq(i);
        var select = li.find("option:selected");
        var note = select.attr("data");
        tuning.push(note);
    }
}

function createTuningItem(defaultvalue) {
    var li = $("<li>");

    // create checkbox and give unique id
    var cb = $("<input>");
    cb.attr("type", "checkbox");
    cb.prop("checked", true);
    cb.uniqueId()

    // create and append checkbox w/ label using above unique id
    var cbLabel = $("<label>");
    cbLabel.attr("for", cb.attr("id"));
    cbLabel.text("Show");
    li.append(cbLabel);
    li.append(cb);
    cb.checkboxradio();

    // create and append selectbox
    var select = $("<select>");
    li.append(select);
    select.selectmenu({ change: update });
    for (var i = 0; i < 12; i++) {
        var option = $("<option>");
        option.text(noteValueToName(i, true, false));
        //option.val(i);
        option.attr("data", i);
        select.append(option);
    }

    // create and append removal button
    var removeButton = $("<button>-</button>").button();
    removeButton.on("click", function () { li.remove(); update(); });
    li.append(removeButton);


    // select defualt value
    select.val(noteValueToName(defaultvalue, true, false));
    select.selectmenu("refresh");

    return li;
}

function appendTuningItem($li) {
    $("#strings").append($li);
}
function prependTuningItem($li) {
    $("#strings").prepend($li);
}

function buildTuningArea() {
    for (var i = 0; i < tuning.length; i++) {
        // createTuningSelect(tuning[i]);
        var item = createTuningItem(tuning[i]);
        appendTuningItem(item);
    }
}

function sliderUpdate(event, ui) {
    _minfret = ui.values[0];
    _maxfret = ui.values[1];

    setFretRangeText(_minfret, _maxfret);

    update();
}
function guitarTextSliderUpdate(event, ui) {
    $("#guitar").css("font-size", ui.value);
    setGuitarFontSizeLabelText(ui.value);
}
function setGuitarFontSizeLabelText(value) {
    $("#guitar-font-text").text("Font size: " + value);
}
function setFretRangeText(min, max) {
    $("#amount").text("Fret range: " + min + " - " + max);
}

function mod(n, m) {
    // properly functioning modulus on negative numbers
    // https://stackoverflow.com/questions/4467539/javascript-modulo-gives-a-negative-result-for-negative-numbers
    return ((n % m) + m) % m;
}

function buildScale(key, mode) {
    var notes = [];

    for (var i = 0; i < 7; i++) {
        var interval = (mode + i) % 7;
        var note = mod(cMajor[interval] - cMajor[mode] + key, 12);
        notes.push(note);
    }

    return notes;
}

function update() {
    var key = getUserKey();
    var mode = getUserMode();
    var preferFlats = getUserFlatPreference();
    var scale = buildScale(key, mode);

    getUserTuning();

    writeScale(key, mode, preferFlats);
    writeGuitar(scale, tuning, preferFlats);
}

function getUserKey() {
    var key = document.getElementById("key").value;
    return parseInt(key);
}
function getUserMode() {
    var mode = document.getElementById("mode").value;
    return parseInt(mode);
}
function getUserFlatPreference() {
    return document.getElementById("sign").value === "flats";
}

function writeScale(key, mode, preferFlats) {

    var text = "";
    // text += noteValueToName(key, preferFlats, false) + " ";
    // text += modeValueToName(mode) + ": ";

    var scale = buildScale(key, mode);
    for (var i = 0; i < scale.length; i++) {
        text += noteValueToName(scale[i], preferFlats, false) + " ";
    }

    var scaleText = document.getElementById("scale");
    scaleText.innerText = text;
}
function writeGuitar(scale, tuning, flats) {
    //var guitar = document.getElementById("guitar");
    var guitar = $("#guitar");

    var userIntervals = getUserIntervals();
    var indicator = getIndicatorLine(_minfret, _maxfret, true);
    var openNotes = tuning;
    var filteredScale = getFilteredScale(userIntervals, scale);

    var s = "";
    s += indicator;

    for (var i = 0; i < openNotes.length; i++) {
        s += writeGuitarString(_minfret, _maxfret, flats, filteredScale, openNotes[i])
        // s += "------------" + "\n";
    }
    s += indicator;

    guitar.html(s);
}
function getUserIntervals() {
    var values = [];
    var cbs = $("#intervals input");
    for (var i = 0; i < cbs.length; i++) {
        values.push(cbs[i].checked);
    }
    return values;
}
function getFilteredScale(intervals, scale) {
    // this function is probably unnecessary
    var filtered = [];
    for (var i = 0; i < scale.length; i++) {
        if (intervals[i]) {
            filtered.push(scale[i]);
        }
        else {
            filtered.push(-1);
        }
    }
    return filtered;
}
function writeGuitarString(startFret, endFret, isFlats, filteredScale, openString) {
    // foreach string, print the string
    var _string = "";
    for (var i = startFret; i <= endFret; i++) {
        var fret = "";

        var intAtFret = (openString + i) % 12;
        var noteAtFret = noteValueToName(intAtFret, isFlats, true);


        // print note stuff in this fret
        if (IsContained(intAtFret, filteredScale)) {

            // get note interval in scale
            var interval = -1;
            for (var j = 0; j < filteredScale.length; j++) {
                if (intAtFret === filteredScale[j]) {
                    interval = j + 1;
                    break;
                }
            }
            fret = "<span class=\"fret\">" + noteAtFret + " " + interval + "</span>";
        }
        else {
            fret = "----";
        }

        _string += fret + "|";
    }
    return _string + "<br>";
}
function clickHandler(event) {
    event = event || window.event;
    var target = event.target || event.srcElement;
    var $target = $(target);
    if ($target.hasClass("fret")) {
        toggleFret($target);
    }
}
function toggleFret($element) {
    if ($element.hasClass("emphasized")) {
        $element.removeClass("emphasized");
    }
    else {
        $element.addClass("emphasized");
    }
}

// is a in b?
function IsContained(a, b) {
    for (var i = 0; i < b.length; i++) {
        if (a == b[i])
            return true
    }
    return false;
}
function getIndicatorLine(min, max, dots) {
    var s = "";
    for (var i = min; i <= max; i++) {
        // TODO lol
        if (i === 0 || i === 3 || i === 5 || i === 7 || i === 9 || i === 12 || i === 15 || i === 17 || i === 19 || i === 21 || i === 24) {
            if (dots)
                s += "[<>] ";
            else {
                if (i < 10)
                    s += "[ " + i + "] ";
                else
                    s += "[" + i + "] ";
            }
        }
        else
            s += "     ";
    }
    return s + "<br>";
}

function noteValueToName(value, preferFlats, pad) {
    if (value === 0)
        return (pad ? "C " : "C");
    else if (value === 1)
        return preferFlats ? "Db" : "C#";
    else if (value === 2)
        return pad ? "D " : "D";
    else if (value === 3)
        return preferFlats ? "Eb" : "D#";
    else if (value === 4)
        return pad ? "E " : "E";
    else if (value === 5)
        return pad ? "F " : "F";
    else if (value === 6)
        return preferFlats ? "Gb" : "F#";
    else if (value === 7)
        return pad ? "G " : "G";
    else if (value === 8)
        return preferFlats ? "Ab" : "G#";
    else if (value === 9)
        return pad ? "A " : "A";
    else if (value === 10)
        return preferFlats ? "Bb" : "A#";
    else if (value === 11)
        return pad ? "B " : "B";
    else
        return "?";
}
function modeValueToName(mode) {
    if (mode === 0)
        return "Ionian";
    else if (mode === 1)
        return "Dorian";
    else if (mode === 2)
        return "Phrygian";
    else if (mode === 3)
        return "Lydian";
    else if (mode === 4)
        return "MixoLydian";
    else if (mode === 5)
        return "Aeolian";
    else if (mode === 6)
        return "Locrian";
    else
        return "?";
}
