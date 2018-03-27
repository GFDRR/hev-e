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


def get_ewkt_from_bbox(x0, y0, x1, y1, srid):
    return (
        "SRID={srid};"
        "POLYGON(("
        "{x0} {y0}, "
        "{x0} {y1}, "
        "{x1} {y1}, "
        "{x1} {y0}, "
        "{x0} {y0}"
        "))".format(srid=srid, x0=x0, y0=y0, x1=x1, y1=y1))


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
