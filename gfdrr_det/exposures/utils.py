# -*- coding: utf-8 -*-
#########################################################################
#
# Copyright 2018, GeoSolutions Sas.
# All rights reserved.
#
# This source code is licensed under the BSD-style license found in the
# LICENSE file in the root directory of this source tree.
#
#########################################################################

from collections import namedtuple
import re
from decimal import Decimal

from django.conf import settings
from django.db import connections
import shlex
import subprocess


def get_ewkt_from_geonode_bbox(geonode_bbox):
    """Return an EWKT representation from a geonode layer bbox

    This function is suitable for translating between geonode layer's ``bbox``
    attribute and EWKT.

    """

    return get_ewkt_from_bbox(
        x0=geonode_bbox[0],
        y0=geonode_bbox[2],
        x1=geonode_bbox[1],
        y1=geonode_bbox[3],
        srid=geonode_bbox[4].split(":")[-1]
    )


def get_ewkt_from_bbox(x0, y0, x1, y1, srid=4326):
    return (
        "SRID={srid};"
        "POLYGON(("
        "{x0} {y0}, "
        "{x0} {y1}, "
        "{x1} {y1}, "
        "{x1} {y0}, "
        "{x0} {y0}"
        "))".format(srid=srid, x0=x0, y0=y0, x1=x1, y1=y1))


def get_geonode_bbox_from_ewkt(ewkt):
    srid = ewkt.replace("SRID=", "").partition(";")[0]
    coords = ewkt.partition(
        "((")[-1].replace("))", "").replace(",", "").split()
    return [
        Decimal(coords[0]),  # x0
        Decimal(coords[4]),  # x1
        Decimal(coords[1]),  # y0
        Decimal(coords[3]),  # y1
        "EPSG:{}".format(srid)
    ]


def execute_taxonomic_counts_query(db_cursor, qualified_layer_name):
    query = """
            SELECT COUNT(1) AS count, parsed_taxonomy AS taxonomy
            FROM {layer} 
            GROUP BY parsed_taxonomy
        """.format(layer=qualified_layer_name)
    db_cursor.execute(query)


def execute_taxonomic_counts_bbox_query(db_cursor, qualified_layer_name,
                                        bbox_ewkt, geometry_column="geom"):
    query = """
        SELECT COUNT(1) AS count, parsed_taxonomy AS taxonomy
        FROM {layer} 
        WHERE ST_Intersects(
            {geom_column}, 
            ST_GeomFromEWKT('{bbox}')
        )
        GROUP BY parsed_taxonomy
    """.format(
        layer=qualified_layer_name,
        geom_column=geometry_column,
        bbox=bbox_ewkt,
    )
    db_cursor.execute(query)


def get_mapped_category(model_category):
    """Map the exposure model category to the naming used in HEV-E"""
    mapping = settings.HEV_E["EXPOSURES"]["category_mappings"]
    for hev_e_category, maps in mapping.items():
        if model_category.lower() in maps["exposure_model_categories"]:
            result = hev_e_category
            break
    else:
        raise RuntimeError("Could not determine the HEV-E category to map "
                           "with {!r}".format(model_category))
    return result


def get_mapped_area_type(model_area_type):
    """Map the exposure model category to the naming used in HEV-E"""
    mapping = settings.HEV_E["EXPOSURES"]["area_type_mappings"]
    for hev_e_area_type, aliases in mapping.items():
        if model_area_type.lower() in aliases:
            result = hev_e_area_type
            break
    else:
        raise RuntimeError("Could not determine the HEV-E area type to map "
                           "with {!r}".format(model_area_type))
    return result


def get_mapped_taxonomy_source(model_source):
    """Map the taxonomy source of a model"""
    mapping = settings.HEV_E["EXPOSURES"]["taxonomy_mappings"][
        "taxonomy_sources"]
    for hev_e_taxonomy_type, aliases in mapping.items():
        if model_source.lower() in aliases:
            result = hev_e_taxonomy_type
            break
    else:
        raise RuntimeError("Could not determine the HEV-E taxonomy type to "
                           "map with {!r}".format(model_source))
    return result


def calculate_taxonomic_counts(db_cursor, layer_name, taxonomy_source,
                               bbox_ewkt=None, schema_name="exposures",
                               geometry_column="geom"):
    qualified_name = "{}.{}".format(schema_name, layer_name)
    if bbox_ewkt is None:
        execute_taxonomic_counts_query(db_cursor, qualified_name)
    else:
        execute_taxonomic_counts_bbox_query(
            db_cursor, qualified_name, bbox_ewkt,
            geometry_column=geometry_column
        )
    ResTuple = namedtuple("ResTuple", [c[0] for c in db_cursor.description])
    counts = [ResTuple(*row) for row in db_cursor.fetchall()]
    try:
        mapped_source = get_mapped_taxonomy_source(taxonomy_source)
    except (RuntimeError, AttributeError):
        mapped_source = "GEM"
    categories = settings.HEV_E["EXPOSURES"]["taxonomy_mappings"][
        mapped_source].keys()
    result = {}
    for category in categories:
        regex_pattern = re.compile(r"{}:(\w+)#".format(category))
        category_counts = result.setdefault(category, {})
        for combination in counts:
            category_re_obj = regex_pattern.search(combination.taxonomy)
            if category_re_obj is not None:
                category = category_re_obj.group(1)
                category_counts.setdefault(category, 0)
                category_counts[category] += combination.count
    return result


def get_bbox_for_filename(bbox, coord_separator="_"):
    x0, x1, y0, y1 = bbox
    coords = [
        "{0}{1:3.4f}".format("E" if x0 < 0 else "W", abs(x0)),
        "{0}{1:3.4f}".format("S" if y0 < 0 else "N", abs(y0)),
        "{0}{1:3.4f}".format("E" if x1 < 0 else "W", abs(x1)),
        "{0}{1:3.4f}".format("S" if y1 < 0 else "N", abs(y1)),
    ]
    return coord_separator.join(coords)


def generate_geopackage_download_name(layer_name, bbox=None):
    if bbox is None:
        result = "{}.gpkg".format(layer_name)
    else:
        result = "{name}_{bbox}.gpkg".format(
            name=layer_name,
            bbox=get_bbox_for_filename(bbox)
        )
    return result


def prepare_layer_geopackage_download(qualified_layer_name, target_path,
                                      bbox_ewkt=None, geom_column="geom"):
    """Generates a GeoPackage file from one of the database layers"""
    if bbox_ewkt is None:
        where_clause = ""
    else:
        where_clause = (
            "-where \"ST_Intersects({geom}, "
            "ST_GeomFromEWKT('{bbox}'))\"".format(geom=geom_column,
                                                  bbox=bbox_ewkt)
        )
    connection_params = connections["hev_e"].get_connection_params()
    db_connection_string = (
        'PG:"dbname={database} host={host} port={port} user={user} '
        'password={password}"'.format(**connection_params)
    )
    command_str = (
        "ogr2ogr -gt unlimited -f GPKG {where} "
        "{output} {db} {layer}".format(where=where_clause,
                                       output=target_path,
                                       db=db_connection_string,
                                       layer=qualified_layer_name)
    )
    process = subprocess.Popen(
        shlex.split(command_str),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    stdout, stderr = process.communicate()
    return process.returncode, stdout, stderr
