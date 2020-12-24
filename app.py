"""
Définit et lance l'appplication flask.
"""
from flask import Flask, request, json, send_file
from flask_cors import CORS, cross_origin
from celery import Celery, states
from stage_imagerie_drone.library import run_computation
import os
import rasterio as rio


app = Flask(__name__)
cors = CORS(app)

# Lien avec redis
app.config['broker_url'] = 'redis://localhost:6379/0'
app.config['result_backend'] = 'redis://localhost:6379/0'

# Lien avec celery
celery = Celery(app.name, broker=app.config['broker_url'])
celery.conf.update(app.config)

# Base de données des images chargées
data = []

def init():
    """
    Créer les dossiers utiles
    """
    if not os.path.exists("tmp"):
        os.mkdir("tmp")
    if not os.path.exists("orthophotos"):
        os.mkdir("orthophotos")
    for root, dirs, files in os.walk("orthophotos"):
        for name in files:
            os.remove(os.path.join(root, name))
        


@app.route("/api/detection", methods=["GET"])
@cross_origin()
def detection():
    """
    Reçoit une requête GET pour lancer une détection sur une image de la base de données
    Paramètres de la requête :
        type, 'bouchot' ou 'oyster_pocket', string
        image, index de l'image, number
        minLon, longitude minimale, number
        maxLon, longitude maximale, number
        minLat, longitude minimale, number
        maxLat, longitude maximale, number
    Renvoie : 
        - le statut de la tâche (PENDING)
        - un lien vers la tâche
    """
    type_detection = request.args.get("type", default="bouchot", type=str)
    image_id = request.args.get("image_id", default=0, type=int)
    minLon = request.args.get("minLon", default=None, type=float)
    maxLon = request.args.get("maxLon", default=None, type=float)
    minLat = request.args.get("minLat", default=None, type=float)
    maxLat = request.args.get("maxLat", default=None, type=float)
    image_path = data[image_id]["image_path_tif"]
    print(minLon, maxLon, minLat, maxLat)
    if minLon and maxLon and minLat and maxLat:
        bounds = minLon, minLat, maxLon, maxLat
    else:
        bounds = None
    task = detection_task.delay(type_detection, image_path, bounds)
    return {
        "task_status": task.state,
        "task_link": request.url_root + "api/check/" + str(task.id)
    }


@celery.task()
def detection_task(type_detection, image_path, bounds):
    '''
    Lance la détection utilisant la librairie stage_imagerie_drone
    Paramètres:
        - type_detection : bouchot' ou 'oyster_pocket'
        - image_path : chemin vers l'orthophoto
        - bounds : zone de détection, tuple (minLon,maxLon,minLat,maxLat)
    '''
    return run_computation(type_detection, image_path, bounds)

@app.route("/api/check/<string:task_id>")
@cross_origin()
def check_task(task_id):
    """
    Reçoit une requête GET /api/get/task_id,
    task_id identifiant une tâche lancée au préalable
    Renvoie le résultat si elle est terminée, son état sinon (PENDING ou FAILED)
    """
    task = celery.AsyncResult(task_id)
    res = task.result
    if task.state == states.SUCCESS: # Si la tâche est terminée
        if "infos" in res.keys(): # Il s'agit d'une tâche de chargements
            data[res["index"]] = res # On met à jour la base de données
        return res
    else:
        return task.state

@app.route("/api/load", methods=["POST"])
@cross_origin()
def load():
    """
    Reçoit une requête POST /api/load avec un paramètre "path" indiquant le chemin vers l'orthophoto
    Lance une tâche de chargement
    Renvoie : 
        - le statut de la tâche (PENDING)
        - un lien vers la tâche
    """
    request_data = request.form
    path = request_data["path"]
    photo_path = os.path.abspath(path)
    data.append({})
    new_index = len(data) - 1
    task = load_task.delay(photo_path, new_index, request.url_root)
    print(data)
    return {
        "task_status": task.state,
        "task_link": request.url_root + "api/check/" + str(task.id)
    }

@celery.task()
def load_task(photo_path, index, url_root):
    """
    Définit la tâche de chargement celery
    Paramètres:
        - photo_path: le chemin vers l'orthophoto
        - index: la position de la photo dans la base de données
        - url_root: 127.0.0.1:5000/
    Renvoie le résultat de la tâche, un dictionnaire contenant:
        - image_url : url de l'image
        - image_path : chemin local vers l'image
        - image_path_tif : chemin local vers l'original
        - infos : informations utiles (projection, extent)
        - index : index dans la base de données
    """
    image_path, infos = convert_to_jpeg(photo_path)
    photo_data = {}
    photo_data["image_url"] = url_root + "api/get/" + str(index)
    photo_data["image_path"] = image_path
    photo_data["image_path_tif"] = photo_path
    photo_data["infos"] = infos
    photo_data["index"] = index
    return photo_data

@app.route("/api/get/<int:photo_id>", methods=["GET"])
@cross_origin()
def get_image(photo_id):
    """
    Reçoit une requête GET avec photo_id, l'index de l'image dans la base de données
    Renvoie l'image demandée
    """
    try:
        print(data)
        path = data[photo_id]['image_path']
        return send_file(path)
    except IndexError:
        return "Image not loaded !"


def convert_to_jpeg(path):
    """
    Convertit une orthophoto en jpeg
    Paramètre: path est le chemin absolu vers l'orthophoto
    Renvoie:
        - jpeg_path: le chemin vers la nouvelle image
        - infos : dictionnaire avec la projection et l'extent de l'orthophoto
    Pour l'instant, EPSG:4326 est la seule projection compatible
    """
    print("Loading " + path)
    with rio.open(path) as infile:
        profile = infile.profile
        
        # change the driver name from GTiff to PNG
        profile['driver'] = 'JPEG'
        print(profile)

        filename = os.path.basename(path).split(".")[0]
        jpeg_path = "orthophotos/" + filename + ".jpeg"
        print(infile.crs, infile.bounds)
        infos = {
            "projection": "EPSG:4326",
            "extent": infile.bounds
        }
        profile["QUALITY"] = 10 # Minimum quality value
    
        with rio.open(jpeg_path, 'w', **profile) as dst:
            for ji, window in infile.block_windows(1):
                print(window)
                dst.write(infile.read(window=window), window=window)
    
    print(jpeg_path, infos)
    return jpeg_path, infos

# Lance l'application flask
if __name__ == "__main__":
    init()
    app.run(debug=True)