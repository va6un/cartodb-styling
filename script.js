(function () {
  const map = L.map("mapid").setView([37.0902, 95.7129], 5);

  // DOM ELEMENTS
//   const pre = document.getElementById("geojson-res");
  const radiusSlider = document.getElementById("radius-slider");
  const strokeSlider = document.getElementById("stroke-slider");
  const radiusSliderVal = document.querySelector(".radius-slider-val");
  const strokeSliderVal = document.querySelector(".stroke-slider-val");
  const colorSelector = document.getElementById("color-selector");
  const data_set_selector = document.getElementById("data_set_selector");

  // STORES GEOJSON LAYER OBJECT
  let cartoDBLayer = null;
  let light_layer = null;
  let current_layer = null; // an argument to map.removeLayer(current_layer)
  let light_markers = null;

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
  };

  updateValues();

  L.tileLayer(
    "https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}",
    {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
      maxZoom: 10,
      id: "mapbox/dark-v10",
      accessToken:
        "pk.eyJ1IjoidmFydW5iIiwiYSI6ImNrbmZqYnQwMDJ2ZTUycXA5Y2Zya2QzM3gifQ.r7iv0_XbuD2Y8fzN0BmY8A",
    }
  ).addTo(map);

  //   const light_layer = L.geoJSON().addTo(map);

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

  async function loadGEOJSON_network(url) {
    const response = await fetch(url);
    if (response.status >= 200 && response.status <= 299) {
      const data = await response.json();

      // LOAD CARTODB LAYER
      loadLayer(data);

      // VIEW GEO JSON
    //   pre.innerHTML = JSON.stringify(data, null, 2);
    } else {
      console.log(status);
    }
  }
  async function loadCSV_local(type, url) {
    if (type === "lightning_last_15") {
      const response = await fetch("./data/last15.csv");
      const data = await response.text();
      return data;
    }
  }

  // LOAD THE CARTODB GEOJSON
  function loadGeoJson(data_set) {
    let url = "";
    switch (data_set) {
      case "populated_places_small":
        url =
          "https://cartovl.carto.com/api/v2/sql?q=SELECT%20*%20FROM%20populated_places_small&format=GeoJSON";
        loadGEOJSON_network(url).catch((e) => console.error(e));
        break;
      case "lightning_last_15":
        url = "./dadta/last15.csv";
        loadCSV_local("lightning_last_15", url)
          .then((data) => {
            const table = data.split("\n").splice(1); //split the string at '\n' and save it to an array.

            var myStyle = {
              color: "#ff7800",
              weight: 5,
              opacity: 0.65,
            };

            const features = {
              type: "FeatureCollection",
              features: [],
            };
            for (rows of table) {
              const column = rows.split(",");
              const latitude = column[2];
              const longitude = column[3];
              const stroke = column[7];

              if (
                latitude !== undefined &&
                longitude !== undefined &&
                stroke !== undefined
              ) {
                const feature = {
                  type: "Feature",
                  geometry: {
                    type: "Point",
                    coordinates: [longitude, latitude],
                  },
                  properties: {
                    stroke: stroke,
                  },
                };
                features.features.push(feature);
              }
            }

            light_markers = L.markerClusterGroup({
              showCoverageOnHover: false,
              removeOutsideVisibleBounds: true,
            });

            light_layer = L.geoJson(features, {
              onEachFeature: function (feature, layer) {
                layer.bindPopup(feature.properties.address);
              },
            });
            current_layer = light_layer;

            light_markers.addLayer(light_layer);

            map.addLayer(light_markers);
            map.fitBounds(light_markers.getBounds());
            // pre.innerHTML = JSON.stringify(features, null, 2);
          })
          .catch(console.error);
        break;
    }
    // var xobj = new XMLHttpRequest();
    // xobj.overrideMimeType("application/json");
    // // xobj.open("GET", "./cartodb-query.geojson", true);
    // xobj.open("GET", url, true);

    // xobj.onreadystatechange = function () {
    //     if (xobj.readyState == 4 && xobj.status == "200") {
    //         var data = JSON.parse(xobj.responseText);

    //         // LOAD CARTODB LAYER
    //         loadLayer(data);

    //         cb(data, xobj.status);
    //     }
    // }
    // xobj.send(null);
  }

  var loadLayer = function (data) {
    cartoDBLayer = L.geoJSON(data, {
      pointToLayer: function (feature, latlng) {
        return L.circleMarker(latlng, {
          radius: radiusSlider.value,
          fillColor: colorSelector.options[colorSelector.selectedIndex].value,
          color: "#000",
          weight: strokeSlider.value,
          opacity: 1,
          fillOpacity: 1,
        });
      },
      onEachFeature: onEachFeaturePoint,
    }).addTo(map);
    current_layer = cartoDBLayer;
  };

  // Load the first data set from the drop down
  // loadGeoJson(data_set_selector.value);

  // EVENTS
  radiusSlider.addEventListener("change", function () {
      if(cartoDBLayer !== null){
          cartoDBLayer.setStyle({ radius: radiusSlider.value });
          updateValues("radius");
      }
    },
    false
  );

  strokeSlider.addEventListener("change", function () {
      if(cartoDBLayer !== null){
        cartoDBLayer.setStyle({ weight: strokeSlider.value });
        updateValues("stroke");
      }
    },
    false
  );

  colorSelector.addEventListener("change", function () {
    if (cartoDBLayer !== null) {
      cartoDBLayer.setStyle({ fillColor: colorSelector.value });
    }
  });

  loadGeoJson('populated_places_small');
  data_set_selector.addEventListener("change", function () {
    if (
      cartoDBLayer !== null &&
      data_set_selector.value === "lightning_last_15"
    ) {
      map.removeLayer(cartoDBLayer);
    }
    if (
      light_markers !== null &&
      data_set_selector.value === "populated_places_small"
    ) {
      map.removeLayer(light_markers);
    }
    loadGeoJson(data_set_selector.value);
  });
})();
