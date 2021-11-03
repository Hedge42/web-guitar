// just scale related functions

function buildScale(key, mode) {
    var scale = [];

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

    return scale;
}
function writeScale(key, mode, preferFlats) {

    var text = "";
    // text += noteValueToName(key, preferFlats, false) + " ";
    // text += modeValueToName(mode) + ": ";

    scale = buildScale(key, mode);
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

        var nextIndex = (i + 1) % scale.length;

        currentNote = scale[i];
        nextNote = scale[nextIndex];

        // where the scale's next note is higher, and the current is lower
        // or the scale's next note is smaller, and the current is larger

        var standard = currentNote < note && nextNote > note;
        //var btoc = currentNote > note && nextNote > note;
        var btoc = false;
        //var other = currentNote < note && nextNote < note;
        var other = false;

        if (standard || btoc || other) {

            if (isFlats) {

                // double flat?
                if (note === nextNote - 2) {
                    return dblFlatSpan() + (nextIndex + 1).toString();
                }
                else {
                    return flat(true) + (nextIndex + 1).toString();
                }
            }
            else {

                // double sharp?
                if (note === currentNote + 2) {
                    return dblSharpSpan() + (i + 1).toString();
                }
                else {
                    return sharp(true) + (i + 1).toString();
                }
            }
        }
    }

    return "?";
}
function sharp(span = false) {
    // https://www.w3schools.com/jsref/jsref_fromcharcode.asp
    // https://www.alt-codes.net/music_note_alt_codes.php
    //return "#";
    if (span) {
        return "<span class=\"char\">&#9839;</span>"
    }
    else {
        return String.fromCharCode(9839);
    }
}
function flat(span = false) {
    // https://www.w3schools.com/jsref/jsref_fromcharcode.asp
    // // https://www.alt-codes.net/music_note_alt_codes.php
    //return "b";
    if (span) {
        return "<span class=\"char\">&#9837;</span>"
    }
    else {
        return String.fromCharCode(9837);
    }
}

function dblSharpSpan() {
    // https://www.w3schools.com/jsref/jsref_fromcharcode.asp
    // https://www.fileformat.info/info/unicode/char/1d12a/index.htm
    return "<span class=\"char\">\u{1D12A}</span>"
    //return "#";
}
function dblFlatSpan() {
    // https://graphemica.com/%F0%9D%84%AB
    //return "b";
    return "<span class=\"char\">\u{1D12B}</span>"
    // return "\u{1D12B}";
}

function noteValueToName(value, preferFlats, pad, span) {
    if (value === 0)
        return (pad ? "C " : "C");
    else if (value === 1)
        return preferFlats ? "D" + flat(span) : "C" + sharp(span);
    else if (value === 2)
        return pad ? "D " : "D";
    else if (value === 3)
        return preferFlats ? "E" + flat(span) : "D" + sharp(span);
    else if (value === 4)
        return pad ? "E " : "E";
    else if (value === 5)
        return pad ? "F " : "F";
    else if (value === 6)
        return preferFlats ? "G" + flat(span) : "F" + sharp(span);
    else if (value === 7)
        return pad ? "G " : "G";
    else if (value === 8)
        return preferFlats ? "A" + flat(span) : "G" + sharp(span);
    else if (value === 9)
        return pad ? "A " : "A";
    else if (value === 10)
        return preferFlats ? "B" + flat(span) : "A" + sharp(span);
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

function modeToString(mode) {
    var str = (mode + 1).toString();
    var lastChar = str[str.length - 1];

    if (lastChar === "1") {
        str += "st";
    }
    else if (lastChar === "2") {
        str += "nd";
    }
    else if (lastChar === "3") {
        str += "rd";
    }
    else {
        str += "th";
    }
}