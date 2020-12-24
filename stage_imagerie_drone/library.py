"""
Ce fichier sert à interagir avec la librairie stage_imagerie_drone
"""
from .mask_rcnn.predict_orthoTiles import predict_orthoTiles
from .ortho_utils.raster2tiles import raster2tiles
import os
import tempfile
import json

weights_path = os.path.abspath("model")
model_name = {
    "bouchot": "mask_rcnn_bouchot.h5",
    "oyster_pocket": "mask_rcnn_oyster_pocket.h5"
}

def run_computation(object_type, raster_path, bounds):
    """
    Lance la détection sur une image dans un rectangle donné
    Paramètres:
        - object_type : une clé de model_name, bouchot ou oyster_pocket
        - raster_path : chemin vers l'image raster
        - bounds : rectangle limite où lancer les calculs
    Renvoie: sortie de predict_orthoTiles
    """
    temp_dir = tempfile.TemporaryDirectory(dir="tmp")
    tiles_dir = os.path.join(temp_dir.name, "tiles")
    predict_dir = os.path.join(temp_dir.name, "predict_dir")
    os.mkdir(tiles_dir)
    os.mkdir(predict_dir)
    raster2tiles(raster_path, tiles_dir, 512, 512, False, bounds=bounds)
    json_path = predict_orthoTiles(
        temp_dir.name,
        os.path.basename(tiles_dir),
        os.path.basename(predict_dir),
        "json_export.geojson",
        os.path.join(weights_path, model_name[object_type]),
        object_type,
        512
    )
    with open(json_path) as f:
        dict_res = json.load(f)
    return dict_res
    

