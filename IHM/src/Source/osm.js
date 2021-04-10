import * as olSource from "ol/source";

function osm() {



	return new olSource.OSM()//"https://a.tile.openstreetmap.org/${z}/${x}/${y}.png");
}

export default osm;