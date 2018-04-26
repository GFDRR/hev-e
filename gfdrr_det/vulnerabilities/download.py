#########################################################################
#
# Copyright 2018, GeoSolutions Sas.
# All rights reserved.
#
# This source code is licensed under the BSD-style license found in the
# LICENSE file in the root directory of this source tree.
#
#########################################################################

"""Utilities for the preparation of downloadable files from vulnerabilities."""

import logging
import sqlite3
from urlparse import urlparse

from django.contrib.sites.models import Site
from pathlib2 import Path
from rest_framework.test import APIClient
from rest_framework_csv.renderers import CSVRenderer

from .. import utils as general_utils
from ..models import HeveDetails

LOGGER = logging.getLogger(__name__)


def prepare_item(heve_details_id, batch_data=None, vulnerabilityFormat=None,  # pylint: disable=invalid-name,unused-argument
                 **kwargs):
    format_handler = {
        "csv": get_csv_item,
        "geopackage": get_geopackage_item
    }[vulnerabilityFormat]
    return format_handler(heve_details_id, batch_data=batch_data)


def get_csv_item(heve_details_id, batch_data=None):
    file_hash = general_utils.get_layer_hash(heve_details_id)
    target_dir = Path(batch_data["target_dir"])
    target_path = target_dir / "{}.csv".format(file_hash)
    LOGGER.debug("target_path: %s", target_path)
    if not target_path.is_file():  # pylint: disable=no-member
        LOGGER.debug("generating a new csv...")
        generate_csv(heve_details_id, str(target_path))
    return urlparse(str(target_path), scheme="file").geturl()


def generate_csv(heve_details_id, target_path):
    client = APIClient()
    response = client.get(
        "/gfdrr_det/api/v1/vulnerabilities/{}/".format(heve_details_id),
        {"format": "csv"}
    )
    response_data = response.data.copy()
    response_data["url"] = response_data["url"].replace(
        "testserver",
        Site.objects.get_current().domain
    )
    renderer = CSVRenderer()
    contents = renderer.render(response_data)
    with open(target_path, "w") as file_handler:
        file_handler.write(contents)


def get_geopackage_item(heve_details_id, batch_data=None):
    LOGGER.debug("get_geopackage_item called: %s", locals())
    heve_details = HeveDetails.objects.get(pk=heve_details_id)  # pylint: disable=no-member
    if batch_data[heve_details.dataset_type].get("geopackage_exists"):
        pass
    else:
        generate_geopackage(
            heve_details.details["record_id"],
            heve_details.details["vulnerability_type"],
            batch_data[heve_details.dataset_type]["geopackage_target_path"],
        )
    return urlparse(
        batch_data[heve_details.dataset_type]["geopackage_target_path"],
        scheme="file"
    ).geturl()


def generate_geopackage(record_id, vulnerability_type, target_path):
    handler = {
        "vulnerability_function": handle_gpkg_vulnerability,
        "fragility_function": handle_gpkg_fragility,
        "damage_to_loss_function": handle_gpkg_damage_to_loss,
    }[vulnerability_type]
    return handler(record_id, target_path)


def handle_gpkg_vulnerability(record_id, target_path):
    main_table = "vf_table"
    table_info = {
        main_table: (_get_vf_table_query(record_id), "id"),
        "reference_table": (
            _get_related_table_query(
                record_id,
                main_table=main_table,
                related_table="reference_table",
                fk_name="reference",
                column_name="author_year"
            ),
            "id",
        ),
        "im_table": (
            _get_related_table_query(
                record_id,
                main_table=main_table,
                related_table="im_table",
                fk_name="im_name_f",
                column_name="im_name_f"
            ),
            "im_id",
        ),
        "loss_parameter": (
            _get_related_table_query(
                record_id,
                main_table=main_table,
                related_table="loss_parameter",
                fk_name="lp_name",
                column_name="lp_name"
            ),
            "lp_id",
        )
    }
    _generate_geopackage(target_path, table_info)


def handle_gpkg_fragility(record_id, target_path):
    main_table = "ff_table"
    table_info = {
        main_table: (
            _get_ff_table_query(record_id),
            "id",
        ),
        "damage_scale": (
            _get_related_table_query(
                record_id,
                main_table=main_table,
                related_table="damage_scale",
                fk_name="damage_scale_name",
                column_name="damage_scale_name"
            ),
            "dm_scale_id",
        ),
        "edp": (
            _get_related_table_query(
                record_id,
                main_table=main_table,
                related_table="edp",
                fk_name="edp_name_all",
                column_name="edp_name_f"
            ),
            "edp_id",
        ),
        "reference_table": (
            _get_related_table_query(
                record_id,
                main_table=main_table,
                related_table="reference_table",
                fk_name="reference",
                column_name="author_year"
            ),
            "id",
        ),
        "im_table": (
            _get_related_table_query(
                record_id,
                main_table=main_table,
                related_table="im_table",
                fk_name="im_name_f",
                column_name="im_name_f"
            ),
            "im_id",
        ),
    }
    _generate_geopackage(target_path, table_info)


def handle_gpkg_damage_to_loss(record_id, target_path):
    main_table = "dtl_table"
    table_info = {
        main_table: (
            _get_dtl_table_query(record_id),
            "id",
        ),
        "damage_scale": (
            _get_related_table_query(
                record_id,
                main_table=main_table,
                related_table="damage_scale",
                fk_name="damage_scale_name",
                column_name="damage_scale_name"
            ),
            "dm_scale_id",
        ),
        "reference_table": (
            _get_related_table_query(
                record_id,
                main_table=main_table,
                related_table="reference_table",
                fk_name="reference",
                column_name="author_year"
            ),
            "id",
        )
    }
    _generate_geopackage(target_path, table_info)


def _delete_duplicate_rows(target_path, **table_columns):
    """Connect to geopackage and delete duplicate rows

    This function connects to the geopackage file using python's ``sqlite3``
    package.

    """

    query_template = (
        "DELETE FROM {table} "
        "WHERE rowid NOT IN ("
        "SELECT MIN(rowid) FROM {table} GROUP BY {id_column}"
        ")"
    )
    queries = [query_template.format(table=k, id_column=v) for k, v
               in table_columns.items()]
    LOGGER.debug("queries: %s", queries)
    with sqlite3.connect(target_path) as connection:
        for query in queries:
            LOGGER.debug("executing query: %s", query)
            connection.execute(query)


def _generate_geopackage(target_path, table_info):
    creation_queries = {k: v[0] for k, v in table_info.items()}
    LOGGER.debug("creation_queries: %s", creation_queries)
    _run_ogr2ogr(target_path, **creation_queries)
    _delete_duplicate_rows(
        target_path,
        **{k: v[1] for k, v in table_info.items()}
    )


def _get_vf_table_query(record_id):
    return "SELECT * FROM vulnerabilities.vf_table WHERE id = {}".format(
        record_id)


def _get_ff_table_query(record_id):
    return "SELECT * FROM vulnerabilities.ff_table WHERE id = {}".format(
        record_id)


def _get_dtl_table_query(record_id):
    return "SELECT * FROM vulnerabilities.dtl_table WHERE id = {}".format(
        record_id)


def _get_related_table_query(record_id, main_table, related_table, fk_name,
                             column_name):
    return (
        "SELECT r.* "
        "FROM vulnerabilities.{related} AS r "
        "LEFT OUTER JOIN vulnerabilities.{main} AS v ON (v.{fk} = r.{col}) "
        "WHERE v.id = {id}".format(
            id=record_id,
            related=related_table,
            main=main_table,
            fk=fk_name,
            col=column_name
        )
    )


def _run_ogr2ogr(target_path, **queries):
    for table_name, query in queries.items():
        command_str = general_utils.prepare_ogr2ogr_command(
            query, target_path, table_name)
        return_code, stderr = general_utils.run_process(command_str)[::2]
        if return_code != 0:
            raise RuntimeError(
                "Could not generate GeoPackage file: {}".format(stderr))
