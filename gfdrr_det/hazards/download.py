#########################################################################
#
# Copyright 2018, GeoSolutions Sas.
# All rights reserved.
#
# This source code is licensed under the BSD-style license found in the
# LICENSE file in the root directory of this source tree.
#
#########################################################################

"""Utilities for the preparation of downloadable files from hazards."""

import logging
from urlparse import urlparse

from pathlib2 import Path

from .. import utils as general_utils
from ..models import HeveDetails

LOGGER = logging.getLogger(__name__)


def prepare_item(layer_name, batch_data=None, bbox=None, format_=None,
                 hazardEventId=None, **kwargs):  # pylint: disable=invalid-name,unused-argument
    LOGGER.debug("inside prepare_item: %s", locals())
    event_ids = [int(i) for i in hazardEventId] if hazardEventId else None
    if bbox is not None:
        parsed_bbox = general_utils.serialize_bbox_option(bbox)
        bbox_ewkt = general_utils.get_ewkt_from_bbox(srid=4326, **parsed_bbox)
    else:
        bbox_ewkt = None
    format_handler = {
        "shapefile": get_shapefile_item,
        "geopackage": get_geopackage_item
    }[format_]
    return format_handler(
        layer_name,
        batch_data=batch_data,
        bbox_ewkt=bbox_ewkt,
        event_ids=event_ids,
    )


def get_shapefile_item(layer_name, batch_data=None, bbox_ewkt=None,
                       event_ids=None):
    """Use geonode's API to get a shapefile from the input layer"""
    file_hash = general_utils.get_layer_hash(
        layer_name,
        bbox_ewkt=bbox_ewkt,
        event_ids=event_ids,
    )
    target_dir = Path(batch_data["target_dir"])
    target_path = target_dir / "{}.zip".format(file_hash)
    LOGGER.debug("shapefile target_path: %s", target_path)
    if not target_path.is_file():
        LOGGER.debug("generating a new shapefile...")
        layer_name_stripped_type = layer_name.rpartition(":")[-1]
        generate_shapefile(
            layer_name_stripped_type,
            str(target_path),
            bbox_wkt=bbox_ewkt.partition(";")[-1] if bbox_ewkt else None,
            event_ids=event_ids
        )
    return urlparse(str(target_path), scheme="file").geturl()


def generate_shapefile(layer_name, target_path, bbox_wkt=None,
                       event_ids=None):
    cql_conditions = []
    if event_ids is not None:
        items = ["'{}.{}'".format(layer_name, id_) for id_ in event_ids]
        cql_conditions.append("IN({})".format(", ".join(items)))
    return general_utils.generate_shapefile(
        layer_name,
        target_path,
        bbox_wkt=bbox_wkt,
        additional_cql_conditions=cql_conditions
    )


def get_geopackage_item(layer_name, batch_data=None, bbox_ewkt=None,
                        event_ids=None):
    LOGGER.debug("get_geopackage_item called: %s", locals())
    heve_details = HeveDetails.objects.get(layer__name=layer_name)  # pylint: disable=no-member
    if batch_data[heve_details.dataset_type].get("geopackage_exists"):
        pass
    else:
        generate_geopackage(
            heve_details.details["event_set_id"],
            batch_data[heve_details.dataset_type]["geopackage_target_path"],
            bbox_ewkt=bbox_ewkt,
            event_ids=event_ids
        )
    return urlparse(
        batch_data[heve_details.dataset_type]["geopackage_target_path"],
        scheme="file"
    ).geturl()


def generate_geopackage(event_set_id, target_path, bbox_ewkt=None,
                        event_ids=None):
    query_getters = {
        "event_set": get_event_set_query,
        "event": get_event_query,
        "footprint_set": get_footprint_set_query,
        "footprint": get_footprint_query,
        "footprint_data": get_footprint_data_query,
    }
    for table_name, query_getter in query_getters.items():
        query = query_getter(
            event_set_id, bbox_ewkt=bbox_ewkt, event_ids=event_ids)
        command_str = general_utils.prepare_ogr2ogr_command(
            query, target_path, table_name)
        return_code, stderr = general_utils.run_process(command_str)[::2]
        if return_code != 0:
            raise RuntimeError(
                "Could not generate GeoPackage file: {}".format(stderr))


def get_event_set_query(event_set_id, **kwargs):  # pylint: disable=unused-argument
    return "SELECT * FROM hazards.event_set WHERE id = {}".format(event_set_id)


def get_event_query(event_set_id, event_ids=None, **kwargs):  # pylint: disable=unused-argument
    query = (
        "SELECT * "
        "FROM hazards.event "
        "WHERE event_set_id = {}".format(event_set_id)
    )
    return _add_event_ids(query, event_ids, "id") if event_ids else query


def get_footprint_set_query(event_set_id, event_ids=None, **kwargs):  # pylint: disable=unused-argument
    query = (
        "SELECT fps.* "
        "FROM hazards.footprint_set AS fps "
        "JOIN hazards.event AS ev ON (fps.event_id = ev.id) "
        "JOIN hazards.event_set AS evs ON (ev.event_set_id = evs.id) "
        "WHERE evs.id = {}".format(event_set_id)
    )
    return _add_event_ids(query, event_ids, "ev.id") if event_ids else query


def get_footprint_query(event_set_id, event_ids=None, **kwargs):  # pylint: disable=unused-argument
    query = (
        "SELECT fp.* "
        "FROM hazards.footprint AS fp "
        "JOIN hazards.footprint_set AS fps ON (fp.footprint_set_id = fps.id) "
        "JOIN hazards.event AS ev ON (fps.event_id = ev.id) "
        "JOIN hazards.event_set AS evs ON (ev.event_set_id = evs.id) "
        "WHERE evs.id = {}".format(event_set_id)
    )
    return _add_event_ids(query, event_ids, "ev.id") if event_ids else query


def get_footprint_data_query(event_set_id, bbox_ewkt=None, event_ids=None,
                             **kwargs):  # pylint: disable=unused-argument
    query = (
        "SELECT fpd.* "
        "FROM hazards.footprint_data AS fpd "
        "JOIN hazards.footprint AS fp ON (fpd.footprint_id = fp.id) "
        "JOIN hazards.footprint_set AS fps ON (fp.footprint_set_id = fps.id) "
        "JOIN hazards.event AS ev ON (fps.event_id = ev.id) "
        "JOIN hazards.event_set AS evs ON (ev.event_set_id = evs.id) "
        "WHERE evs.id = {}".format(event_set_id)
    )
    if bbox_ewkt is not None:
        query += (
            " AND ST_Intersects("
            "fpd.the_geom, ST_GeomFromEWKT('{}'))".format(bbox_ewkt)
        )
    return _add_event_ids(query, event_ids, "ev.id") if event_ids else query


def _add_event_ids(query, event_ids, column_name):
    new_query = query + (
        " AND {} = ANY('{{{}}}')".format(
            column_name,
            ", ".join([str(i) for i in event_ids])
        )
    )
    return new_query
