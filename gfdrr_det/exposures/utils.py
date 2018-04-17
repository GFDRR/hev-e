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

from django.conf import settings
from django.db import connections
import shlex
import subprocess


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
    mapping = settings.HEV_E["EXPOSURES"]["taxonomy_mappings"]["sources"]
    for hev_e_taxonomy_type, aliases in mapping.items():
        if model_source.lower() in aliases:
            result = hev_e_taxonomy_type
            break
    else:
        raise RuntimeError("Could not determine the HEV-E taxonomy type to "
                           "map with {!r}".format(model_source))
    return result


def calculate_taxonomic_counts(db_cursor, layer_name, bbox_ewkt=None,
                               schema_name="exposures",
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
    categories = settings.HEV_E["EXPOSURES"]["taxonomy_mappings"][
        "mapping"].keys()
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

