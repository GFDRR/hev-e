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
        fixed_record = _fix_record_countries(raw_record)
        records.append(fixed_record)
    return records


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
    return db_record._replace(countries_iso=countries)
