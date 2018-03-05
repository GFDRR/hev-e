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

"""
Sample usage
------------

    from gfdrr_det.exposures.models import search_full_assets, search_exposures, search_assets

    assets = search_full_assets([65])

    for item in assets:
        print(item.asset_ref)

    args = {'srid': 4326, 'geom_name': 'full_geom', 'bbox': [-180, -90, 180, 90]}
    args = {'srid': 4326, 'geom_name': 'full_geom', 'bbox': [38, -7, 40, -5]}
    args = {'srid': 4326, 'geom_name': 'full_geom', 'bbox': [39.1974425, -6.1673895, 39.1974781, -6.1674177]}

    assets = search_full_assets([65], args=args)
    assets = search_full_assets([65], page_size=2, args=args)

    for item in assets:
        print(item.asset_ref, item.full_geom)

    exposures = search_exposures()
    for item in exposures:
        print(item)

"""

from collections import namedtuple

from django.db import connections
from django.core.checks import Error, register
from django.utils.translation import ugettext as _


@register()
def db_sanity_checks(app_configs, **kwargs):
    errors = []

    # Checks DB consistency
    with connections["exposures"].cursor() as cursor:
        # Check that the "all_outlines" materialized view actually exists
        """
        CREATE MATERIALIZED VIEW level2.all_outlines AS
          SELECT exposure_model_id, ST_Buffer(ST_ConvexHull(ST_Collect(the_geom)), 0.001) as the_geom
            FROM level2.asset
        GROUP BY exposure_model_id;
        """

        try:
            cursor.execute("SELECT 1 FROM level2.all_outlines")
        except BaseException as e:
            check_failed = True
            errors.append(
                Error(
                    e.message,
                    hint=_('Make sure the "level2.all_outlines" MATERIALIZED VIEW actually exists'),
                    # obj=cursor,
                    id='gfdrr_det.exposures.models',
                )
            )

        # Check that the "all_exposure" view actually exists
        """
        CREATE OR REPLACE VIEW level2.all_exposure AS
         SELECT a.asset_ref,
            a.taxonomy,
            a.number_of_units,
            a.area,
            a.exposure_model_id,
            occ.period,
            occ.occupants,
            c.value,
            mct.cost_type_name,
            mct.aggregation_type,
            mct.unit,
            st_x(a.the_geom) AS lon,
            st_y(a.the_geom) AS lat
           FROM level2.asset a
             LEFT JOIN level2.cost c ON c.asset_id = a.id
             LEFT JOIN level2.model_cost_type mct ON mct.id = c.cost_type_id
             LEFT JOIN level2.occupancy occ ON occ.asset_id = a.id;
        """

        try:
            cursor.execute("SELECT 1 FROM level2.all_exposure")
        except BaseException as e:
            check_failed = True
            errors.append(
                Error(
                    e.message,
                    hint=_('Make sure the "level2.all_exposure" VIEW actually exists'),
                    # obj=cursor,
                    id='gfdrr_det.exposures.models',
                )
            )

    # Returns checks outcomes
    return errors


FullAsset = namedtuple("FullAsset",
                       "asset_id, \
                       exposure_model_id, \
                       asset_ref, \
                       taxonomy, \
                       number_of_units, \
                       area, \
                       category, \
                       area_type, \
                       area_unit, \
                       cost_value, \
                       deductible, \
                       insurance_limit, \
                       cost_type_name, \
                       aggregation_type, \
                       unit, \
                       period, \
                       occupants, \
                       full_geom")

Asset = namedtuple("Asset",
                   "asset_ref, \
                   taxonomy, \
                   number_of_units, \
                   area, \
                   exposure_model_id, \
                   category, \
                   area_type, \
                   area_unit, \
                   period, \
                   occupants, \
                   cost_value, \
                   cost_type_name, \
                   aggregation_type, \
                   unit, \
                   the_geom")

Exposure = namedtuple("Exposure",
                      "name, \
                      description, \
                      taxonomy_source, \
                      category, \
                      area_type, \
                      area_unit, \
                      tag_names, \
                      cost_type_name, \
                      aggregation_type, \
                      unit, \
                      model_source, \
                      model_date, \
                      notes, \
                      the_geom")

INTERSECT_SQL_CONDITION = """
  AND NOT {the_geom_col_name} IS null
  AND NOT ST_IsEmpty({the_geom_col_name})
  AND NOT ST_IsEmpty(
        ST_Intersection(
		  ST_Buffer({the_geom_col_name}, 0.0),
                    ST_GeomFromText('POLYGON(({bbox_linestring}))', {srid})))
"""

FULL_ASSETS_SQL_QUERY = """
SELECT asset.id as asset_id,
       asset.exposure_model_id,
       asset_ref,
       taxonomy,
       number_of_units,
       area,
       model.category,
       model.area_type,
       model.area_unit,
       cst.value as cost_value,
       cst.deductible,
       cst.insurance_limit,
       mct.cost_type_name,
       mct.aggregation_type,
       mct.unit,
       occ.period,
       occ.occupants,
       ST_AsEWKT(full_geom)
     FROM level2.asset asset
     JOIN level2.exposure_model model ON (model.id = asset.exposure_model_id)
LEFT JOIN level2.cost cst ON (cst.asset_id = asset.id)
LEFT JOIN level2.model_cost_type mct ON mct.id = cst.cost_type_id
LEFT JOIN level2.occupancy occ ON (occ.asset_id = asset.id)
    WHERE asset.exposure_model_id = ANY(%(exposure_model_ids)s)
{intersects}
LIMIT {size}
OFFSET {offset}
"""

ASSETS_SQL_QUERY = """
SELECT a.asset_ref,
       a.taxonomy,
       a.number_of_units,
       a.area,
       a.exposure_model_id,
       model.category,
       model.area_type,
       model.area_unit,
       occ.period,
       occ.occupants,
       c.value as cost_value,
       mct.cost_type_name,
       mct.aggregation_type,
       mct.unit,
       ST_AsEWKT(a.the_geom)
       FROM level2.asset a
              JOIN level2.exposure_model model ON (model.id = a.exposure_model_id)
         LEFT JOIN level2.cost c ON c.asset_id = a.id
         LEFT JOIN level2.model_cost_type mct ON mct.id = c.cost_type_id
         LEFT JOIN level2.occupancy occ ON occ.asset_id = a.id
       WHERE a.exposure_model_id = ANY(%(exposure_model_ids)s)
{intersects}
LIMIT {size}
OFFSET {offset}
"""

EXPOSURES_SQL_QUERY = """
   SELECT  models.name,
           models.description,
           models.taxonomy_source,
           models.category,
           models.area_type,
           models.area_unit,
           models.tag_names,
           mct.cost_type_name,
           mct.aggregation_type,
           mct.unit,
           contrib.model_source,
           contrib.model_date,
           contrib.notes,
		   ST_AsEWKT(outlines.the_geom)
      FROM level2.all_outlines as outlines
           JOIN level2.exposure_model models ON (outlines.exposure_model_id = models.id)
      LEFT JOIN level2.model_cost_type mct ON (mct.exposure_model_id = models.id)
      LEFT JOIN level2.contribution contrib ON (contrib.exposure_model_id = models.id)
     WHERE outlines.exposure_model_id = ANY(%(exposure_model_ids)s)
{intersects}
LIMIT {size}
OFFSET {offset}
"""


def _get_bbox_linestring(bbox):
    return ','.join(['%s %s' % (bbox[0], bbox[1]),
                     '%s %s' % (bbox[0], bbox[3]),
                     '%s %s' % (bbox[2], bbox[3]),
                     '%s %s' % (bbox[2], bbox[1]),
                     '%s %s' % (bbox[0], bbox[1])
                    ])


def _get_intersect_cond(**kwargs):
    query_str = ""
    if 'bbox' in kwargs and 'srid' in kwargs and 'geom_name' in kwargs:
        query_str = (INTERSECT_SQL_CONDITION.format(the_geom_col_name=kwargs['geom_name'],
                                                    srid=kwargs['srid'],
                                                    bbox_linestring=_get_bbox_linestring(kwargs['bbox'])))
    return query_str


def _get_all_exposure_ids(cursor):
    try:
        cursor.execute("SELECT id FROM level2.exposure_model")
        return [row[0] for row in cursor.fetchall()]
    except:
        return []


def _search(cursor, query, exposure_model_ids):
    try:
        cursor.execute(query, {
            "exposure_model_ids": exposure_model_ids
        })
    except:
        return None


def search_full_assets(exposure_model_ids, page_size=100, page=0, args={}):
    """Search all assets of one or more Exposures IDs

    Parameters
    ----------
        @mandatory
        exposure_model_ids: list
            Numeric IDs of the Exposures Models to Search

        @optional
        args: dict
            {
                bbox: [x_min, y_min, x_max, y_max],
                srid: int,
                geom_name: str
            }

    Returns
    -------
        @generator
        list<FullAsset>()
    """
    size = (
        page_size.upper() if isinstance(page_size, basestring) else page_size)
    offset = page * size if size != "ALL" else 0

    query = FULL_ASSETS_SQL_QUERY.format(intersects=_get_intersect_cond(**args),
                                         size=size,
                                         offset=offset)

    with connections["exposures"].cursor() as cursor:
        _search(cursor, query, exposure_model_ids)

        # FullAsset = namedtuple("FullAsset", [col[0] for col in cursor.description])
        if not cursor.closed:
            for row in cursor.fetchall():
                yield FullAsset(*row)
        else:
            yield None


def search_assets(exposure_model_ids, page_size=100, page=0, args={}):
    """Search assets of one or more Exposures IDs

    Parameters
    ----------
        @mandatory
        exposure_model_ids: list
            Numeric IDs of the Exposures Models to Search

        @optional
        args: dict
            {
                bbox: [x_min, y_min, x_max, y_max],
                srid: int,
                geom_name: str
            }

    Returns
    -------
        @generator
        list<Asset>()
    """
    size = (
        page_size.upper() if isinstance(page_size, basestring) else page_size)
    offset = page * size if size != "ALL" else 0

    query = ASSETS_SQL_QUERY.format(intersects=_get_intersect_cond(**args),
                                         size=size,
                                         offset=offset)
    with connections["exposures"].cursor() as cursor:
        _search(cursor, query, exposure_model_ids)

        if not cursor.closed:
            for row in cursor.fetchall():
                yield Asset(*row)
        else:
            yield None


def search_exposures(exposure_model_ids=[], page_size=100, page=0, args={}):
    """Search Exposures

    Parameters
    ----------
        @optional
        exposure_model_ids: list
            Numeric IDs of the Exposures Models to Search

        @optional
        args: dict
            {
                bbox: [x_min, y_min, x_max, y_max],
                srid: int,
                geom_name: str
            }

    Returns
    -------
        @generator
        list<Exposure>()
    """
    size = (
        page_size.upper() if isinstance(page_size, basestring) else page_size)
    offset = page * size if size != "ALL" else 0

    query = EXPOSURES_SQL_QUERY.format(intersects=_get_intersect_cond(**args),
                                       size=size,
                                       offset=offset)

    with connections["exposures"].cursor() as cursor:
        ids = exposure_model_ids if exposure_model_ids else _get_all_exposure_ids(cursor)

        if not cursor.closed:
            _search(cursor, query, ids)

            for row in cursor.fetchall():
                yield Exposure(*row)
        else:
            yield None
