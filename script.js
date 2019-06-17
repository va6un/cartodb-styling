(function () {
    var map = L.map('mapid').setView([37.0902, 95.7129], 3);

    // DOM ELEMENTS
    var pre = document.getElementById("geojson-res");
    var radiusSlider = document.getElementById("radius-slider");
    var strokeSlider = document.getElementById("stroke-slider");
    var radiusSliderVal = document.querySelector(".radius-slider-val");
    var strokeSliderVal = document.querySelector(".stroke-slider-val");
    var colorSelector = document.getElementById("color-selector");

    // STORES GEOJSON
    var data = null;

    // STORES GEOJSON LAYER OBJECT
    var cartoDBLayer = null;

    var updateValues = function (what) {
        switch (what) {
            case "radius":
                radiusSliderVal.innerHTML = radiusSlider.value;
                break;
            case "stroke":
                strokeSliderVal.innerHTML = strokeSlider.value;
                break;
            default:
                radiusSliderVal.innerHTML = radiusSlider.value;
                strokeSliderVal.innerHTML = strokeSlider.value;
        }
    }

    updateValues();

    L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}",
        {
            attribution:
                'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
            maxZoom: 10,
            id: "mapbox.streets",
            accessToken:
                "pk.eyJ1IjoidmFydW5iIiwiYSI6ImNqc2N6ZzAweDBxZWc0M2xuMWp4cXd2ZzkifQ.DRQDiEWz-BDy9uOVguNhaw"
        }).addTo(map);



    function onEachFeaturePoint(feature, layer) {
        var popupContent = "";

        if (feature.properties && feature.properties.adm0name) {
            popupContent += "<h4>Country: " + feature.properties.adm0name + "</h4>";
        }
        if (feature.properties && feature.properties.adm1name) {
            popupContent += "<h5>City: " + feature.properties.adm1name + "</h5>";
        }

        layer.bindPopup(popupContent);
    }

    // LOAD THE CARTODB GEOJSON
    function loadGeoJson(cb) {
        var xobj = new XMLHttpRequest();
        xobj.overrideMimeType("application/json");
        // xobj.open("GET", "./cartodb-query.geojson", true);
        xobj.open("GET", "https://cartovl.carto.com/api/v2/sql?q=SELECT%20*%20FROM%20populated_places_small&format=GeoJSON", true);

        xobj.onreadystatechange = function () {
            if (xobj.readyState == 4 && xobj.status == "200") {
                cb(xobj.responseText);
            }
        }
        xobj.send(null);
    }



    var loadLayer = function () {
        cartoDBLayer = L.geoJSON(data, {
            pointToLayer: function (feature, latlng) {
                return L.circleMarker(latlng, {
                    radius: radiusSlider.value,
                    fillColor: colorSelector.options[colorSelector.selectedIndex].value,
                    color: "#000",
                    weight: strokeSlider.value,
                    opacity: 1,
                    fillOpacity: 1
                });
            },
            onEachFeature: onEachFeaturePoint
        }).addTo(map);
    }

    loadGeoJson(function (response) {
        data = JSON.parse(response);

        // LOAD CARTODB LAYER
        loadLayer();

        // VIEW GEO JSON
        pre.innerHTML = JSON.stringify(data, null, 2);
    });

    // EVENTS
    radiusSlider.addEventListener("change", function () {
        cartoDBLayer.setStyle({ radius: radiusSlider.value });
        updateValues("radius");
    }, false);

    strokeSlider.addEventListener("change", function () {
        cartoDBLayer.setStyle({ weight: strokeSlider.value });
        updateValues("stroke");
    }, false);

    colorSelector.addEventListener("change", function () {
        cartoDBLayer.setStyle({ fillColor: colorSelector.value });
    });
})();