#########################################################################
#
# Copyright 2018, GeoSolutions Sas.
# All rights reserved.
#
# This source code is licensed under the BSD-style license found in the
# LICENSE file in the root directory of this source tree.
#
#########################################################################

"""Django management command for integrating the hazards DB"""

from __future__ import print_function
from __future__ import unicode_literals
from collections import namedtuple

from django.db import connections
from django.db import OperationalError
from django.db import ProgrammingError
from django.conf import settings
from django.template.loader import get_template
from django.core.management.base import BaseCommand
from geonode.layers.models import Layer
from geonode.base.models import SpatialRepresentationType
from geonode.base.models import TopicCategory

from gfdrr_det.constants import DatasetType
from gfdrr_det.models import HeveDetails
from . import _utils


class Command(BaseCommand):  # pylint: disable=missing-docstring
    help = "Integrate with the hazards database"

    def add_arguments(self, parser):
        parser.add_argument(
            "-f",
            "--force_view_generation",
            action="store_true"
        )
        parser.add_argument(
            "-i",
            "--event_set_id",
            action="append",
            type=int,
        )

    def handle(self, *args, **options):
        """Handle ingestion of hazard data

        - generate geoserver layers from each view
        - import each geoserver layer into geonode
        - generate a heve_details object for each geonode layer, enhancing it
          with further details

        """

        db_connection = connections["hev_e"]
        db_params = db_connection.get_connection_params()
        view_infos = {}
        with db_connection.cursor() as db_cursor:
            self.stdout.write("Retrieving existing event_sets...")
            existing = get_event_sets(db_cursor)
            self.stdout.write("filtering event_sets...")
            to_process = filter_event_sets(existing, options["event_set_id"])
            for index, event_set in enumerate(to_process):
                self.stdout.write(
                    "--processing event_set {} ({}/{})...".format(
                        event_set.id, index+1, len(to_process))
                )
                view_name = "{type_}_{id}".format(
                    type_=event_set.hazard_type.lower(),
                    id=event_set.id
                )
                process_event_set(
                    db_cursor, event_set, view_name,
                    db_params=db_params,
                    force_view_generation=options["force_view_generation"],
                    logger=self.stdout.write
                )
                self.stdout.write("Retrieving materialized view data...")
                aggregate_info = get_view_aggregate_info(db_cursor, view_name)
                view_infos[event_set.id] = (view_name, aggregate_info)
        _utils.import_layers_to_geonode(
            workspace_name=getattr(
                settings, "GEOSERVER_HEV_E_WORKSPACE", "hev-e"),
            store_name="hazards",
            user_name=_utils.get_user().username,
            stdout=self.stdout,
            stderr=self.stderr
        )
        for event_set in to_process:
            geonode_layer = complete_geonode_layer(
                event_set,
                view_name=view_infos[event_set.id][0]
            )
            get_heve_detail(
                geonode_layer,
                event_set=event_set,
                view_aggregate_info=view_infos[event_set.id][-1]
            )


def process_event_set(db_cursor, event_set, view_name,
                      db_params=None, force_view_generation=False,
                      logger=print):
    qualified_name = "hazards.{}".format(view_name)
    if view_exists(db_cursor, view_name) and not force_view_generation:
        logger("View {} already exists, skipping...".format(view_name))
    else:
        _utils.drop_materialized_view(db_cursor, qualified_name, logger=logger)
        logger("Generating materialized view {}...".format(view_name))
        build_hazard_materialized_view(db_cursor, event_set.id, view_name)
    geoserver_layer = _utils.handle_geoserver_layer(
        view_name,
        store_name="hazards",
        db_params=db_params,
        schema_name="hazards",
        default_style_name="polygon",
        logger=logger
    )
    return geoserver_layer


def complete_geonode_layer(event_set, view_name):
    mapped_category = _utils.get_mapped_category(
        event_set.hazard_type, DatasetType.hazard)
    iso_19115_topic_category = settings.HEV_E["HAZARDS"][
        "category_mappings"][mapped_category]["topic_category"]
    topic_category = TopicCategory.objects.get(
        identifier=iso_19115_topic_category)
    layer = Layer.objects.get(name=view_name)
    layer.title = view_name.replace("_", " ").capitalize()
    layer.abstract = event_set.description
    layer.category = topic_category
    layer.is_approved = True
    layer.spatial_representation_type = SpatialRepresentationType.objects.get(
        identifier="vector")
    keywords = [
        mapped_category,
        DatasetType.hazard.name,
        "HEV-E",
    ]
    for keyword in keywords:
        layer.keywords.add(keyword)
    layer.save()
    return layer


def filter_event_sets(event_set_records, ids_to_process, logger=print):
    if ids_to_process:
        result = [ev for ev in event_set_records if ev.id in ids_to_process]
    else:
        result = event_set_records
    return result


def get_heve_detail(geonode_layer, event_set, view_aggregate_info):
    heve_detail = HeveDetails.objects.get_or_create(layer=geonode_layer)[0]
    heve_detail.dataset_type = DatasetType.hazard.name
    heve_detail.envelope = view_aggregate_info.geom
    heve_detail.details = {
        "event_set_id": event_set.id,
        "geographic_area_name": event_set.geographic_area_name,
        "hazard_type": _utils.get_mapped_category(
            event_set.hazard_type, DatasetType.hazard),
        "creation_date": event_set.creation_date.isoformat(),
        "description": event_set.description,
        "bibliography": event_set.bibliography,
        "average_intensity": view_aggregate_info.average_intensity,
    }
    heve_detail.save()
    return heve_detail


def view_exists(db_cursor, view_name):
    try:
        db_cursor.execute(
            "SELECT * FROM hazards.{} LIMIT 1".format(view_name)
        )
    except (ProgrammingError, OperationalError):
        result = False
    else:
        result = True
    return result


def build_hazard_materialized_view(db_cursor, event_set_id, view_name,
                                   logger=print):
    qualified_name = "hazards.{}".format(view_name)
    query_template = get_template("hazards/create_materialized_view_query.sql")
    query = query_template.render(
        context={
            "event_set_id": event_set_id,
            "name": view_name,
        }
    )
    db_cursor.execute(query)
    db_cursor.execute(
        "SELECT Populate_Geometry_Columns(%(name)s::regclass)",
        {"name": qualified_name}
    )
    indexes = {
        "event_id": "unique",
        "geom": "gist",
    }
    build_indexes(
        db_cursor,
        qualified_name,
        logger=logger,
        **indexes
    )
    logger("Refreshing view with data...")
    _utils.refresh_view(db_cursor, qualified_name, logger=logger)


def get_materialized_view(db_cursor, view_name):
    db_cursor.execute(
        "SELECT * FROM hazards.{}".format(view_name)
    )
    result_tuple = namedtuple("Result", [c[0] for c in db_cursor.description])
    return [result_tuple(*r) for r in db_cursor.fetchall()]


def build_indexes(db_cursor, qualified_table_name, logger=print, **indexes):
    schema_name, base_name = qualified_table_name.split(".")
    for index_column, index_type in indexes.items():
        index_name = "{}_{}_idx".format(base_name, index_column)
        logger("Creating index {!r}...".format(index_name))
        db_cursor.execute("DROP INDEX IF EXISTS {} CASCADE".format(index_name))
        if index_type == "unique":
            index_query = """
            CREATE UNIQUE INDEX {index_name} ON {table} ({column})
            """.format(
                index_name=index_name,
                table=qualified_table_name,
                column=index_column,
            )
        else:
            index_query = """
            CREATE index {index_name} 
            ON {table} 
            USING {index_type} ({column})
            """.format(
                index_name=index_name,
                table=qualified_table_name,
                index_type=index_type,
                column=index_column,
            )
        db_cursor.execute(index_query)


def get_event_sets(db_cursor):
    query = """
        SELECT *
        FROM hazards.event_set
        ORDER BY id
    """
    db_cursor.execute(query)
    result_tuple = namedtuple("Result", [c[0] for c in db_cursor.description])
    return [result_tuple(*record) for record in db_cursor.fetchall()]


def get_view_aggregate_info(db_cursor, view_name):
    query = """
        SELECT 
            ST_CollectionExtract(ST_Collect(geom), 3)::geometry(MULTIPOLYGON, 4326) AS geom,
            AVG(average_event_intensity) AS average_intensity
        FROM hazards.{}
    """.format(view_name)
    db_cursor.execute(query)
    result_tuple = namedtuple("Result", [c[0] for c in db_cursor.description])
    return result_tuple(*db_cursor.fetchone())
