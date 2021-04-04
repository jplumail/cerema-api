import { useState ,React} from 'react';
//import { useState } from 'react';

import './App.css';


import 'bootstrap/dist/css/bootstrap.min.css';
import {Row,Col,Button,ButtonGroup, Form} from 'react-bootstrap';
import Container from 'react-bootstrap/Container'
import { Table } from "react-bootstrap";
import axios from 'axios';
//openLayers
import Map,{extentChange,selectChange} from "./Map/Map.js";
//import { Layers, TileLayer, VectorLayer } from "./Layers";
import Layers from "./Layers/Layers.js";
import TileLayer from "./Layers/TileLayers.js";
import VectorLayer from "./Layers/VectorLayers.js";
import ImageLayer from "./Layers/ImageLayer.js";
//import ListVectorLayer from "./Layers/ListVectorLayers.js";
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style';
import { osm, vector } from "./Source";
import { fromLonLat, get } from 'ol/proj';
import GeoJSON from 'ol/format/GeoJSON';
import Static from 'ol/source/ImageStatic';
//import { Controls, FullScreenControl } from "Controls";
import Controls from "./Controls/Controls"
import FullScreenControl from "./Controls/FullScreenControl.js";
import GeoJsonObjects from "./component/GeoJsonObjects.js";

//import OverlayTrigger from 'react-bootstrap/Overlay'
//import Tooltip from 'react-bootstrap/Overlay'
//import Image from 'react-bootstrap/Image';

//import Home1, {Home2} from './App'
//import TablePrix from './components/TablePrix.js';
import {getCenter} from 'ol/extent';
import {transform} from 'ol/proj';


var listeStyle=[]


function traitementTXT(input){
  if (input.indexOf(".tif")===-1){
    return (undefined)

  }
  //input.replace("\"","/")

  for ( let i = 0 ; i<input.length;i++){
    input=input.replace("\\","/")
  }
  

  return (input)


}



let styles = { /// Style des Polygones représentant les résultats de l'algorithme
  'MultiPolygon': new Style({
    stroke: new Stroke({
      color: 'blue',
      width: 1,
    }),
    fill: new Fill({
      color: 'rgba(0, 0, 255, 0.1)',
    }),
  }),
};




function initialisationListeStyle(){// Définition du style global de la page
  listeStyle=[]
  for (var index = 0; index<8; index++) {
    listeStyle.push({ backgroundColor: 'blue', color: 'white'})
  } 
}

initialisationListeStyle()




var urlNewJson=""
var urlNewPhoto=""

var objetsjson = new GeoJsonObjects();// Instance de la classe GeoJsonObjects, ceci nous permettra de traiter le json résultant de l'algorithme de détection.


//const axios = require('axios').default;
var input=""

var url3=""
var extent2 = [-2.301792816,48.643856759,-2.300487736,48.644560518]
var source_orthophoto = new Static({// Permettra l'affichage de l'ortophoto
  url: url3,
  crossOrigin: '',
  imageExtent: extent2,
  projection: 'EPSG:4326'
});


const buttonClicked=[0,0,0,0,0,0,0]// permet de voir quels bouttons ont été utilisés

function App() {
  //Les useStates permettent ici de mettre à jour les états graphiques
	const [center, setCenter] = useState([-2.301517217085, 48.6436269340762]);//on règle ici les coordonnées de base-94.9065, 38.9884])
	const [zoom, setZoom] = useState(9);
	//const [showLayer1, setShowLayer1] = useState(true);
	//const [showLayer2, setShowLayer2] = useState(true);
  const [showLayers, setShowLayers] = useState(true);
  const [showNumbers,setShowNumbers] = useState(true);
  const [showArea,setShowArea] = useState(true);
  const [showPhoto,setShowPhoto]=useState(true);

  // Les fonctions suivantes sont affiliées aux divers bouttons, et permettent de détailler les actions incombant aux boutons.


  function controlButton_Charger_Photo(){// Fonction permettant le chargement de l'ortophoto

  
		
    var path_ortho = document.getElementById('path').value;// On récupère le fichier linké



    input = traitementTXT(path_ortho)
    console.log(input)
		
		//input = document.getElementById("path_photo");
		if (input != undefined){//Si la photo est bien présente
			
			//input="D:/Cours/Fise_A2/Projet/Code IHm/fresnaye_poches_juillet_2020_decoupe2.tif"
			var data = new FormData();
			data.set("path",input);
			
			

			axios({// On envoie une requête post afin d'envoyer l'orthophoto au back-end
				method: 'post',
				url: 'http://127.0.0.1:5000/api/load',
				data: data,

				//Access-Control-Allow-Origin: *
			})
			.then(function (reponse) {
        console.log(reponse)
        urlNewPhoto=reponse.data.task_link;// On récupère l'URL qui nous permettra de voir l'avancement de la conversion de l'ortophoto en JPEG

        buttonClicked[0]=1
				//On traite la suite une fois la réponse obtenue 
				console.log(reponse);
			})
			.catch(function (erreur) {
				//On traite ici les erreurs éventuellement survenues
				console.log(erreur);
			});

			
    }
    
	else{
		alert("Renseignez un document valide");
	}
		
		
		
  };
  

  function controlButton_afficheOrtophoto(){// affiche l'ortophoto
    if (buttonClicked[0]==1 && buttonClicked[1]==0) {
      axios({// On émet une requête pour voir l'avancement de la conversion en JPEG
			  method: 'get',
			  url: urlNewPhoto,// Url récupéré avant
			  responseType: 'json'
		  })
			.then(function (response) {

				
				
				console.log(response)
				if (response.data==null){// Si la réponse est null c'est que l'algoritjme est en plein calcul
					alert("Conversion en JPEG en cours...")
				}
				else {// Si la détection est finit
					alert("Chargement de l'ortophoto... Vous pourrez recliquer sur le bouton 'Afficher ortophoto' pour afficher l'image'")
					console.log(response.data)
          var jsonPhoto=response.data;// On récupère la réponse de l'algorithme de conversion qui est un Json qui renseigne les informations du fichier JPEG de la photo
          //jsonPhoto["image_url"]
          buttonClicked[1]=1;


          source_orthophoto = new Static({
            url: jsonPhoto["image_url"],// On récupère son chemin d'accès
            crossOrigin: '',
            imageExtent: jsonPhoto["infos"]["extent"],// On  récupère sa zone d'action
            projection: jsonPhoto["infos"]["projection"]// On récupère sa projection géographique
          });
          
          
					setShowPhoto(false);// On désactive l'affichage des vecteurs actuels afin qu'ils se mettent à jour
				}



			});
      
    
    }
    else if (buttonClicked[1]==1){
      setShowPhoto(true);

    }
    else {
      alert("Charger une ortophoto")
    }
  }






	function controlButton_lancer_detec(typeObject){// Permet de lancer la détection de bouchots ou de pôches d'huîtres
		
		if (buttonClicked[1]==1){// On vérifie que l'utilisateur a bien renseigné une image
      
      var coords = extentChange() // On récupère les dimensions du rectangle de sélection.
      console.log("json var coords : ",coords)
      if (coords.valid=="false"){// Si les coordonnées sont vides
        alert("Sélectionnez un rectangle")
        //console.log("Sélectionnez un rectangle")

      }
      else {
        //On construit ici l'instruction que nous donnerons au back-end : on lui renseigne les coordonnées de la détection ainsi que que le type d'objets étudié
        let url='http://127.0.0.1:5000/api/detection?image_id=0&minLon='+coords.lonMin.toString()+"&maxLon="+coords.lonMax.toString()+"&minLat="+coords.latMin.toString()+"&maxLat="+coords.latMax.toString()+"&type="+typeObject
        console.log(url)
        axios({// On émet une requête
          method: 'get',
          url: url,
          //'http://127.0.0.1:5000/api/detection?image_id=0&minLon=-2.302&maxLon=-2.3015&minLat=48.6440&maxLat=48.6445&type=bouchot'
          responseType: 'json'
          })
          .then(function (response) {// Si la requête a bien functionné :
            console.log(response.data)
            urlNewJson=response.data.task_link;// On récupère la nouvelle adresse où nous pourrons voir l'avancement de la détection
            buttonClicked[1]=0;// On désactive la possibilité de relancer l'algo pour ne pas surcharger le backend
            buttonClicked[2]=1;// On précise que l'algorithme a été lancé
          });  
          console.log(urlNewJson)
        }
      }
    else {
      alert("Afficher une ortophoto")
      //console.log("Chargez une image")
    }
  };
  


	function controlButton_Afficher_resultats(){//Ici on vient récupérer les résultats de l'algorithme de détection

    if (buttonClicked[2]==1){// Si On a bien lancé la détection

      console.log(urlNewJson)
		  axios({// On émet une requête pour voir l'avancement de la détection
			  method: 'get',
			  url: urlNewJson,// 
			  responseType: 'json'
		  })
			.then(function (response) {

				
				
				console.log(response)
				if (response.data==null){// Si la réponse est null c'est que l'algoritjme est en plein calcul
					alert("Calcul en cours...")
				}
				else {// Si la détection est finit
					alert("Chargement du Résultat... Vous pourrez cliquer sur le bouton 'Mettre à jour graphiquement' pour afficher les résultats")
					console.log(response.data)
          var polygs=response.data;// On récupère la réponse de l'algorithme de détection qui est un Json
          objetsjson.setJson(polygs)// On enregistre dans notre instance de geoObjectsJson les résultat de l'algorithme de détection
          
					setShowLayers(false);// On désactive l'affichage des vecteurs actuels afin qu'ils se mettent à jour
				}



			});
		//de meme qu'avant

    }
    else{
      alert("Veuillez d'abord lancer une détection")
    }
		
		
	};
	
	function controlButton_afficher_res_json(){// On reactive l'affichage des vecteurs afin qu'ils se mettent à jour
		setShowLayers(true)
		
		
  };
  

  function controlButton_afficher_json_temp(){// Fonction utile en développement pour afficher rapidement le résultat de l'algo de détection
    objetsjson.obtainjson()

    setShowLayers(false)
  }
  function controlButton_suppr(){//Boutton de suppression d'un polygone
    //console.log(selectChange())
    objetsjson.suppression_polygs(selectChange())// On supprime les polygones sélectionnés

    
    setShowLayers(false)

  }


  function controlButton_fusion(){// Boutton de fusion de polygones.
    var fusion_idx = selectChange()
    if (fusion_idx.length>1){//Si il y a au moins 2 polygones à fusionner
      objetsjson.fusion_polyg(fusion_idx)
      setShowLayers(false)

    }
    
	
  }
  function controlButton_retour(){// Fonction permettant d'annuler la suppression d'un polygone

    objetsjson.retourArriere()//
    setShowLayers(false)

  }
  function controlButton_Ajout(typeObject){// fonction devant permettre d'ajouter des polygones


  }
  function controlButton_Mesure_Surface(list_idx){//Fonction permettant de mesurer la surface de polygones.
    alert(objetsjson.mesureSurface(list_idx))


    
  }
  

  // Ensuite vient la fonction de rendu Graphique : 
    return (
      
        <Container fluid>
          <Row >
        <Col xs={2}>
          <Table striped bordered condensed hover >
            <thead>
              <tr>
                <th>Fonctions</th>
              

              </tr>
            </thead>
            <tbody>
            <tr>
              <div>
              <form>
                <div class="form-group">
                  <label >Chemin d'accès :</label>
                  <input type="text" class="form-control" id="path" placeholder="Ex : C:\Documents\mon_ortophoto.tif"/>
                  
                  
                </div>
              </form>
              </div>
              </tr>


            
       
        
        
              <tr>
                
              <ButtonGroup  vertical size='sm' color="#B8B8B8"> 

              <Button variant='outline-dark' onClick={(e) => controlButton_Charger_Photo()}>Charger ortophoto</Button>
              <Button variant='outline-dark' onClick={(e) => controlButton_afficheOrtophoto()}>Afficher l'Ortophoto</Button>
              <Button variant='outline-dark' onClick={(e) => controlButton_lancer_detec("bouchot")}>Lancer détection bouchots</Button>
              <Button variant='outline-dark' onClick={(e) => controlButton_lancer_detec("oyster_pocket")}>Lancer détection poche d'huîtres</Button>
			        <Button variant='outline-dark' onClick={(e) => controlButton_Afficher_resultats()}>Afficher les résultats de l'algorithme</Button>
              <Button variant='outline-dark' onClick={(e) => controlButton_afficher_res_json()}>Mettre à jour graphiquement</Button>
              {
              //<Button variant='outline-dark' onClick={(e) => controlButton_afficher_json_temp()}>TEMP - Afficher Json de base</Button>
              }
              
              </ButtonGroup>
              



              </tr>

            </tbody>
            
            </Table>
            <Table striped bordered condensed hover>
            <thead>
              <tr>
                <th>Modification du résultat</th>
              

              </tr>
            </thead>
            <tbody>
            

              <tr>
              <ButtonGroup  vertical size='sm' color="#B8B8B8">
                <Button variant='outline-dark' onClick={(e) => controlButton_suppr()}>Supprimer la selection</Button>

                <Button variant='outline-dark' onClick={(e) => controlButton_retour()}>Annuler la suppression</Button>

                <Button variant='outline-dark' onClick={(e) => controlButton_fusion()}>Fusionner la sélection</Button>
                
                

                </ButtonGroup>
              </tr>
              
              

            </tbody>
            </Table>
            <Row>
            Compte des bouchots : {showNumbers && objetsjson.getSizeList()[0]}
            </Row>
            <Row>
            Compte des pôches d'huitres : {showNumbers && objetsjson.getSizeList()[1] }

            </Row>




              {
            //<Table striped bordered condensed hover>
            //<thead>
              //<tr>
              //  <th>Traitement des Bouchots</th>
             // </tr>
           // </thead>
         //   <tbody>
            //</tbody>  <tr>
              //  <ButtonGroup  vertical size='sm' color="#B8B8B8">
              //</ButtonGroup>  <Button variant='outline-dark' onClick={(e) => controlButton_Ajout("bouchot")}>NF Ajout</Button>
                //  <Button variant='outline-dark' onClick={(e) => console.log(1)}>NF Mesure Longueur</Button>
                //  {
              //   // <Button variant='outline-dark' onClick={(e) => console.log(1)}>!NF Detection de ligne</Button>
              //  }
             // </ButtonGroup>
              //  </tr>
              // </tbody>
           // </Table>
            }
            <Table striped bordered condensed hover>
              
            <thead>
              <tr>
                <th>Traitement des poches d'Huîtres</th>
              </tr>
            </thead>
            <tbody>
              <tr>
              <ButtonGroup  vertical size='sm' color="#B8B8B8">
                {
                  //<Button variant='outline-dark' onClick={(e) => controlButton_Ajout("oyster_pocket")}>NF Ajout</Button>
                }
                
                <Button variant='outline-dark' onClick={(e) => controlButton_Mesure_Surface(selectChange())}>Mesurer Surface de la sélection</Button>
                <Button variant='outline-dark' onClick={(e) => controlButton_Mesure_Surface(["all"])}>Mesurer la Surface totale</Button>

                {
                //<Button variant='outline-dark' onClick={(e) => console.log(1)}>!NF Charger Couches : cadastre</Button>
                }
                </ButtonGroup>
              </tr>
              
              

            </tbody>
            </Table>
          </Col>

          <Col xs={9} fluid>

          <div>
            <Map center={fromLonLat(center)} zoom={zoom}  id="Map">
              <Layers>
                <TileLayer
                  source={osm()}
                  zIndex={0}
                />

                {showPhoto && <ImageLayer
                  source={source_orthophoto}
                />}


                
				{showLayers   &&(
                  <VectorLayer
                    source={vector({ features: new GeoJSON().readFeatures(objetsjson.getjson(), { featureProjection: get('EPSG:3857') }) })}
                    style={styles.MultiPolygon}
                  />
				)
				}
	
			


              </Layers>
              <Controls>
                <FullScreenControl />
              </Controls>
            </Map>
            

			    <div>
              <input
                type="checkbox"
                checked={showLayers}
                onChange={event => setShowLayers(event.target.checked)}
              /> Afficher/Masquer les résultats de l'algorithme de détection </div>


          </div>

            



          <Row>
            Vous pouvez vous déplacer sur la carte en maintenant le clic gauche, et la molette vous aide à zoomer/dezoomer.

          </Row>


          <Row>
          
            Afin de sélectionner la zone où vous désirez réaliser la détection, maintenez la touche "Alt" puis maintenez le clic gauche de votre souris.
          
          </Row>
          
          <Row>
            Afin de sélectionner les images générées par l'algorithme, cliquez dessus. Appuyer sur "Ctrl" + Clic gauche ajoutera un polygone à votre sélection.
          </Row>
		    
          </Col>
          
          
          
          </Row>
        </Container>
    
    )

  }




export default App;




