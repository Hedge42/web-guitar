

// 
var cMajorIonian = [0, 2, 4, 5, 7, 9, 11]; // 0
var cHarmonicMinorIonian = [0, 2, 4, 5, 8, 9, 11]; // 1
var cHarmonicMajorIonian = [0, 2, 4, 5, 7, 8, 11]; // 2

// set in methods
var scale = []; // set in methods
var guitarSpans = []; // set in methods
var tuning = [4, 11, 7, 2, 9, 4]; // standard tuning
var minFret = 0;
var maxFret = 24;


window.onload = setupUI;

var savedSpans = [];
var isEditing = false;



function setupUI() {
    // https://jqueryui.com
    $("#fret-range").slider({
        range: true,
        min: 0,
        max: 24,
        values: [0, 24],
        slide: sliderUpdate,
    });
    setFretRangeText(0, 24);

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

    $("#cbOctaves").checkboxradio();

    $("#cancelEdit").button();

    $("#saveEdit").button();
    $("#editScale").button();
    $("#saveEdit, #cancelEdit").addClass("disabled");


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

    scale = buildScale(key, mode);
    tuning = getUserTuning();
    writeScale(key, mode, preferFlats);
    guitarSpans = buildGuitar();
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

    var gSpans = [];

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

        gSpans.push(stringSpans);
    }

    return gSpans;
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
                    text = noteValueToName(note_val, isFlats, true, true) + intervalString;
                }
                else if (selectedFretDisplayOption === "note") {
                    text = " " + noteValueToName(note_val, isFlats, true, true) + " ";
                }
                else if (selectedFretDisplayOption === "dot") {
                    text = " <> ";
                }

                fret_span.html(text);
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


// events
function clickHandler(event) {
    event = event || window.event;
    var target = event.target || event.srcElement;
    var $target = $(target);

    if ($target.parent().hasClass("fret")) {
        $target = $target.parent();
    }

    if ($target.hasClass("fret")) {

        if (getUserOctavesChecked()) {
            toggleAll($target);
        }
        else {
            toggleFret($target);
        }

        updateSpans();
    }

    updateDisplay();
}
function contextHandler(event) {
    event = event || window.event;
    var target = event.target || event.srcElement;
    var $target = $(target);

    if ($target.parent().hasClass("fret")) {
        $target = $target.parent();
    }

    if ($target.hasClass("fret")) {

        if (getUserOctavesChecked()) {
            hideAll($target);
        }
        else {
            hideFret($target);
        }

        updateSpans();
    }

    // alert($target[0].outerHTML);
    return false;
}
function toggleAll($element) {

    var note = parseInt($element.attr("data").split(",")[0]);

    // shown and not emphasized
    var shouldEmphasize = !$element.hasClass("emphasized") && !$element.hasClass("hidden");
    // otherwise just make visible

    for (var string = 0; string < tuning.length; string++) {

        for (var fret = 0; fret <= 24; fret++) {
            var span = guitarSpans[string][fret];
            var fretNote = parseInt(span.attr("data").split(",")[0])
            if (fretNote % 12 === note) {

                // making sure not to add duplicate class
                span.removeClass("hidden");
                span.removeClass("emphasized");

                if (shouldEmphasize) {
                    span.addClass("emphasized");
                }
            }
        }
    }

    $element.removeClass("hidden");
    $element.removeClass("emphasized");
    if (shouldEmphasize)
        $element.addClass("emphasized");

    updateDisplay();
}
function hideAll($element) {

    var shouldHide = !$element.hasClass("hidden");

    if (shouldHide) {

        var data_split = $element.attr("data").split(",");
        var note = parseInt(data_split[0]);

        for (var string = 0; string < tuning.length; string++) {

            for (var fret = 0; fret <= 24; fret++) {
                var span = guitarSpans[string][fret];
                var fretNote = parseInt(span.attr("data").split(",")[0])
                if (fretNote % 12 === note) {
                    // making sure not to add duplicate class
                    span.removeClass("hidden");
                    span.removeClass("emphasized");
                    span.addClass("hidden");
                }
            }
        }

        $element.removeClass("emphasized");
        $element.addClass("hidden");
    }

    updateDisplay();
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

// editor functions
function editScale() {
    // scale editor button

    // add cancel and save buttons
    // add scale name text field

    savedSpans = guitarSpans;

    guitarSpans = buildGuitar();

    $("#cancelEdit, #saveEdit, #customScaleName, #customLabel").removeClass("disabled");
    $("#key, #scaleType, #mode, #fret-display").selectmenu("disable");

    $("#editScale").button("disable");
    $("#fret-display").val("note");
    $("#fret-display").selectmenu("refresh");

    // disable scale section
}
function cancelScaleEdit() {
    $("#cancelEdit, #saveEdit, #customScaleName, #customLabel").addClass("disabled");
    $("#editScale").button("enable");
    $("#key, #scaleType, #mode, #fret-display").selectmenu("enable");

    guitarSpans = savedSpans;
}
function saveScale() {
    // validate scale
    $("#cancelEdit, #saveEdit, #customScaleName, #customLabel").addClass("disabled");
    $("#editScale").button("enable");
    $("#key, #scaleType, #mode, #fret-display").selectmenu("enable");
}