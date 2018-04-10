#########################################################################
#
# Copyright 2018, GeoSolutions Sas.
# All rights reserved.
#
# This source code is licensed under the BSD-style license found in the
# LICENSE file in the root directory of this source tree.
#
#########################################################################

import hashlib
import logging
import shlex
import shutil
import subprocess
from urlparse import urlparse

from django.db import connections
from django.conf import settings
from pathlib2 import Path
import requests

from .. import utils as general_utils

logger = logging.getLogger(__name__)


def prepare_exposure_item(layer_name, batch_data=None,
                          bbox=None, format_=None,
                          exposureTaxonomicCategory=None, **kwargs):
    if bbox is not None:
        parsed_bbox = general_utils.serialize_bbox_option(bbox)
        bbox_ewkt = general_utils.get_ewkt_from_bbox(srid=4326, **parsed_bbox)
    else:
        bbox_ewkt = None
    format_handler = {
        "shapefile": get_exposure_shapefile_item,
        "geopackage": get_exposure_geopackage_item
    }[format_]
    return format_handler(
        layer_name,
        batch_data=batch_data,
        bbox_ewkt=bbox_ewkt,
        taxonomic_categories=exposureTaxonomicCategory
    )


def get_layer_hash(name, bbox_ewkt=None, taxonomic_categories=None):
    hash_contents = [
        name,
        bbox_ewkt if bbox_ewkt else "",
    ] + (
        list(taxonomic_categories) if taxonomic_categories is not None else [])
    return hashlib.md5("".join(sorted(hash_contents))).hexdigest()


def get_exposure_shapefile_item(layer_name, batch_data=None,
                                bbox_ewkt=None, taxonomic_categories=None):
    """Use geonode's API to get a shapefile from the input layer"""
    file_hash = get_layer_hash(layer_name, bbox_ewkt=bbox_ewkt,
                               taxonomic_categories=taxonomic_categories)
    target_dir = Path(settings.HEV_E["general"]["downloads_dir"])
    target_path = target_dir / "{}.zip".format(file_hash)
    if not target_path.is_file():
        logger.debug("generating a new shapefile...")
        layer_name_stripped_type = layer_name.rpartition(":")[-1]
        generate_shapefile(
            layer_name_stripped_type,
            str(target_path),
            bbox_wkt=bbox_ewkt.partition(";")[-1] if bbox_ewkt else None,
            taxonomic_categories=taxonomic_categories
        )
    return urlparse(str(target_path), scheme="file").geturl()


def generate_shapefile(layer_name, target_path, bbox_wkt=None,
                       taxonomic_categories=None):
    params = {
        "service": "WFS",
        "version": "1.0.0",
        "request": "GetFeature",
        "typename": "hev-e:{}".format(layer_name),
        "outputFormat": "shape-zip",
        "format_options": "charset:UTF-8",
    }
    cql_conditions = []
    if bbox_wkt is not None:
        cql_conditions.append("INTERSECTS(geom, {})".format(bbox_wkt))
    if taxonomic_categories is not None:
        taxonomy_conditions = []
        for cat in taxonomic_categories:
            taxonomy_conditions.append(
                "parsed_taxonomy ILIKE '%{}%'".format(cat))
        taxonomy_condition = "({})".format(" OR ".join(taxonomy_conditions))
        cql_conditions.append(taxonomy_condition)
    if len(cql_conditions) > 0:
        params["cql_filter"] = " AND ".join(cql_conditions)
    logger.debug("request params: {}".format(params))
    response = requests.get(
        "{}wfs".format(settings.OGC_SERVER["default"]["PUBLIC_LOCATION"]),
        params=params,
        stream=True
    )
    response.raise_for_status()
    if "xml" in response.headers.get("Content-Type"):  # there was an error
        raise RuntimeError("Could not get shapefile from "
                           "geoserver: {}".format(response.content))
    with open(target_path, "wb") as fh:
        response.raw.decode_content = True
        shutil.copyfileobj(response.raw, fh)


def get_exposure_geopackage_item(layer_name, batch_data=None, bbox_ewkt=None,
                                 taxonomic_categories=None):
    batch_data = dict(batch_data) if batch_data is not None else {}
    if batch_data.get("geopackage_exists"):
        pass
    else:
        generate_geopackage(
            layer_name,
            batch_data["geopackage_target_path"],
            bbox_ewkt=bbox_ewkt,
            taxonomic_categories=taxonomic_categories
        )
    return urlparse(
        batch_data["geopackage_target_path"], scheme="file").geturl()


def generate_geopackage(layer_name, target_path,
                        bbox_ewkt=None, taxonomic_categories=None):
    """Use ogr2ogr to generate a geopackage with the original data"""
    connection_params = connections["hev_e"].get_connection_params()
    kwargs = {
        "target_path": target_path,
        "model_id": layer_name.split("_")[-1],
        "command_pattern": "ogr2ogr -gt unlimited -f GPKG -append "
                           "-sql \"{query}\" {target_path} {db} -nln {name}",
        "db_connection_string": 'PG:"dbname={database} host={host} '
                                'port={port} user={user} '
                                'password={password}"'.format(
            **connection_params),
        "bbox_ewkt": bbox_ewkt,
        "taxonomic_categories": taxonomic_categories,
    }
    table_handlers = {
        "exposure_model": _prepare_exposure_model,
        "asset": _prepare_asset,
        "contribution": _prepare_contribution,
        "model_cost_type": _prepare_model_cost_type,
        "cost": _prepare_cost,
        "occupancy": _prepare_occupancy,
        "tags": _prepare_tags,
    }
    for table_name, table_handler in table_handlers.items():
        logger.debug("Preparing table {}...".format(table_name))
        return_code, stdout, stderr = table_handler(**kwargs)
        if return_code != 0:
            raise RuntimeError(
                "Could not generate GeoPackage file: {}".format(stderr))


def _prepare_exposure_model(target_path, model_id, command_pattern,
                            db_connection_string, **kwargs):
    process = subprocess.Popen(
        shlex.split(
            command_pattern.format(
                query="SELECT * FROM exposures.exposure_model "
                      "WHERE id = {}".format(model_id),
                target_path=target_path,
                db=db_connection_string,
                name="exposure_model"
            )
        ),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    stdout, stderr = process.communicate()
    return process.returncode, stdout, stderr


def _prepare_contribution(target_path, model_id, command_pattern,
                          db_connection_string, **kwargs):
    process = subprocess.Popen(
        shlex.split(
            command_pattern.format(
                query="SELECT * FROM exposures.contribution "
                      "WHERE exposure_model_id = {}".format(model_id),
                target_path=target_path,
                db=db_connection_string,
                name="contribution"
            )
        ),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    stdout, stderr = process.communicate()
    return process.returncode, stdout, stderr


def _prepare_model_cost_type(target_path, model_id, command_pattern,
                             db_connection_string, **kwargs):
    process = subprocess.Popen(
        shlex.split(
            command_pattern.format(
                query="SELECT * FROM exposures.model_cost_type "
                      "WHERE exposure_model_id = {}".format(model_id),
                target_path=target_path,
                db=db_connection_string,
                name="model_cost_type"
            )
        ),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    stdout, stderr = process.communicate()
    return process.returncode, stdout, stderr


# TODO: Integrate the taxonomic_categories parameter
def _prepare_asset(target_path, model_id, command_pattern,
                   db_connection_string, bbox_ewkt=None,
                   taxonomic_categories=None):
    if bbox_ewkt is None:
        intersection_clause = ""
    else:
        intersection_clause = (
            " AND ST_Intersects("
            "the_geom, ST_GeomFromEWKT('{}'))".format(bbox_ewkt)
        )

    process = subprocess.Popen(
        shlex.split(
            command_pattern.format(
                query="SELECT * FROM exposures.asset "
                      "WHERE exposure_model_id = {id}{intersection}".format(
                    id=model_id,
                    intersection=intersection_clause
                ),
                target_path=target_path,
                db=db_connection_string,
                name="asset"
            )
        ),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    stdout, stderr = process.communicate()
    return process.returncode, stdout, stderr


# TODO: Integrate the bbox parameter
# TODO: Integrate the taxonomic_categories parameter
def _prepare_cost(target_path, model_id, command_pattern,
                  db_connection_string, **kwargs):
    process = subprocess.Popen(
        shlex.split(
            command_pattern.format(
                query="SELECT c.* FROM exposures.cost AS c "
                      "JOIN exposures.asset AS a ON (c.asset_id = a.id) "
                      "JOIN exposures.exposure_model AS m ON (a.exposure_model_id = m.id) "
                      "WHERE m.id = {}".format(model_id),
                target_path=target_path,
                db=db_connection_string,
                name="cost"
            )
        ),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    stdout, stderr = process.communicate()
    return process.returncode, stdout, stderr


# TODO: Integrate the bbox parameter
# TODO: Integrate the taxonomic_categories parameter
def _prepare_occupancy(target_path, model_id, command_pattern,
                       db_connection_string, **kwargs):
    process = subprocess.Popen(
        shlex.split(
            command_pattern.format(
                query="SELECT occ.* FROM exposures.occupancy AS occ "
                      "JOIN exposures.asset AS a ON (occ.asset_id = a.id) "
                      "JOIN exposures.exposure_model AS m ON (a.exposure_model_id = m.id) "
                      "WHERE m.id = {}".format(model_id),
                target_path=target_path,
                db=db_connection_string,
                name="occupancy"
            )
        ),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    stdout, stderr = process.communicate()
    return process.returncode, stdout, stderr


# TODO: Integrate the bbox parameter
# TODO: Integrate the taxonomic_categories parameter
def _prepare_tags(target_path, model_id, command_pattern,
                  db_connection_string, **kwargs):
    process = subprocess.Popen(
        shlex.split(
            command_pattern.format(
                query="SELECT t.* FROM exposures.tags AS t "
                      "JOIN exposures.asset AS a ON (t.asset_id = a.id) "
                      "JOIN exposures.exposure_model AS m ON (a.exposure_model_id = m.id) "
                      "WHERE m.id = {}".format(model_id),
                target_path=target_path,
                db=db_connection_string,
                name="tags"
            )
        ),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    stdout, stderr = process.communicate()
    return process.returncode, stdout, stderr


