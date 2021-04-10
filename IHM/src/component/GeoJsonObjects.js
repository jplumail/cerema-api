import React from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
//D:\Cours\Fise_A2\Projet\Docs cerema\fresnaye\analyse_maskrcnn\objects.json
//var data = require('../data/objects.json');
//import ReactGeoJSON from 'react-geojson';
import Polygon from 'ol/geom/Polygon';
import {getArea, getLength} from 'ol/sphere';


// La classe suivante nous permet de modifier les divers polygones identifiés par l'algorithme de détection.

class GeoJsonObjects {
    constructor(){
        this.jsonData={// On initialise notre Json par un simple point qui ne s'affichera pas afin d'éviter des bugs
                "type": "FeatureCollection",
            
            
                "features": [
                  {
                    "geometry": {
                      "coordinates": [
                        [
                          [
                            -2.301517217085, 
                            48.6436269340762
                          ]
                        ]
                      ], 
                      "type": "Point"
                    }, 
                    "properties": {
                      "feature": "null", 
                      "id": 0, 
                      "scores": 0.9999592304229736
                    }, 
                    "type": "Feature"
                  }, 
                ]
        } 
        this.deleted_polygons=[]// Contiendra un historique des polygones supprimés afin e pouvoir revenir en arrière

    }

    getjson(){// Envoie le Json
        
        return (this.jsonData);
	}
	setJson(polygs){// Modifie le Json
        this.jsonData=polygs;
        console.log(this.jsonData)

    }
    fusion_polyg(list_idx){// Fusion les polygones ayant leurs ids référencés par list_idx
        var list_fusion=[]
        for (let i = 0; i < list_idx.length ; i++){// Pour chacuns des polygones à fusionner
            let index_polyg=list_idx[i]

            let newPolygon = this.jsonData.features.filter(item => item.properties.id === index_polyg)[0] // On récupère le Polygone grâce à son ID
            if (newPolygon!= undefined){
                list_fusion.push(newPolygon)// on le rentre dans la liste de polygones à fusionner
            }
            
            this.jsonData.features = this.jsonData.features.filter(item => item.properties.id !== index_polyg)// On supprime le Polygone du JSON
            
        }
        //console.log(list_fusion)
        //console.log(this.jsonData)
        var new_polyg = list_fusion[0] // On prend pour base le 1er polygone
        //console.log(new_polyg.geometry.coordinates)
        var Polyg0Coord = new_polyg.geometry.coordinates[0];// On récupère ses coordonnées
        //console.log(0, Polyg0Coord)

        for (let i = 1; i < list_fusion.length ; i++){// Pour chacuns des polygones à fusionner restants : 
            Polyg0Coord = new_polyg.geometry.coordinates[0];
            let currentPolygCoord=list_fusion[i].geometry.coordinates[0]// On récupère les coordonnées de ce polygone
            //console.log(i,currentPolygCoord)
            new_polyg.geometry.coordinates = [Polyg0Coord.concat(currentPolygCoord)]// On concatène ces coordonnées
            // Cette solution n'est pas très élégante, mais nous n'avons pas eu le temps de nous pencher sur la fusion de polygones

            //array1.concat(array2)
            //console.log("result",new_polyg.geometry.coordinates)
        }
        this.jsonData.features.push(new_polyg)// On rajoute le nouveau polygone ainsi formé
    }

    suppression_polygs(list_idx){// Suppression d'une liste de polygones renseignés par leurs identifiants
        for (let i = 0; i < list_idx.length ; i++){// pour chacun des polygones
            let index_polyg=list_idx[i]

            let newPolygon = this.jsonData.features.filter(item => item.properties.id === index_polyg)[0]// on recupère le polygone 
            if (newPolygon!= undefined){
                this.deleted_polygons.push(newPolygon)// on le rejoute dans l historique de suppression
            }
            
            this.jsonData.features = this.jsonData.features.filter(item => item.properties.id !== index_polyg)// On l'enlève du Json
        }
        console.log(this.deleted_polygons)

    }

    retourArriere(){// Annule la suppression du dernier polygone
        if (this.deleted_polygons.length !==0){// Si l'historique de suppression n'est pas vide
            this.jsonData.features.push(this.deleted_polygons[this.deleted_polygons.length-1]);// On rajoute le polygone supprimé
            //var new_deleted=[]
            //for (let i )
            this.deleted_polygons.pop()// on l'enlève de l'historique

        }
        //console.log(this.jsonData.features)
        //console.log(this.deleted_polygons)
        


    }


    getSizeList(){// Récupère le nombre de polygones
        var features = this.jsonData.features
        var compte_bouchot = 0
        var compte_oyster = 0
        for (let i = 0; i <features.length ; i++){// dénombre les pôches d'huîtres
            if (features[i].properties.feature==="oyster_pocket"){
                compte_oyster++
            }
            else if (features[i].properties.feature==="oyster_pocket"){// dénombre les bouchots
                compte_bouchot++
            }
        }

        return ( [compte_bouchot,compte_oyster] );// On renvoie les 2
    }

	




	obtainjson(){



        this.jsonData = require('../data/5562a05f-967e-4943-ab68-b9ec1680af57.json')// charge un exemple de l'algo de detection
        //this.jsonData = require('../data/json_export2.json')
        


    }
    mesureSurface(list_idx){// Mesure la surface des poches d'huitres référencées par l'identifiant de leur polygone
        //console.log("zzz")
        if (list_idx[0]==="all"){// Si on a choisi de mesurer la surface totale/ la surface de l'ensemble des poches
            var list_oyster=this.jsonData.features.filter(item => item.properties.feature==="oyster_pocket")// enlève les bouchots
            list_idx=[]
            for (let i = 0; i<list_oyster.length; i++){// on récupère la liste des identifiants polygones
                list_idx.push(list_oyster[i].properties.id)

            }

            //console.log(list_idx)
        }
        var totalArea = 0
        //console.log("zzz")
        for (let i=0;i<list_idx.length;i++){// Pour chacun des polygones
            //console.log(this.jsonData.features)
            var current_oyster_pocket = this.jsonData.features.filter(item => item.properties.id === list_idx[i])[0]// on récupère la liste des polygones
            //console.log(current_oyster_pocket)



            var current_polyg = new Polygon(current_oyster_pocket.geometry.coordinates)// On utilise la classe Polygone utile pour le calcul de surface
            //console.log("currentpolyg",current_polyg)
            totalArea += getArea(current_polyg , {projection: 'EPSG:4326'} )// On calcule
            //console.log(totalArea)
            
        }

        return ( totalArea.toString() +" m²" )

    }


  } 

export default GeoJsonObjects