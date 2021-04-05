

// 
var cMajorIonian = [0, 2, 4, 5, 7, 9, 11]; // 0
var cHarmonicMinorIonian = [0, 2, 4, 5, 8, 9, 11]; // 1
var cHarmonicMajorIonian = [0, 2, 4, 5, 7, 8, 11]; // 2

// set in methods
var scale = []; // set in methods
var guitarSpans = []; // set in methods
var tuning = [4, 11, 7, 2, 9, 4]; // standard tuning
var minFret = 0;
var maxFret = 15;


window.onload = setupUI;



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

    var default_font_size = 20;
    $("#guitar-font-slider").slider({
        min: 8,
        max: 24,
        value: default_font_size,
        slide: guitarTextSliderUpdate
    });
    $("#guitar").css("font-size", default_font_size);
    setGuitarFontSizeLabelText(default_font_size);

    // $("#intervals input").checkboxradio();
    $("#mode").selectmenu({ change: updateFull });
    $("#key").selectmenu({ change: updateFull });
    $("#scaleType").selectmenu({ change: updateFull });

    // display preferences
    $("#sign").selectmenu({ change: updateDisplay });
    $("#dot-display").selectmenu({ change: updateDisplay });
    $("#fret-display").selectmenu({ change: updateDisplay });

    // tuning section
    $("#addTopString").button();
    $("#addTopString").on("click", addTopString);
    $("#addBottomString").button();
    $("#addBottomString").on("click", addBottomString);

    $("#amount").val($("#fret-range").slider("values", 0) + " - "
        + $("#fret-range").slider("values", 1));
    $("#guitar").on("click", clickHandler);
    $("#guitar").on("contextmenu", contextHandler);

    $("#btnCopy").button();
    $("#btnCopy").on("click", copyGuitar);


    buildTuningArea();
    updateFull();
}

function updateKeyDropdowns() {
    // changes dropdown sharps to flats and vice versa
    var $key = $("#key, #strings");

    // https://stackoverflow.com/questions/2828019/looking-for-jquery-find-method-that-includes-the-current-node
    var $selects = $key.find("select").addBack("select");
    var isFlats = getUserFlatPreference();
    var $keyops = $selects.find("option");
    for (var i = 0; i < $keyops.length; i++) {
        var o = $keyops.eq(i);
        o.text(noteValueToName(parseInt(o.attr("data")), isFlats, false));
    }

    $selects.selectmenu("refresh");
}

// tuning
function addTopString() {
    var tuningItem = createTuningItem(0);
    prependTuningItem(tuningItem);
    updateFull();
}
function addBottomString() {
    var tuningItem = createTuningItem(0);
    appendTuningItem(tuningItem);
    updateFull();
}
function createTuningItem(defaultvalue) {
    var li = $("<li>");

    // create and append selectbox
    var select = $("<select>");
    li.append(select);
    select.selectmenu({ change: updateFull });
    for (var i = 0; i < 12; i++) {
        var option = $("<option>");
        option.text(noteValueToName(i, true, false));
        option.attr("data", i);
        select.append(option);
    }

    // create and append removal button
    var removeButton = $("<button>-</button>").button();
    removeButton.on("click", function () { li.remove(); updateFull(); });
    li.append(removeButton);


    // select defualt value
    select.val(noteValueToName(defaultvalue, true, false));
    select.selectmenu("refresh");

    return li;
}
function buildTuningArea() {
    for (var i = 0; i < tuning.length; i++) {
        // createTuningSelect(tuning[i]);
        var item = createTuningItem(tuning[i]);
        appendTuningItem(item);
    }
}
function appendTuningItem($li) {
    $("#strings").append($li);
}
function prependTuningItem($li) {
    $("#strings").prepend($li);
}

// sliders
function sliderUpdate(event, ui) {
    minFret = ui.values[0];
    maxFret = ui.values[1];

    setFretRangeText(minFret, maxFret);

    updateDisplay();
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

// guitar display handling
function updateFull() {
    var key = getUserKey();
    var mode = getUserMode();
    var preferFlats = getUserFlatPreference();

    buildScale(key, mode);
    getUserTuning();
    writeScale(key, mode, preferFlats);
    buildGuitar();
    updateDisplay();
}
function updateDisplay() {
    // use this when a display preference is changed
    // such as fret ranges or sharp/flat preference
    // don't just rewrite the whole thing
    // ex. because the user may want to keep highlighted frets

    updateKeyDropdowns();
    setSpanTexts();
    displayGuitar();
}
function buildGuitar() {
    // rebuild the guitar when...
    // the tuning or scale is changed

    guitarSpans = [];

    // for each string in the tuning
    for (var i = 0; i < tuning.length; i++) {

        var stringSpans = [];

        // for each fret on the fretboard
        for (var j = 0; j < 25; j++) {

            var fretNote = (tuning[i] + j) % 12;
            var interval = noteInterval(fretNote, scale);

            // create a span for the note
            var span = $("<span>");

            // data: {note value},{scale interval},{string number},{fret value}
            span.attr("data", fretNote + "," + interval + "," + i + "," + j);
            span.addClass("fret");

            // set the class to non-diatonic if the note is not in the scale
            if (!IsContained(fretNote, scale)) {
                span.addClass("hidden");
                span.addClass("non-diatonic")
            }
            else {
                span.addClass("diatonic");
            }

            //stringSpans.push(span);
            stringSpans.push(span);
        }

        guitarSpans.push(stringSpans);
    }
}
function displayGuitar() {
    // write indicator line

    var g = $("#guitar");

    var html = "";

    var indicator = getIndicatorLine();
    html += indicator;

    // write guitar string lines

    // for each guitar string
    for (var i = 0; i < guitarSpans.length; i++) {

        // from the min fret to the max fret
        for (var j = minFret; j <= maxFret; j++) {

            // write the fret
            html += guitarSpans[i][j][0].outerHTML + "|";
        }

        // write new line
        html += "</br>";
    }

    // write indicator line
    html += indicator;

    // write to guitar
    g.html(html);
}
function updateSpans() {
    var gtr = $("#guitar");
    var brs = gtr.find("br");

    // -2 because 2 brs are from the indicator lines
    for (var i = 0; i < brs - 2; i++) {

        // find all spans until the next br
        var spans = brs.eq(i).nextUntil("br").find("span");

        // for each guitar string
        for (var i = 0; i < guitarSpans.length; i++) {

            // for each displayed fret
            for (var j = minFret; j < maxFret; j++) {
                guitarSpans[i][j] = spans[j - minFret];
            }
        }

    }
}
function setSpanTexts() {

    var selectedFretDisplayOption = $("#fret-display").find("option:selected").val();
    var isFlats = getUserFlatPreference();
    //var selectedIntervals = getUserIntervals();

    for (var i = 0; i < guitarSpans.length; i++) {
        var string_spans = guitarSpans[i];

        // for each fret on the string
        //alert("string " + i + " span length: " + string_spans.length);
        for (var j = 0; j < string_spans.length; j++) {
            var fret_span = string_spans[j];

            // data: {note value},{scale interval},{string number},{fret value}
            var data = fret_span.attr("data");
            var data_split = data.split(",");
            var note_data = data_split[0];
            var note_val = parseInt(note_data);
            var interval_data = data_split[1];
            var interval_val = parseInt(interval_data);
            // var intervalString = (interval_val + 1).toString();
            var intervalString = noteIntervalString(note_val)

            //if (!selectedIntervals[interval_val] && !fret_span.hasClass("interval-hidden")) {
            //    fret_span.addClass("interval-hidden");
            //}
            //else if (selectedIntervals[interval_val] && fret_span.hasClass("interval-hidden")) {
            //    fret_span.removeClass("interval-hidden");
            //}

            // set hidden text
            if (fret_span.hasClass("hidden")) {
                fret_span.text("----");
            }

            // set note value text
            else {


                var text = "??"

                if (selectedFretDisplayOption === "interval") {
                    text = " " + intervalString + " ";
                }
                else if (selectedFretDisplayOption === "note-interval") {
                    text = noteValueToName(note_val, isFlats, true) + intervalString;
                }
                else if (selectedFretDisplayOption === "note") {
                    text = " " + noteValueToName(note_val, isFlats, true) + " ";
                }
                else if (selectedFretDisplayOption === "dot") {
                    text = " <> ";
                }

                fret_span.text(text);
            }
        }
    }
}
function getIndicatorLine() {
    var isDots = $("#dot-display").find("option:selected").val() === "dot";

    var s = "";
    for (var i = minFret; i <= maxFret; i++) {
        // TODO lol
        if (i === 0 || i === 3 || i === 5 || i === 7 || i === 9 || i === 12 || i === 15 || i === 17 || i === 19 || i === 21 || i === 24) {
            if (isDots)
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

// getting user selections
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
function getUserTuning() {
    tuning = [];
    var strings = $("#strings");
    for (var i = 0; i < strings.children().length; i++) {
        var li = strings.children().eq(i);
        var selectedOption = li.find("option:selected");
        var note = parseInt(selectedOption.attr("data"));
        tuning.push(note);
    }
}
function getSelectOption($select) {
    return $select.find("option:selected");
}
function getUserIntervals() {
    var values = [];
    var cbs = $("#intervals input");
    for (var i = 0; i < cbs.length; i++) {
        values.push(cbs[i].checked);
    }
    return values;
}
function getUserScaleType() {
    return getSelectOption($("#scaleType")).val();
}

// events
function clickHandler(event) {
    event = event || window.event;
    var target = event.target || event.srcElement;
    var $target = $(target);

    if ($target.hasClass("fret")) {
        toggleFret($target);
        updateSpans();
    }

    updateDisplay();
}
function contextHandler(event) {
    event = event || window.event;
    var target = event.target || event.srcElement;
    var $target = $(target);

    if ($target.hasClass("fret")) {

        hideFret($target);
        updateSpans();
    }

    // alert($target[0].outerHTML);
    return false;
}
function toggleFret($element) {
    // find the span in the global where the data matches this one
    // and update them at the same time
    var data_split = $element.attr("data").split(",");
    var string = parseInt(data_split[2]);
    var fret = parseInt(data_split[3]);
    var $existing = guitarSpans[string][fret];

    // treat 2 jQuery objects as one
    // https://api.jquery.com/jquery.extend/
    var thing = $.extend($existing, $element);

    // no class → emphasized → hidden
    if ($element.hasClass("hidden")) {
        thing.removeClass("hidden");
    }
    else if ($element.hasClass("emphasized")) {
        thing.removeClass("emphasized");
    }
    else {
        thing.addClass("emphasized");
    }

    updateDisplay();

    // alert(thing[0].outerHTML);
}
function hideFret($element) {
    // find the span in the global where the data matches this one
    // and update them at the same time
    var data_split = $element.attr("data").split(",");
    var string = parseInt(data_split[2]);
    var fret = parseInt(data_split[3]);
    var $existing = guitarSpans[string][fret];

    // treat 2 jQuery objects as one
    // https://api.jquery.com/jquery.extend/
    var thing = $.extend($existing, $element);

    // no class → emphasized → hidden
    if (!$element.hasClass("hidden")) {
        thing.addClass("hidden");
    }
    if ($element.hasClass("emphasized")) {
        thing.removeClass("emphasized");
    }

    updateDisplay();
}
function copyGuitar() {
    // copy guitar text to clipboard, since it's unselectable
    // https://stackoverflow.com/questions/36639681/how-to-copy-text-from-a-div-to-clipboard

    var range = document.createRange();
    var gtr = $("#guitar");
    gtr.removeClass("unselectable");
    range.selectNodeContents(gtr[0]);
    window.getSelection().removeAllRanges(); // clear current selection
    window.getSelection().addRange(range); // to select text
    document.execCommand("copy");
    window.getSelection().removeAllRanges(); // to deselect
    gtr.addClass("unselectable");

    alert("Copied!");
}

// helpers
function IsContained(a, b) {
    // is a in b?
    for (var i = 0; i < b.length; i++) {
        if (a == b[i])
            return true
    }
    return false;
}
function mod(n, m) {
    // properly functioning modulus on negative numbers
    // https://stackoverflow.com/questions/4467539/javascript-modulo-gives-a-negative-result-for-negative-numbers
    return ((n % m) + m) % m;
}

// scale stuff
function buildScale(key, mode) {
    scale = [];

    var baseScale = null;
    var scaleType = getUserScaleType();

    if (scaleType === "1") {
        baseScale = cHarmonicMinorIonian;
    }
    else if (scaleType === "2") {
        baseScale = cHarmonicMajorIonian;
    }
    else {
        baseScale = cMajorIonian;
    }

    for (var i = 0; i < 7; i++) {
        var interval = (mode + i) % 7;
        var note = mod(baseScale[interval] - baseScale[mode] + key, 12);
        scale.push(note);
    }
}
function writeScale(key, mode, preferFlats) {

    var text = "";
    // text += noteValueToName(key, preferFlats, false) + " ";
    // text += modeValueToName(mode) + ": ";

    buildScale(key, mode);
    for (var i = 0; i < scale.length; i++) {
        text += noteValueToName(scale[i], preferFlats, false) + " ";
    }

    var scaleText = document.getElementById("scale");
    scaleText.innerText = text;
}
function noteInterval(value, scale) {
    for (var i = 0; i < scale.length; i++) {
        if (value === scale[i]) {
            return i;
        }
    }
    return -1;
}
function noteIntervalString(note) {
    // finds interval inside scale
    for (var i = 0; i < scale.length; i++) {
        if (note === scale[i]) {
            return " " + (i + 1).toString();
        }
    }

    var isFlats = getUserFlatPreference();
    for (var i = 0; i < scale.length; i++) {
        // find where value fits between is

        var nextIndex = i + 1;
        if (nextIndex >= scale.length) {
            nextIndex -= scale.length;
        }

        currentNote = scale[i];
        nextNote = scale[nextIndex];

        // where the scale's next note is higher, and the current is lower
        // or the scale's next note is smaller, and the current is larger

        var standard = currentNote < note && nextNote > note;
        var btoc = currentNote > note && nextNote > note;

        if (standard || btoc) {

            if (isFlats) {

                // double flat?
                if (note < nextNote - 1) {
                    return dblFlatChar() + (nextIndex + 1).toString();
                }
                else {
                    return flatChar() + (nextIndex + 1).toString();
                }
            }
            else {

                // double sharp?
                if (note > currentNote + 1) {
                    return dblSharpChar() + (i + 1).toString();
                }
                else {
                    return sharpChar() + (i + 1).toString();
                }
            }
        }
    }

    return "?";
}
function sharpChar() {
    // https://www.w3schools.com/jsref/jsref_fromcharcode.asp
    // https://www.alt-codes.net/music_note_alt_codes.php
    return "#";
    //return String.fromCharCode(9839);
}
function flatChar() {
    // https://www.w3schools.com/jsref/jsref_fromcharcode.asp
    // // https://www.alt-codes.net/music_note_alt_codes.php
    return "b";
    //return String.fromCharCode(9837);
}
function dblSharpChar() {
    // https://www.w3schools.com/jsref/jsref_fromcharcode.asp
    // https://www.fileformat.info/info/unicode/char/1d12a/index.htm
    //return "\u{1D12A}"
    return "#";
}
function dblFlatChar() {
    // https://graphemica.com/%F0%9D%84%AB
    return "b";
    //return "\u{1D12B}";
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

