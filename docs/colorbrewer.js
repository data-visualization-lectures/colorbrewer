var schemeNames = {
	sequential: ["BuGn", "BuPu", "GnBu", "OrRd", "PuBu", "PuBuGn", "PuRd", "RdPu", "YlGn", "YlGnBu", "YlOrBr", "YlOrRd"],
	singlehue: ["Blues", "Greens", "Greys", "Oranges", "Purples", "Reds"],
	diverging: ["BrBG", "PiYG", "PRGn", "PuOr", "RdBu", "RdGy", "RdYlBu", "RdYlGn", "Spectral"],
	qualitative: ["Accent", "Dark2", "Paired", "Pastel1", "Pastel2", "Set1", "Set2", "Set3"]
};

var visibleMap,
	selectedScheme = "BuGn",
	numClasses = 3;

$("#num-classes").change(function () {
	setNumClasses($(this).val());
});
$(".scheme-type").change(function () {
	setSchemeType($(this).attr("id"));
});
$("#color-system").change(updateValues);
$("#layers input").change(layerChange);
$("#filters input").change(showSchemes);

$("#transparency-slider").mousedown(function () {
	var max = $("#transparency-track").width();
	var handle = $(this);
	function handleMove(e) {
		var l = Math.max(3, 3 + Math.min(e.pageX - $("#transparency-track").offset().left, max));
		handle.css("left", l);
		$("#county-map g").css("opacity", 1 - (l - 4) / max);
	};
	function handleUp() {
		$(document).off("mousemove", handleMove);
		$(document).off("mouseup", handleUp);
	};
	$(document).on("mousemove", handleMove);
	$(document).on("mouseup", handleUp);
});

$("#road-color").spectrum({
	color: "#f33",
	showInput: true,
	change: function (color) {
		if (!$("#overlays").children().length) return;
		$("#road-lines").css("stroke", color.toHexString());
	}
});
$("#city-color").spectrum({
	color: "#000",
	showInput: true,
	change: function (color) {
		if (!$("#overlays").children().length) return;
		$("#cities").css("fill", color.toHexString());
	}
});
$("#border-color").spectrum({
	color: "#000",
	showInput: true,
	change: function (color) {
		$("#county-map g").css("stroke", color.toHexString());
	}
});
$("#bg-color").spectrum({
	color: "#fff",
	showInput: true,
	change: function (color) {
		$("#county-map rect").css("fill", color.toHexString());
	}
});

$("#terrain, #solid-color").change(function () {
	if ($("#terrain").is(":checked")) {
		if (!$("#terrain-img").length) $("#map-container").prepend($("<img id='terrain-img' src='map/terrain.jpg' />").css("left", -31).css("top", -58));
		$("#county-map rect").css("opacity", 0);
		if ($("#transparency-slider").position().left < 4) {
			$("#transparency-slider").css("left", $("#transparency-track").position().left + 43);
			$("#county-map g").css("opacity", .5);
		}
	} else {
		$("#county-map rect").css("opacity", 1);
		if ($("#transparency-slider").position().left == $("#transparency-track").position().left + 43) {
			$("#transparency-slider").css("left", 3);
			$("#county-map g").css("opacity", 1);
		}
	}
});


function setNumClasses(n) {
	numClasses = n;
	showSchemes();
}

var selectedSchemeType;
function setSchemeType(type) {
	selectedSchemeType = type;

	$("#num-classes option").removeAttr("disabled");
	switch (selectedSchemeType) {
		case "sequential":
			if ($("#num-classes").val() >= 10) {
				$("#num-classes").val(9);
				numClasses = 9;
			}
			$("#num-classes option[name=10], #num-classes option[name=11], #num-classes option[name=12]").attr("disabled", "disabled");
			break;
		case "diverging":
			if ($("#num-classes").val() >= 12) {
				$("#num-classes").val(11);
				numClasses = 11;
			}
			$("#num-classes option[name=12]").attr("disabled", "disabled");
			break;
	}
	showSchemes();
}

function showSchemes() {
	$("#ramps").empty();
	for (var i in schemeNames[selectedSchemeType]) {
		if (checkFilters(schemeNames[selectedSchemeType][i]) == false) continue;
		var ramp = $("<div class='ramp " + schemeNames[selectedSchemeType][i] + "'></div>"),
			svg = "<svg width='15' height='75'>";
		for (var n = 0; n < 5; n++) {
			svg += "<rect fill=" + colorbrewer[schemeNames[selectedSchemeType][i]][5][n] + " width='15' height='15' y='" + n * 15 + "'/>";
		}
		svg += "</svg>";
		$("#ramps").append(ramp.append(svg).click(function () {
			if ($(this).hasClass("selected")) return;
			setScheme($(this).attr("class").substr(5));
		}));
	}
	if (selectedSchemeType == "sequential") {
		$("#scheme1").css("width", "160px");
		$("#multi").show().text("Multi-hue:");
		$("#scheme2").css("width", "90px");
		$("#single").show().text("Single hue:");

		$("#singlehue").empty().css("display", "inline-block");
		for (i in schemeNames.singlehue) {
			if (checkFilters(schemeNames.singlehue[i]) == false) continue;
			var ramp = $("<div class='ramp " + schemeNames.singlehue[i] + "'></div>"),
				svg = "<svg width='15' height='75'>";
			for (var n = 0; n < 5; n++) {
				svg += "<rect fill=" + colorbrewer[schemeNames.singlehue[i]][5][n] + " width='15' height='15' y='" + n * 15 + "'/>";
			}
			svg += "</svg>";
			$("#singlehue").append(ramp.append(svg).click(function () {
				if ($(this).hasClass("selected")) return;
				setScheme($(this).attr("class").substr(5));
			}));
		}
	} else {
		$("#scheme1").css("width", "100%");
		$("#multi").hide();
		$("#singlehue").empty();
		$("#single").hide();
	}

	$(".score-icon").show();
	$("#color-system").show();
	if ($(".ramp." + selectedScheme)[0]) {
		setScheme(selectedScheme);
	} else if ($("#ramps").children().length) setScheme($("#ramps .ramp:first-child").attr("class").substr(5));
	else clearSchemes();
}

function clearSchemes() {
	$("#counties g path").css("fill", "#ccc");
	$("#color-chips").empty();
	$("#color-values").empty();
	$("#ramps").css("width", "100%");
	$("#scheme-name").html("");
	$(".score-icon").hide();
	$("#color-system").hide();
	$("#ramps").append("<p>No color schemes match these criteria.</p><p>Please choose fewer data classes, a different data type, and/or fewer filtering options.</p>");
}

function setScheme(s) {
	$("#county-map g").removeClass(selectedScheme).addClass(s);
	$(".ramp.selected").removeClass("selected");
	selectedScheme = s;
	$(".ramp." + selectedScheme).addClass("selected");
	$("#scheme-name").html(numClasses + "-class " + selectedScheme);
	applyColors();
	drawColorChips();
	window.location.hash = "type=" + selectedSchemeType + "&scheme=" + selectedScheme + "&n=" + numClasses;

	updateValues();

	var cssString = "";
	for (var i = 0; i < numClasses; i++) {
		cssString += "." + selectedScheme + " .q" + i + "-" + numClasses + "{fill:" + colorbrewer[selectedScheme][numClasses][i] + "}";
		if (i < numClasses - 1) cssString += " ";
	}
	$("#css-output").val(cssString);

	$(".score-icon").attr("class", "score-icon");
	var f = checkColorblind(s);
	$("#blind-icon").addClass(!f ? "bad" : (f == 1 ? "ok" : "maybe")).attr("title", numClasses + "-class " + selectedScheme + " is " + getWord(f) + "color blind friendly");
	f = checkCopy(s);
	$("#copy-icon").addClass(!f ? "bad" : (f == 1 ? "ok" : "maybe")).attr("title", numClasses + "-class " + selectedScheme + " is " + getWord(f) + "photocopy friendly");
	f = checkScreen(s);
	$("#screen-icon").addClass(!f ? "bad" : (f == 1 ? "ok" : "maybe")).attr("title", numClasses + "-class " + selectedScheme + " is " + getWord(f) + "LCD friendly");
	f = checkPrint(s);
	$("#print-icon").addClass(!f ? "bad" : (f == 1 ? "ok" : "maybe")).attr("title", numClasses + "-class " + selectedScheme + " is " + getWord(f) + "print friendly");

	function getWord(w) {
		if (!w) return "not ";
		if (w == 1) return "";
		if (w == 2) return "possibly not ";
	}
}

/* function getJSON()
{
	var jsonString = "[";
	for ( var i = 0; i < numClasses; i ++ ){
		jsonString += "'" + colorbrewer[selectedScheme][numClasses][i] + "'";
		if ( i < numClasses - 1 ) jsonString += ",";
	}
	jsonString += "]";

	return jsonString;
} */

function checkFilters(scheme, f) {
	if (!colorbrewer[scheme][numClasses]) return false;
	if ($("#blindcheck").is(":checked") && checkColorblind(scheme) != 1) return false;
	if ($("#printcheck").is(":checked") && checkPrint(scheme) != 1) return false;
	if ($("#copycheck").is(":checked") && checkCopy(scheme) != 1) return false;
	return true;
}
function checkColorblind(scheme) {
	return colorbrewer[scheme].properties.blind.length > 1 ? colorbrewer[scheme].properties.blind[numClasses - 3] : colorbrewer[scheme].properties.blind[0];
}
function checkPrint(scheme) {
	return colorbrewer[scheme].properties.print.length > 1 ? colorbrewer[scheme].properties.print[numClasses - 3] : colorbrewer[scheme].properties.print[0];
}
function checkCopy(scheme) {
	return colorbrewer[scheme].properties.copy.length > 1 ? colorbrewer[scheme].properties.copy[numClasses - 3] : colorbrewer[scheme].properties.copy[0];
}
function checkScreen(scheme) {
	return colorbrewer[scheme].properties.screen.length > 1 ? colorbrewer[scheme].properties.screen[numClasses - 3] : colorbrewer[scheme].properties.screen[0];
}

function applyColors() {
	if (!colorbrewer[selectedScheme][numClasses]) {
		$("#counties g path").css("fill", "#ccc");
		return;
	}
	for (var i = 0; i < numClasses; i++) {
		if (!$("#borderscheck").is(":checked")) $("#county-map g .q" + i + "-" + numClasses).css("stroke", colorbrewer[selectedScheme][numClasses][i]);
		$(".q" + i + "-" + numClasses).css("fill", colorbrewer[selectedScheme][numClasses][i]);
	}
}

function drawColorChips() {
	var svg = "<svg width='24' height='270'>";
	for (var i = 0; i < numClasses; i++) {
		svg += "<rect fill=" + colorbrewer[selectedScheme][numClasses][i] + " width='24' height='" + Math.min(24, parseInt(265 / numClasses)) + "' y='" + i * Math.min(24, parseInt(265 / numClasses)) + "'/>";
	}
	$("#color-chips").empty().append(svg);
	updateValues();
}

function updateValues() {
	$("#color-values").empty();
	var str = "";
	var s = $("#color-system").val().toLowerCase();
	var jsonString = "[";
	$("#color-chips rect").each(function (i) {
		var val = (s == "cmyk" ? getCMYK(selectedScheme, numClasses, i) : getColorDisplay($(this).css("fill")));
		str += val + "\n";

		var jsonVal = getColorDisplay($(this).css("fill"));
		if (s == "hex") {
			jsonString += "'" + jsonVal + "'";
		} else {
			jsonString += "'rgb(" + jsonVal + ")'";
		}
		if (i < numClasses - 1) jsonString += ",";
	});
	jsonString += "]";
	str = str.replace(/\n$/, "");

	$("#color-values").append("<textarea readonly style='line-height:" + Math.min(24, parseInt(265 / numClasses)) + "px; height:" + Math.min(24, parseInt(265 / numClasses)) * numClasses + "px'>" + str + "</textarea>");
	$("#ase").attr("href", "export/ase/" + selectedScheme + "_" + numClasses + ".ase");
	$("#gpl").attr("href", "export/gpl/" + selectedScheme + "_" + numClasses + ".gpl");
	$("#json-output").val(jsonString);
}

function getColorDisplay(c, s) {
	if (c.indexOf("#") != 0) {
		var arr = c.replace(/[a-z()\s]/g, "").split(",");
		var rgb = { r: arr[0], g: arr[1], b: arr[2] };
	}
	s = s || $("#color-system").val().toLowerCase();
	if (s == "hex") {
		if (rgb) return rgbToHex(rgb.r, rgb.g, rgb.b);
		return c;
	}
	if (s == "rgb" || s == "cmyk") {
		if (!rgb) rgb = hexToRgb(c);
		return rgb.r + "," + rgb.g + "," + rgb.b;
	}

}
function getCMYK(scheme, classes, n) {
	return cmyk[scheme][classes][n].toString();
}
var highlight;
$("#counties").svg({
	loadURL: "map/map.svg",
	onLoad: function () {
		$("#counties svg")
			.attr("id", "county-map")
			.attr("width", 756)
			.attr("height", 581);
		$("#map-container").css("background-image", "none");
		init();
		$("#counties path").mouseover(function () {
			var cl = $(this).attr("class").match(new RegExp("q[0-9]+-" + numClasses))[0];
			cl = parseInt(cl.substring(cl.indexOf("q") + 1, cl.indexOf("-"))) + 1;
			$("#probe").empty().append(
				"<p>" + selectedScheme + " class " + cl + "<br/>" +
				"RGB: " + getColorDisplay(colorbrewer[selectedScheme][numClasses][cl - 1], "rgb") + "<br/>" +
				"CMYK: " + getCMYK(selectedScheme, numClasses, cl - 1) + "<br/>" +
				"HEX: " + getColorDisplay(colorbrewer[selectedScheme][numClasses][cl - 1], "hex") + "</p>"
			);
			highlight = $(this).clone().css({ "pointer-events": "none", "stroke": "#000", "stroke-width": "2" }).appendTo("#county-map g");
			$("#probe").show();
		});
		$("#counties path").mousemove(function (e) {
			$("#probe").css({ left: Math.min(920, e.pageX - $("#wrapper").offset().left + 10), top: e.pageY - $("#wrapper").offset().top - 75 });
		});
		$("#counties path").mouseout(function () { $("#probe").hide(); highlight.remove(); });
	}
});

function init() {
	var type = getParameterByName("type") || "sequential";
	var scheme = getParameterByName("scheme") || "BuGn";
	var n = getParameterByName("n") || 3;
	$("#" + type).prop("checked", true);
	$("#num-classes").val(n);
	setSchemeType(type);
	setNumClasses(n);
	setScheme(scheme);
}

function layerChange() {
	switch ($(this).attr("id")) {
		case "roadscheck":
			if ($(this).is(":checked")) {
				if (!$("#overlays").children().length)
					loadOverlays("roads");
				else
					$("#roads").show();
			} else {
				$("#roads").hide();
			}
			break;

		case "citiescheck":
			if ($(this).is(":checked")) {
				if (!$("#overlays").children().length)
					loadOverlays("cities");
				else
					$("#cities").show();
			} else {
				$("#cities").hide();
			}
			break;

		case "borderscheck":
			if ($(this).is(":checked")) $("#county-map g").children().css({ "stroke": "inherit", "stroke-width": "0.50" });
			else {
				var i = numClasses; while (i--) {
					$("#county-map g .q" + i + "-" + numClasses).css({ "stroke": colorbrewer[selectedScheme][numClasses][i], "stroke-width": "1" });
				}
			}
	}
}

function loadOverlays(o) {
	$("#overlays").svg({
		loadURL: "map/overlays.svg",
		onLoad: function () {
			$("#overlays svg").attr("width", 756).attr("height", 581);
			if (o == "cities") $("#roads").hide();
			else $("#cities").hide();
			$("#cities").css("fill", $("#city-color").spectrum("get").toHexString());
			$("#road-lines").css("stroke", $("#road-color").spectrum("get").toHexString());
		}
	});
}
$(".learn-more, #how, #credits, #downloads").click(function (e) {
	e.stopPropagation();
	var page;
	switch ($(this).attr("id")) {
		case "number-learn-more":
			$("#learnmore-title").html("データ階級数について");
			page = "number.html";
			break;

		case "schemes-learn-more":
			$("#learnmore-title").html("カラー配色タイプについて");
			page = "schemes.html";
			break;

		case "filters-learn-more":
			$("#learnmore-title").html("ユーザビリティアイコンについて");
			page = "usability.html";
			break;

		case "how":
			$("#learnmore-title").html("HOW TO USE: MAP DIAGNOSTICS");
			page = "howtouse.html";
			break;

		case "credits":
			$("#learnmore-title").html("CREDITS");
			page = "credits.html";
			break;

		case "downloads":
			$("#learnmore-title").html("DOWNLOADS");
			page = "downloads.html";
			break;

		case "context-learn-more":
			$("#learnmore-title").html("地図のコンテキストと背景について");
			page = "context.html";
			break;
	}
	if (page) {
		$("#learnmore #content").load("learnmore/" + page, function () {
			$("#learnmore").show().css("margin-top", ($("#wrapper").height() / 2 - $("#learnmore").height() / 2));
		});
		$("#mask").show();
	}
});
$("#learnmore #close, #mask").click(function () {
	$("#learnmore #content").empty();
	$("#learnmore, #mask").hide();
});

$("#export #tab").toggle(
	function () {
		$("#export").animate({ "left": "265px" });
	},
	function () {
		$("#export").animate({ "left": "0px" });
	})

function rgb2cmyk(r, g, b) {
	var computedC = 0;
	var computedM = 0;
	var computedY = 0;
	var computedK = 0;

	// BLACK
	if (r == 0 && g == 0 && b == 0) {
		computedK = 1;
		return [0, 0, 0, 100];
	}

	computedC = 1 - (r / 255);
	computedM = 1 - (g / 255);
	computedY = 1 - (b / 255);

	var minCMY = Math.min(computedC,
		Math.min(computedM, computedY));
	computedC = (computedC - minCMY) / (1 - minCMY);
	computedM = (computedM - minCMY) / (1 - minCMY);
	computedY = (computedY - minCMY) / (1 - minCMY);
	computedK = minCMY;

	return [Math.round(computedC * 100), Math.round(computedM * 100), Math.round(computedY * 100), Math.round(computedK * 100)];
}
function rgbToHex(r, g, b) {
	return "#" + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}
function hexToRgb(hex) {
	var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result ? {
		r: parseInt(result[1], 16),
		g: parseInt(result[2], 16),
		b: parseInt(result[3], 16)
	} : null;
}

function getParameterByName(name) {
	name = name.replace(/[\[]/, "\\\\[").replace(/[\]]/, "\\\\]");
	var regexS = "[\\\\?\&#]" + name + "=([^&#]*)";
	var regex = new RegExp(regexS);
	var results = regex.exec(window.location.href);
	if (results == null)
		return null;
	else
		return decodeURIComponent(results[1].replace(/\+/g, " "));
}

// ========================================
// Settings Management Functions
// ========================================

/**
 * 現在の全ての設定を収集してJSONオブジェクトとして返す
 */
function getSettings() {
	var settings = {
		version: "1.0",
		timestamp: new Date().toISOString(),
		settings: {
			numClasses: numClasses,
			schemeType: selectedSchemeType,
			scheme: selectedScheme,
			colorSystem: $("#color-system").val(),
			filters: {
				colorblind: $("#blindcheck").is(":checked"),
				print: $("#printcheck").is(":checked"),
				photocopy: $("#copycheck").is(":checked")
			},
			layers: {
				roads: {
					visible: $("#roadscheck").is(":checked"),
					color: $("#road-color").spectrum("get").toHexString()
				},
				cities: {
					visible: $("#citiescheck").is(":checked"),
					color: $("#city-color").spectrum("get").toHexString()
				},
				borders: {
					visible: $("#borderscheck").is(":checked"),
					color: $("#border-color").spectrum("get").toHexString()
				}
			},
			background: {
				type: $("#terrain").is(":checked") ? "terrain" : "solid-color",
				color: $("#bg-color").spectrum("get").toHexString(),
				transparency: parseFloat((($("#transparency-slider").position().left - 3) / $("#transparency-track").width()).toFixed(2))
			}
		}
	};
	return settings;
}

/**
 * 設定をJSONファイルとしてダウンロード
 */
function saveSettingsToFile() {
	try {
		var settings = getSettings();
		var json = JSON.stringify(settings, null, 2);
		var fileName = "colorbrewer_settings.json";

		// FileSaver.jsを使用して保存
		// saveAs(Blob/File, filename) はブラウザ間の差異を吸収して確実に保存ダイアログ/ダウンロードを実行する
		// application/octet-stream を指定して、ブラウザによるコンテンツ解釈を回避し、強制的にダウンロードさせる
		var blob = new Blob([json], { type: "application/octet-stream;charset=utf-8" });
		saveAs(blob, fileName);

		console.log("Settings saved to file: " + fileName + " (v2-octet-stream)");
	} catch (error) {
		console.error("Error saving settings:", error);
		alert("設定の保存中にエラーが発生しました: " + error.message);
	}
}

/**
 * ファイルから設定を読み込んで適用
 */
function loadSettingsFromFile(file) {
	if (!file) return;

	var reader = new FileReader();
	reader.onload = function (e) {
		try {
			var settings = JSON.parse(e.target.result);

			// バリデーション
			if (!settings.settings) {
				throw new Error("無効な設定ファイル形式です");
			}

			// 確認ダイアログ
			var timestamp = settings.timestamp ? new Date(settings.timestamp).toLocaleString('ja-JP') : '不明';
			if (!confirm("設定を読み込みますか？\n\n保存日時: " + timestamp + "\n\n現在の設定は上書きされます。")) {
				return;
			}

			applySettings(settings);
			console.log("Settings loaded successfully");
			alert("設定を読み込みました");

		} catch (error) {
			console.error("Error loading settings:", error);
			alert("設定の読み込み中にエラーが発生しました: " + error.message);
		}
	};
	reader.onerror = function () {
		alert("ファイルの読み込みに失敗しました");
	};
	reader.readAsText(file);
}

/**
 * 設定オブジェクトをUIに適用
 */
function applySettings(settingsObj) {
	try {
		var s = settingsObj.settings;

		// 基本設定
		if (s.numClasses) {
			$("#num-classes").val(s.numClasses);
			numClasses = s.numClasses;
		}

		if (s.schemeType) {
			$("#" + s.schemeType).prop("checked", true);
			setSchemeType(s.schemeType);
		}

		// フィルター
		if (s.filters) {
			$("#blindcheck").prop("checked", s.filters.colorblind || false);
			$("#printcheck").prop("checked", s.filters.print || false);
			$("#copycheck").prop("checked", s.filters.photocopy || false);
		}

		// カラースキームを設定（フィルター適用後）
		if (s.scheme) {
			setScheme(s.scheme);
		}

		// レイヤー設定
		if (s.layers) {
			if (s.layers.roads) {
				$("#roadscheck").prop("checked", s.layers.roads.visible || false);
				$("#road-color").spectrum("set", s.layers.roads.color || "#f33");
			}
			if (s.layers.cities) {
				$("#citiescheck").prop("checked", s.layers.cities.visible || false);
				$("#city-color").spectrum("set", s.layers.cities.color || "#000");
			}
			if (s.layers.borders) {
				$("#borderscheck").prop("checked", s.layers.borders.visible !== false);
				$("#border-color").spectrum("set", s.layers.borders.color || "#000");
			}
			// レイヤー変更を適用
			$("#layers input").trigger("change");
		}

		// 背景設定
		if (s.background) {
			if (s.background.type === "terrain") {
				$("#terrain").prop("checked", true);
			} else {
				$("#solid-color").prop("checked", true);
			}
			$("#bg-color").spectrum("set", s.background.color || "#fff");
			$("#terrain, #solid-color").trigger("change");

			// 透明度
			if (typeof s.background.transparency !== 'undefined') {
				var trackWidth = $("#transparency-track").width();
				var newLeft = 3 + (s.background.transparency * trackWidth);
				$("#transparency-slider").css("left", newLeft);
				$("#county-map g").css("opacity", 1 - s.background.transparency);
			}
		}

		// カラーシステム
		if (s.colorSystem) {
			$("#color-system").val(s.colorSystem);
			updateValues();
		}

	} catch (error) {
		console.error("Error applying settings:", error);
		throw error;
	}
}

/**
 * LocalStorageに設定を保存
 */
function saveSettingsToLocalStorage() {
	try {
		var settings = getSettings();
		localStorage.setItem('colorbrewer-settings', JSON.stringify(settings));
		console.log("Settings auto-saved to localStorage");
	} catch (error) {
		console.error("Error saving to localStorage:", error);
	}
}

/**
 * LocalStorageから設定を読み込み
 */
function loadSettingsFromLocalStorage() {
	try {
		var saved = localStorage.getItem('colorbrewer-settings');
		if (saved) {
			var settings = JSON.parse(saved);
			return settings;
		}
		return null;
	} catch (error) {
		console.error("Error loading from localStorage:", error);
		return null;
	}
}

/**
 * 自動保存の有効/無効を切り替え
 */
function toggleAutoSave() {
	var enabled = $("#auto-save-toggle").is(":checked");
	localStorage.setItem('colorbrewer-autosave-enabled', enabled ? 'true' : 'false');

	if (enabled) {
		// 即座に保存
		saveSettingsToLocalStorage();
		console.log("Auto-save enabled");
	} else {
		console.log("Auto-save disabled");
	}
}

/**
 * 設定変更時に自動保存を実行（デバウンス付き）
 */
var autoSaveTimeout;
function triggerAutoSave() {
	if ($("#auto-save-toggle").is(":checked")) {
		clearTimeout(autoSaveTimeout);
		autoSaveTimeout = setTimeout(function () {
			saveSettingsToLocalStorage();
		}, 1000); // 1秒後に保存
	}
}

// ========================================
// Event Handlers for Settings Management
// ========================================

$(document).ready(function () {
	// 保存ボタン
	$("#save-settings-btn").click(function (e) {
		e.preventDefault();
		saveSettingsToFile();
	});

	// 読み込みボタン
	$("#load-settings-btn").click(function (e) {
		e.preventDefault();
		$("#load-settings-input").click();
	});

	// ファイル選択
	$("#load-settings-input").change(function (e) {
		var file = e.target.files[0];
		if (file) {
			loadSettingsFromFile(file);
		}
		// リセット（同じファイルを再度選択可能にする）
		$(this).val('');
	});

	// 自動保存トグル（機能削除のためコメントアウト）
	// $("#auto-save-toggle").change(function () {
	// 	toggleAutoSave();
	// });

	// 復元ボタン（機能削除のためコメントアウト）
	// $("#restore-settings-btn").click(function (e) {
	// 	e.preventDefault();
	// 	var saved = loadSettingsFromLocalStorage();
	// 	if (saved) {
	// 		var timestamp = saved.timestamp ? new Date(saved.timestamp).toLocaleString('ja-JP') : '不明';
	// 		if (confirm("前回の設定を復元しますか？\n\n保存日時: " + timestamp)) {
	// 			applySettings(saved);
	// 			alert("設定を復元しました");
	// 		}
	// 	} else {
	// 		alert("保存された設定が見つかりません");
	// 	}
	// });

	// 自動保存の初期状態を復元（機能削除のためコメントアウト）
	// var autoSaveEnabled = localStorage.getItem('colorbrewer-autosave-enabled') === 'true';
	// $("#auto-save-toggle").prop("checked", autoSaveEnabled);

	// 各種設定変更時に自動保存をトリガー（機能削除のためコメントアウト）
	// $("#num-classes, .scheme-type, #color-system").change(triggerAutoSave);
	// $("#filters input, #layers input").change(triggerAutoSave);
	// $("#terrain, #solid-color").change(triggerAutoSave);
	// $("#transparency-slider").mouseup(triggerAutoSave);
	// $(".ramp").click(triggerAutoSave);

	// Spectrum カラーピッカーの変更時（機能削除のためコメントアウト）
	// $("#road-color, #city-color, #border-color, #bg-color").on("change.spectrum", triggerAutoSave);

	// クラウド保存・読込
	$("#save-cloud-btn").click(function (e) {
		e.preventDefault();
		handleCloudSave();
	});
	$("#load-cloud-btn").click(function (e) {
		e.preventDefault();
		handleCloudLoad();
	});
	$("#cloud-dialog-close").click(function () {
		closeCloudDialog();
	});
});

// ========================================
// Cloud Storage Functions
// ========================================
var cloudClient = new DatavizApiClient();

function showCloudDialog(title, content) {
	$("#cloud-dialog-title").text(title);
	$("#cloud-dialog-content").html(content);
	$("#mask").show();
	$("#cloud-dialog").show();
}

function closeCloudDialog() {
	$("#cloud-dialog").hide();
	$("#mask").hide();
	$("#cloud-dialog-content").empty();
}

async function handleCloudSave() {
	try {
		var session = await cloudClient.getSession();
		if (!session) {
			alert("サーバ機能を使用するにはログインが必要です。");
			return;
		}

		var currentName = "My Color Scheme";
		var formHtml =
			'<div style="padding:10px;">' +
			'<p>プロジェクト名を入力してください:</p>' +
			'<input type="text" id="cloud-project-name" value="' + currentName + '" style="width:100%; padding:5px; box-sizing:border-box;" />' +
			'<button id="cloud-execute-save" class="settings-btn" style="width:100%; margin-top:10px;">保存を実行</button>' +
			'</div>';
		showCloudDialog("サーバに保存", formHtml);

		$("#cloud-execute-save").click(async function () {
			try {
				var name = $("#cloud-project-name").val();
				if (!name) return alert("名前を入力してください");

				$(this).text("保存中...").prop("disabled", true);

				var settings = getSettings();
				var thumbnail = await generateThumbnail();

				await cloudClient.createProject(name, settings, thumbnail);

				alert("保存しました！");
				closeCloudDialog();
			} catch (e) {
				console.error(e);
				alert("保存に失敗しました: " + e.message);
				$(this).text("保存を実行").prop("disabled", false);
			}
		});

	} catch (e) {
		alert("エラー: " + e.message);
	}
}

async function handleCloudLoad() {
	try {
		var session = await cloudClient.getSession();
		if (!session) {
			alert("サーバ機能を使用するにはログインが必要です。");
			return;
		}

		$("#cloud-dialog-content").html("プロジェクト一覧を取得中...");
		showCloudDialog("サーバから読込", "");

		var projects = await cloudClient.listProjects();

		if (!projects || projects.length === 0) {
			$("#cloud-dialog-content").html("<p style='padding:10px;'>保存されたプロジェクトはありません。</p>");
			return;
		}

		var listHtml = '<div style="display:flex; flex-direction:column; gap:10px;">';
		projects.forEach(function (p) {
			var dateStr = new Date(p.updated_at).toLocaleString('ja-JP');
			listHtml +=
				'<div class="project-item" style="border:1px solid #ddd; padding:10px; display:flex; gap:10px; align-items:center;">' +
				'<div class="thumb-container" data-id="' + p.id + '" style="width:80px; height:60px; background:#eee; display:flex; align-items:center; justify-content:center; overflow:hidden;">' +
				'<span style="font-size:10px; color:#999;">Loading...</span>' +
				'</div>' +
				'<div style="flex:1;">' +
				'<div style="font-weight:bold;">' + p.name + '</div>' +
				'<div style="font-size:12px; color:#666;">' + dateStr + '</div>' +
				'</div>' +
				'<button class="settings-btn load-execute-btn" data-id="' + p.id + '">読込</button>' +
				'<button class="settings-btn delete-execute-btn" data-id="' + p.id + '" style="background:#fdd;">削除</button>' +
				'</div>';
		});
		listHtml += '</div>';

		$("#cloud-dialog-content").html(listHtml);

		// サムネイル読み込み
		projects.forEach(function (p) {
			if (p.thumbnail_path) {
				cloudClient.getThumbnailBlob(p.id)
					.then(function (blob) {
						var url = URL.createObjectURL(blob);
						$(".thumb-container[data-id='" + p.id + "']").html('<img src="' + url + '" style="width:100%; height:auto;" />');
					})
					.catch(function () {
						$(".thumb-container[data-id='" + p.id + "']").html('<span style="font-size:10px; color:#f00;">Error</span>');
					});
			} else {
				$(".thumb-container[data-id='" + p.id + "']").html('<span style="font-size:10px; color:#ccc;">No Image</span>');
			}
		});

		$(".load-execute-btn").click(async function (e) {
			e.stopPropagation();
			var id = $(this).data("id");
			if (!confirm("現在の設定を上書きして読み込みますか？")) return;

			try {
				var projectData = await cloudClient.getProjectData(id);
				applySettings(projectData);
				alert("読み込みました");
				closeCloudDialog();
			} catch (e) {
				alert("読み込みエラー: " + e.message);
			}
		});

		$(".delete-execute-btn").click(async function (e) {
			e.stopPropagation();
			if (!confirm("本当に削除しますか？")) return;
			var id = $(this).data("id");
			try {
				await cloudClient.deleteProject(id);
				$(this).closest(".project-item").remove();
			} catch (e) {
				alert("削除エラー: " + e.message);
			}
		});

	} catch (e) {
		$("#cloud-dialog-content").text("エラー: " + e.message);
	}
}

async function generateThumbnail() {
	return new Promise(function (resolve) {
		try {
			var svg = document.getElementById("county-map");
			if (!svg) { resolve(null); return; }

			var serializer = new XMLSerializer();
			var svgString = serializer.serializeToString(svg);

			var canvas = document.createElement("canvas");
			canvas.width = 756;
			canvas.height = 581;
			var ctx = canvas.getContext("2d");

			ctx.fillStyle = "#ffffff";
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			var img = new Image();
			var svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
			// URL生成 (webkitURL 対応など古いブラウザ考慮は不要、最新前提)
			var url = URL.createObjectURL(svgBlob);

			img.onload = function () {
				ctx.drawImage(img, 0, 0);
				URL.revokeObjectURL(url);
				try {
					var dataUrl = canvas.toDataURL("image/png");
					resolve(dataUrl);
				} catch (e) {
					console.error("Canvas toDataURL failed", e);
					resolve(null);
				}
			};

			img.onerror = function (e) {
				console.error("Thumbnail generation failed:", e);
				resolve(null);
			};

			img.src = url;

		} catch (e) {
			console.error("Thumbnail error:", e);
			resolve(null);
		}
	});
}
