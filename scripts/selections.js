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
    var tuning = [];
    var strings = $("#strings");
    for (var i = 0; i < strings.children().length; i++) {
        var li = strings.children().eq(i);
        var selectedOption = li.find("option:selected");
        var note = parseInt(selectedOption.attr("data"));
        tuning.push(note);
    }

    return tuning;
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
function getUserOctavesChecked() {
    return $("#cbOctaves").prop("checked");
}