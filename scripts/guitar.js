

var cMajor = [0, 2, 4, 5, 7, 9, 11];
var tuning = [4, 11, 7, 2, 9, 4];

window.onload = setupUI;

var _minfret = 0;
var _maxfret = 15;

var guitar_spans = [];

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

    // create checkbox and give unique id
    var cb = $("<input>");
    cb.attr("type", "checkbox");
    cb.prop("checked", true);
    cb.uniqueId()

    // create and append checkbox w/ label using above unique id
    //var cbLabel = $("<label>");
    //cbLabel.attr("for", cb.attr("id"));
    //cbLabel.text("Show");
    //li.append(cbLabel);
    //li.append(cb);
    //cb.checkboxradio();
    //cb.on("click", updateDisplay);

    // create and append selectbox
    var select = $("<select>");
    li.append(select);
    select.selectmenu({ change: updateFull });
    for (var i = 0; i < 12; i++) {
        var option = $("<option>");
        option.text(noteValueToName(i, true, false));
        //option.val(i);
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
    _minfret = ui.values[0];
    _maxfret = ui.values[1];

    setFretRangeText(_minfret, _maxfret);

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
function buildGuitar(scale) {
    // rebuild the guitar when...
    // the tuning or scale is changed

    var guitar_spans = [];

    // for each string in the tuning
    for (var i = 0; i < tuning.length; i++) {

        var string_spans = [];

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

            string_spans.push(span);
        }

        guitar_spans.push(string_spans);
    }

    return guitar_spans;
}
function displayGuitar() {
    // write indicator line

    var g = $("#guitar");

    var html = "";

    var indicator = getIndicatorLine();
    html += indicator;

    // write guitar string lines

    // for each guitar string
    for (var i = 0; i < guitar_spans.length; i++) {

        // from the min fret to the max fret
        for (var j = _minfret; j <= _maxfret; j++) {

            // write the fret
            html += guitar_spans[i][j][0].outerHTML + "|";
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
        for (var i = 0; i < guitar_spans.length; i++) {

            // for each displayed fret
            for (var j = _minfret; j < _maxfret; j++) {
                guitar_spans[i][j] = spans[j - _minfret];
            }
        }

    }
}
function updateDisplay() {
    // use this when a display preference is changed
    // such as fret ranges or sharp/flat preference
    // don't just rewrite the whole thing
    // ex. because the user may want to keep highlighted frets

    setSpanTexts();
    displayGuitar();

    // alert("Display update");
}
function setSpanTexts() {

    var selectedFretDisplayOption = $("#fret-display").find("option:selected").val();
    var isFlats = getUserFlatPreference();
    //var selectedIntervals = getUserIntervals();

    for (var i = 0; i < guitar_spans.length; i++) {
        var string_spans = guitar_spans[i];

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
            var interval_str = (interval_val + 1).toString();

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
                    text = " " + interval_str + "  ";
                }
                else if (selectedFretDisplayOption === "note-interval") {
                    text = noteValueToName(note_val, isFlats, true) + " " + interval_str;
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
function updateFull() {
    var key = getUserKey();
    var mode = getUserMode();
    var preferFlats = getUserFlatPreference();
    var scale = buildScale(key, mode);

    getUserTuning();

    writeScale(key, mode, preferFlats);

    guitar_spans = buildGuitar(scale);
    setSpanTexts();
    displayGuitar();

    // alert("Full update");
}
function getIndicatorLine() {
    var isDots = $("#dot-display").find("option:selected").val() === "dot";

    var s = "";
    for (var i = _minfret; i <= _maxfret; i++) {
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
function getUserIntervals() {
    var values = [];
    var cbs = $("#intervals input");
    for (var i = 0; i < cbs.length; i++) {
        values.push(cbs[i].checked);
    }
    return values;
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
    var $existing = guitar_spans[string][fret];

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
    var $existing = guitar_spans[string][fret];

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
    var notes = [];

    for (var i = 0; i < 7; i++) {
        var interval = (mode + i) % 7;
        var note = mod(cMajor[interval] - cMajor[mode] + key, 12);
        notes.push(note);
    }

    return notes;
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
function noteInterval(value, scale) {
    for (var i = 0; i < scale.length; i++) {
        if (value === scale[i]) {
            return i;
        }
    }
    return -1;
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

