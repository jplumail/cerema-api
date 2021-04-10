import { useContext, useEffect } from "react";
import MapContext from "../Map/MapContext";
import OLImageLayer from 'ol/layer/Image';
import * as olExtent from 'ol/extent';
import Extent from "ol/interaction/Extent";
const ImageLayer = ({ source, zIndex = 0, extent, projection }) => {
  const { map } = useContext(MapContext); 
  useEffect(() => {
    if (!map) return;
    
    let imageLayer = new OLImageLayer({
      source: source,
      zIndex: zIndex,
      extent: extent,
      projection: projection
    });
    map.addLayer(imageLayer);
    imageLayer.setZIndex(zIndex);
    return () => {
      if (map) {
        map.removeLayer(imageLayer);
      }
    };
  }, [map]);
  return null;
};
export default ImageLayer;