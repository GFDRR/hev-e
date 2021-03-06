#########################################################################
#
# Copyright 2018, GeoSolutions Sas.
# All rights reserved.
#
# This source code is licensed under the BSD-style license found in the
# LICENSE file in the root directory of this source tree.
#
#########################################################################

"""utility functions for HEV-E vulnerabilities"""

from collections import namedtuple
import logging

from django.template.loader import get_template

LOGGER = logging.getLogger(__name__)


def get_vulnerability_records(db_cursor, table_name, *ids):
    ids_clause = " WHERE id=any(%(ids)s)" if ids else ""
    query = "SELECT * FROM vulnerabilities.{table}{ids}".format(
        table=table_name,
        ids=ids_clause
    )
    column_overrides = {
        "country_iso": "countries_iso",
    }
    db_cursor.execute(query, {"ids": list(ids)})
    result_tuple = namedtuple(
        "Result",
        [column_overrides.get(col[0], col[0]) for col in db_cursor.description]
    )
    records = []
    for row in db_cursor.fetchall():
        raw_record = result_tuple(*row)
        fixed_record = raw_record._replace(
            countries_iso=_fix_record_countries(raw_record))
        records.append(fixed_record)
    return records


def get_extended_vulnerability_record(db_cursor, pk):
    query_template = get_template("vulnerabilities/vf_table_detail_query.sql")
    query = query_template.render()
    record = _get_extended_record(db_cursor, query, query_kwargs={"pk": pk})
    return _add_function_parameters(
        record,
        "par_names",
        [
            "ub_par_value",
            "lb_par_value",
            "med_par_value",
            "im_range",
        ]
    )


def get_extended_fragility_record(db_cursor, pk):
    query_template = get_template("vulnerabilities/ff_table_detail_query.sql")
    query = query_template.render()
    record = _get_extended_record(db_cursor, query, query_kwargs={"pk": pk})
    return _add_function_parameters(
        record,
        "par_names",
        [
            "ub_par_value",
            "lb_par_value",
            "med_par_value",
            "im_range",
        ]
    )


def get_extended_damage_to_loss_record(db_cursor, pk):
    query_template = get_template("vulnerabilities/dtl_table_detail_query.sql")
    query = query_template.render()
    record = _get_extended_record(db_cursor, query, query_kwargs={"pk": pk})
    return _add_function_parameters(
        record,
        "dtl_parameters",
        [
            "dtl_parameters_values",
        ]
    )


def _add_function_parameters(record, parameter_names, parameter_values):
    """Add the function_parameters field to a record"""
    record_dict = record._asdict()
    try:
        function_parameters = _get_record_parameters(
            record,
            parameter_names,
            parameter_values
        )
    except AttributeError as err:
        LOGGER.debug(
            "Could not extract function parameters from record. "
            "Error was {}".format(err)
        )
        function_parameters = None
    record_dict.update(function_parameters=function_parameters)
    final_result_tuple = namedtuple(
        "Result",
        record._fields + ("function_parameters",)
    )
    return final_result_tuple(**record_dict)


def _fix_record_countries(db_record):
    separator = ";"
    extra_separators = [
        ":",
    ]
    countries_iso_str = db_record.countries_iso
    for extra_separator in extra_separators:
        countries_iso_str = countries_iso_str.replace(
            extra_separator, separator)
    countries = [c.strip() for c in countries_iso_str.split(separator)]
    return countries


def _get_extended_record(db_cursor, query, query_kwargs):
    column_overrides = {
        "country_iso": "countries_iso",
    }
    db_cursor.execute(query, query_kwargs)
    result_tuple = namedtuple(
        "Result",
        [column_overrides.get(col[0], col[0]) for col in db_cursor.description]
    )
    raw_record = result_tuple(*db_cursor.fetchone())
    return raw_record._replace(countries_iso=_fix_record_countries(raw_record))


def _get_record_parameters(record, parameter_names_attr,
                           parameter_values_attr, delimiter=";"):
    params = {}
    names_list = [i.strip() for i in getattr(
        record, parameter_names_attr).split(delimiter)]
    for index, name in enumerate(names_list):
        name_values = {}
        for values_attr in parameter_values_attr:
            LOGGER.debug("values_attr: {}".format(values_attr))
            try:
                values_list = [v.strip() for v in getattr(
                    record, values_attr).split(delimiter)]
                LOGGER.debug("values_list: {}".format(values_list))
            except AttributeError:
                pass
            else:
                try:
                    name_values[values_attr] = float(values_list[index])
                except ValueError:
                    name_values[values_attr] = values_list[index]
        params[name] = name_values
    return params
