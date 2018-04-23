#########################################################################
#
# Copyright 2018, GeoSolutions Sas.
# All rights reserved.
#
# This source code is licensed under the BSD-style license found in the
# LICENSE file in the root directory of this source tree.
#
#########################################################################

"""Utilities for the preparation of downloadable files from exposures"""

import logging
import shutil
from urlparse import urlparse

from django.conf import settings
from pathlib2 import Path
import requests

from ..models import HeveDetails
from .. import utils as general_utils

logger = logging.getLogger(__name__)  # pylint: disable=invalid-name


def prepare_exposure_item(layer_name, batch_data=None,
                          bbox=None, format_=None,
                          exposureTaxonomicCategory=None,
                          **kwargs):  # pylint: disable=invalid-name,unused-argument
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


def get_exposure_shapefile_item(layer_name, batch_data=None,
                                bbox_ewkt=None, taxonomic_categories=None):
    """Use geonode's API to get a shapefile from the input layer"""
    file_hash = general_utils.get_layer_hash(
        layer_name,
        bbox_ewkt=bbox_ewkt,
        taxonomic_categories=taxonomic_categories
    )
    target_dir = Path(batch_data["target_dir"])
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
    if cql_conditions:
        params["cql_filter"] = " AND ".join(cql_conditions)
    logger.debug("request params: %s", params)
    response = requests.get(
        "{}wfs".format(settings.OGC_SERVER["default"]["PUBLIC_LOCATION"]),
        params=params,
        stream=True
    )
    response.raise_for_status()
    if "xml" in response.headers.get("Content-Type"):  # there was an error
        raise RuntimeError("Could not get shapefile from "
                           "geoserver: {}".format(response.content))
    with open(target_path, "wb") as file_handler:
        response.raw.decode_content = True
        shutil.copyfileobj(response.raw, file_handler)


def get_exposure_geopackage_item(layer_name, batch_data=None, bbox_ewkt=None,
                                 taxonomic_categories=None):
    heve_details = HeveDetails.objects.get(layer__name=layer_name)  # pylint: disable=no-member
    if batch_data[heve_details.dataset_type].get("geopackage_exists"):
        pass
    else:
        generate_geopackage(
            layer_name,
            batch_data[heve_details.dataset_type]["geopackage_target_path"],
            bbox_ewkt=bbox_ewkt,
            taxonomic_categories=taxonomic_categories
        )
    return urlparse(
        batch_data[heve_details.dataset_type]["geopackage_target_path"],
        scheme="file"
    ).geturl()


def generate_geopackage(layer_name, target_path,
                        bbox_ewkt=None, taxonomic_categories=None):
    """Use ogr2ogr to generate a geopackage with the original data"""
    kwargs = {
        "layer_name": layer_name,
        "bbox_ewkt": bbox_ewkt,
        "categories": taxonomic_categories,
    }
    query_handlers = {
        "exposure_model": _prepare_exposure_model_query,
        "asset": _prepare_asset_query,
        "contribution": _prepare_contribution_query,
        "model_cost_type": _prepare_model_cost_type_query,
        "cost": _prepare_cost_query,
        "occupancy": _prepare_occupancy_query,
        "tags": _prepare_tags_query,
    }
    for table_name, query_handler in query_handlers.items():
        query = query_handler(**kwargs)
        command_str = general_utils.prepare_ogr2ogr_command(
            query, target_path, table_name)
        return_code, stderr = general_utils.run_process(command_str)[::2]
        if return_code != 0:
            raise RuntimeError(
                "Could not generate GeoPackage file: {}".format(stderr))


def _prepare_exposure_model_query(layer_name, **kwargs):  # pylint: disable=unused-argument
    return (
        "SELECT * "
        "FROM exposures.exposure_model "
        "WHERE id = {}".format(layer_name.split("_")[-1])

    )


def _prepare_contribution_query(layer_name, **kwargs):  # pylint: disable=unused-argument
    return (
        "SELECT * "
        "FROM exposures.contribution "
        "WHERE exposure_model_id = {}".format(layer_name.split("_")[-1])
    )


def _prepare_model_cost_type_query(layer_name, **kwargs):  # pylint: disable=unused-argument
    return (
        "SELECT * "
        "FROM exposures.model_cost_type "
        "WHERE exposure_model_id = {}".format(layer_name.split("_")[-1])
    )


def _prepare_asset_query(layer_name, bbox_ewkt=None, categories=None):
    return (
        "SELECT a.* "
        "FROM exposures.asset AS a "
        "INNER JOIN exposures.{view_layer} AS v ON (a.id = v.id) "
        "WHERE a.id = v.id{intersection}{categories}".format(
            view_layer=layer_name,
            intersection=_get_intersection_clause(
                bbox_ewkt) if bbox_ewkt else "",
            categories=_get_categories_clause(categories) if categories else ""
        )
    )


def _prepare_cost_query(layer_name, bbox_ewkt=None, categories=None):
    return (
        "SELECT c.* "
        "FROM exposures.cost AS c "
        "INNER JOIN exposures.asset AS a ON (c.asset_id = a.id) "
        "INNER JOIN exposures.{view_layer} AS v ON a.id = v.id "
        "WHERE c.asset_id = v.id{intersection}{categories}".format(
            view_layer=layer_name,
            intersection=_get_intersection_clause(
                bbox_ewkt) if bbox_ewkt else "",
            categories=_get_categories_clause(categories) if categories else ""
        )
    )


def _prepare_occupancy_query(layer_name, bbox_ewkt=None, categories=None):
    return (
        "SELECT occ.* "
        "FROM exposures.occupancy AS occ "
        "INNER JOIN exposures.asset AS a ON (occ.asset_id = a.id) "
        "INNER JOIN exposures.{view_layer} AS v ON (a.id = v.id) "
        "WHERE occ.asset_id = v.id{intersection}{categories}".format(
            view_layer=layer_name,
            intersection=_get_intersection_clause(
                bbox_ewkt) if bbox_ewkt else "",
            categories=_get_categories_clause(categories) if categories else ""
        )
    )


def _prepare_tags_query(layer_name, bbox_ewkt=None, categories=None):
    return (
        "SELECT t.* "
        "FROM exposures.tags AS t "
        "JOIN exposures.asset AS a ON (t.asset_id = a.id) "
        "INNER JOIN exposures.{view_layer} AS v ON (a.id = v.id) "
        "WHERE t.asset_id = v.id{intersection}{categories}".format(
            view_layer=layer_name,
            intersection=_get_intersection_clause(
                bbox_ewkt) if bbox_ewkt else "",
            categories=_get_categories_clause(categories) if categories else ""
        )
    )


def _get_intersection_clause(bbox_ewkt):
    return (
        " AND ST_Intersects("
        "a.the_geom, ST_GeomFromEWKT('{}'))".format(bbox_ewkt)
    )

def _get_categories_clause(categories):
    parts = ["v.parsed_taxonomy LIKE '%{}%'".format(c) for c in categories]
    categories_clause = " OR ".join(parts)
    return " AND ({})".format(categories_clause)
