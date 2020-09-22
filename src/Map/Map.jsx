import React from "react";
import { connect } from "react-redux";
import L from "leaflet";
import PropTypes from "prop-types";

import HereTileLayers from "./hereTileLayers";

// defining the container styles the map sits in
const style = {
  width: "100%",
  height: "100vh"
};

// using the reduced.day map styles, have a look at the imported hereTileLayers for more
const hereReducedDay = HereTileLayers.here({
  apiKey: process.env.REACT_APP_APIKEY,
  scheme: "normal.day"
});

// for this app we create two leaflet layer groups to control, one for the isochrone centers and one for the isochrone contours
const markersLayer = L.featureGroup();
const isochronesLayer = L.featureGroup();

// we define our bounds of the map
const southWest = L.latLng(-90, -180),
  northEast = L.latLng(90, 180),
  bounds = L.latLngBounds(southWest, northEast);

// a leaflet map consumes parameters, I'd say they are quite self-explanatory
const mapParams = {
  center: [25.95681, -35.729687],
  zoomControl: false,
  maxBounds: bounds,
  zoom: 2,
  layers: [markersLayer, isochronesLayer, hereReducedDay]
};

// this you have seen before, we define a react component
class Map extends React.Component {
  static propTypes = {
    isochronesControls: PropTypes.object.isRequired,
    mapEvents: PropTypes.object,
    dispatch: PropTypes.func.isRequired
  };

  addIsochrones() {
    isochronesLayer.clearLayers();

    const isochrones = this.props.isochronesControls.isochrones.results;

    if (isochrones.length > 0) {
      let cnt = 0;

      var polygon;
      
      for (const isochrone of isochrones) {
        for (const isochroneComponent of isochrone.component) {
          polygon = L.polygon(
            isochroneComponent.shape.map(function(coordString) {
              return coordString.split(",");
            }),
            {
              fillColor: "#f44242",
              weight: 2,
              opacity: 1,
              color: "white",
              pane: "isochronesPane"
            }
          )
          polygon.addTo(isochronesLayer);
        }
        cnt += 1;
      }
      console.log(polygon)
      this.map.fitBounds(polygon.getBounds());
    }
  }

  addIsochronesCenter() {
    // clear the markers layer beforehand
    markersLayer.clearLayers();

    const isochronesCenter = this.props.isochronesControls.settings
      .isochronesCenter;

    // does this object contain a latitude and longitude?
    if (isochronesCenter.lat && isochronesCenter.lng) {
      // we are creating a leaflet circle marker with a minimal tooltip
      L.circleMarker(isochronesCenter)
        .addTo(markersLayer)
        .bindTooltip(
          "latitude: " +
            isochronesCenter.lat +
            ", " +
            "longitude: " +
            isochronesCenter.lng,
          {
            permanent: false
          }
        )
        .openTooltip();
    }
  }

  componentDidUpdate() {
    this.addIsochronesCenter();
    this.addIsochrones();
  }

  // and once the component has mounted we add everything to it
  componentDidMount() {
    // our map!
    this.map = L.map("map", mapParams);

    // we create a leaflet pane which will hold all isochrone polygons with a given opacity
    var isochronesPane = this.map.createPane("isochronesPane");
    isochronesPane.style.opacity = 0.9;

    // our basemap and add it to the map
    const baseMaps = {
      "HERE reduced.day": hereReducedDay
    };
    L.control.layers(baseMaps).addTo(this.map);

    // we do want a zoom control
    L.control
      .zoom({
        position: "topright"
      })
      .addTo(this.map);

  }

  // don't forget to render it :-)
  render() {
    return <div id="map" style={style} />;
  }
}

// and we already map the redux store to properties which we will start soon
const mapStateToProps = state => {
  const isochronesControls = state.isochronesControls;
  return {
    isochronesControls
  };
};

export default connect(mapStateToProps)(Map);
