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
    """Return extended information from a vf_table record"""
    query_template = get_template("vulnerabilities/vf_table_detail_query.sql")
    query = query_template.render()
    db_cursor.execute(query, {"pk": pk})
    column_overrides = {
        "country_iso": "countries_iso",
    }
    result_tuple = namedtuple(
        "Result",
        [column_overrides.get(col[0], col[0]) for col in db_cursor.description]
    )
    raw_record = result_tuple(*db_cursor.fetchone())
    countries = _fix_record_countries(raw_record)
    final_values = raw_record._asdict()
    final_values.update(
        countries_iso=countries,
        function_parameters=_get_record_parameters(
            raw_record,
            "par_names",
            [
                "ub_par_value",
                "lb_par_value",
                "med_par_value",
            ]
        )
    )
    final_result_tuple = namedtuple(
        "Result",
        raw_record._fields + ("function_parameters",)
    )
    return final_result_tuple(**final_values)


def _get_record_parameters(record, parameter_names_attr,
                           parameter_values_attr, delimiter=";"):
    params = {}
    names_list = [i.strip() for i in getattr(
        record, parameter_names_attr).split(delimiter)]
    LOGGER.debug("names_list: {}".format(names_list))
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


def get_loss_parameter_records(db_cursor, *names):
    names_clause = " WHERE lp_name::text=any(%(names)s)" if names else ""
    query = "SELECT * FROM vulnerabilities.loss_parameter{names}".format(
        names=names_clause
    )
    db_cursor.execute(query, {"names": list(names)})
    result_tuple = namedtuple("Result",[c[0] for c in db_cursor.description])
    return [result_tuple(*record) for record in db_cursor.fetchall()]


def get_im_table_records(db_cursor, *names):
    names_clause = " WHERE im_name_f::text=any(%(names)s)" if names else ""
    query = "SELECT * FROM vulnerabilities.im_table{names}".format(
        names=names_clause
    )
    db_cursor.execute(query, {"names": list(names)})
    result_tuple = namedtuple("Result",[c[0] for c in db_cursor.description])
    return [result_tuple(*record) for record in db_cursor.fetchall()]


def add_fields_to_tuple(record, **fields):
    new_values = fields.items()
    new_record_tuple = namedtuple(
        "Result",
        record._fields + tuple(v[0] for v in new_values)
    )
    new_contents = dict(fields)
    new_contents.update(record._asdict())
    new_record = new_record_tuple(**new_contents)
    return new_record


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
