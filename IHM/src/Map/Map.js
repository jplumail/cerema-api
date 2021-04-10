import React, { useRef, useState, useEffect } from "react"
import "./Map.css";
import MapContext from "./MapContext";
import * as ol from "ol";
import Select from 'ol/interaction/Select';

import ExtentInteraction from 'ol/interaction/Extent';


import {platformModifierKeyOnly,shiftKeyOnly,altKeyOnly} from 'ol/events/condition';

//import * as olExtent from 'ol/extent';
import * as olProj from 'ol/proj';



const extent = new ExtentInteraction({condition: altKeyOnly});// Interaction permettant le tracé de rectangle

const select = new Select({toggleCondition : platformModifierKeyOnly});// Interaction permettant la sélection de vecteurs/polygones
console.log(select)


export function selectChange(){// Fonction permettant de récupérer les coordonnées de la selection de polygones
  //console.log(select);
  
  //console.log(select.getFeatures().array_);
  var polygs_selected=select.getFeatures().array_;
  var list_idx=[];// Liste qui contiendra les identifiants de nos polygones
  for (let index = 0; index < polygs_selected.length ; index++){
    list_idx.push(polygs_selected[index].values_.id)
  }
  console.log("idx selec",list_idx)
  
  select.getFeatures().clear()// On vide notre sélection afin d'éviter des problèmes plus tard

  return (list_idx)// On renvoie ici la liste des identifiants

}



export function extentChange() {// Fonction permettant de récupérer les coordonnées de la selection rectangulaire
  //console.log(olExtent.getTopLeft(extent.getExtent()))
  if (extent.getExtent()!=null){// Si un rectangle a bien été selectionné
    //console.log(extent.getExtent())
    var coords = extent.getExtent()// On récupère les coordonnées de notre rectangle
    var coords1=[coords[0],coords[1]]
    var coords2=[coords[2],coords[3]]

    var vector1 = olProj.transform(coords1, 'EPSG:3857', 'EPSG:4326');// On mets nos coordonnées géographiques au bon format 
    var vector2 = olProj.transform(coords2, 'EPSG:3857', 'EPSG:4326');
    var lat=[vector1[1],vector2[1]]
    var lon=[vector1[0],vector2[0]]
    var result=[Math.min(...lon),Math.min(...lat),Math.max(...lon),Math.max(...lat)]
    

    let selection = { lonMin:result[0], latMin:result[1], lonMax:result[2], latMax:result[3], valid : "true"} // On crée un dictionnaire reperoriant les éléments demandés par l'algorithme de détection
    
    
    //let donnees = JSON.stringify(selection)
    //console.log(selection) 
    return ( selection)
    
  
  }
  else {
    let selection = { valid : "false"};
    //let donnees = JSON.stringify(selection);
    return selection
  }
};



export const Map = ({ children, zoom, center }) => {
  const mapRef = useRef();
  const [map, setMap] = useState(null);

  

  // on component mount
  useEffect(() => {
    let options = {
      view: new ol.View({ zoom, center }),
      layers: [],
      controls: [],
      overlays: []
    };
    let mapObject = new ol.Map(options);
    mapObject.setTarget(mapRef.current);
    setMap(mapObject);


    // On rajoute nos interactions à notre map
    mapObject.addInteraction(extent);  
    mapObject.addInteraction(select);

    
   

    return () => mapObject.setTarget(undefined);
  }, []);
  // zoom change handler
  useEffect(() => {
    if (!map) return;
    map.getView().setZoom(zoom);
  }, [zoom]);
  // center change handler
  useEffect(() => {
    if (!map) return;
    map.getView().setCenter(center)
  }, [center])

  
  return (
    <MapContext.Provider value={{ map }}>
      <div ref={mapRef} onClick={extentChange} className="ol-map">
        {children}
      </div>
    </MapContext.Provider>
  )
}


export default Map;
//export default ;