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

"""Django management command for integrating the GED4All exposures DB"""

from __future__ import unicode_literals
from collections import namedtuple

from django.db import connections
from django.core.management.base import BaseCommand
from django.contrib.gis import geos

from gfdrr_det.models import AdministrativeDivision
from gfdrr_det.models import DatasetRepresentation
from gfdrr_det.constants import AdministrativeDivisionLevel
from gfdrr_det.constants import DatasetType

# TODO: Perform a VACUUM ANALYZE on the django DB after inserting the records
# FIXME: Use a different approach to get the geometry of each exposure_model
# The current approach generates a polygon from the convex hull of all point
# assets. It does not yield acceptable results because the resulting polygon
# overlaps with several countries and produces a lot of false results
# (example: the exposure_model with id: 63, which is related to Tanzania, is
# being related to Tanzania, Mozambique, Malawai, Rwanda, Kenya, etc. which are
# Tanzania's neighbouring countries
# - Already tried to use a concave hull instead and, while the result is
# somewhat improved, there are still false results.
# - Perhaps the best strategy is to intersect the administrative divisions with
# the original points of each asset in the exposure model. This will be slower
# but it should guarantee correct results.

class Command(BaseCommand):
    help = "Integrate with the GED4All exposures database"

    def add_arguments(self, parser):
        parser.add_argument(
            "-f",
            "--force_ingestion",
            action="store_true",
            help="Re-import datasets, overwriting any previous records."
                 "Defaults to %(default)s"
        )
        parser.add_argument(
            "-l",
            "--admin_level",
            action="append",
            type=int,
            help="Relate the exposures to administrative regions of the "
                 "specified level. May be specified multiple times. Defaults "
                 "to %(default)s, meaning that all levels will be processed"
        )

    def handle(self, *args, **options):
        with connections["exposures"].cursor() as db_cursor:
            exposure_models = self.get_exposure_models(db_cursor)
            for index, exposure_model in enumerate(exposure_models):
                self.stdout.write(
                    u"({}/{}) - Handling exposure model {} - {}".format(
                        index+1, len(exposure_models), exposure_model.id,
                        exposure_model.name
                    )
                )
                self.handle_exposure_model(
                    db_cursor,
                    exposure_model,
                    force_ingestion=options["force_ingestion"],
                    adm_levels=self._get_levels(options["admin_level"])
                )
        self.stdout.write("Done!")

    def handle_exposure_model(self, db_cursor, exposure_model,
                              force_ingestion, adm_levels):
        existing = DatasetRepresentation.objects.filter(
            dataset_id=exposure_model.id,
            dataset_type=DatasetType.exposure.name
        ).exists()
        if not existing or (existing and force_ingestion):
            self.stdout.write("\tRetrieving aggregated geometry...")
            exposure_geom_wkb = self.get_aggregated_geometry(
                db_cursor,
                exposure_model.id
            )
            self.stdout.write("\tReading WKB into a GEOS geometry...")
            exposure_geom = geos.GEOSGeometry(exposure_geom_wkb, srid=4326)
            self.stdout.write("\tGetting dataset representation record...")
            record, created = DatasetRepresentation.objects.get_or_create(
                dataset_id=exposure_model.id,
                dataset_type=DatasetType.exposure.name,
                defaults={
                    "geom": exposure_geom,
                    "name": exposure_model.name,
                }
            )
            if not created:
                record.name = exposure_model.name
                record.geom = exposure_geom
                record.full_clean()
                record.save()
            self.stdout.write(
                "\tIntersecting dataset representation with administrative "
                "regions of levels {}...".format(adm_levels)
            )
            admin_divisions = AdministrativeDivision.objects.filter(
                level__in=adm_levels,
                geom__intersects=exposure_geom
            )
            for admin_division in admin_divisions:
                record.administrative_divisions.add(admin_division)
                record.save()
        else:
            self.stdout.write(u"\tExposure model {} has already been "
                              u"ingested".format(exposure_model.id))

    def get_aggregated_geometry(self, db_cursor, exposure_model_id):
        """Return a geometry that is representative of the input exposure model

        Returns
        -------
        wkb: str
            Well-Known Binary representation of the geometry

        """

        query = """
            SELECT
              ST_AsBinary(
                ST_Buffer(
                  ST_ConvexHull(
                    ST_Collect(the_geom)
                  ),
                  0.001
                )
              ) AS the_geom
            FROM level2.asset
            WHERE exposure_model_id = %(id)s
        """
        db_cursor.execute(query, {"id": exposure_model_id})
        return db_cursor.fetchone()[0]

    def get_exposure_models(self, db_cursor):
        db_cursor.execute("SELECT id, name FROM level2.exposure_model")
        Result = namedtuple(
            "Result", [col[0] for col in db_cursor.description])
        return [Result(*row) for row in db_cursor.fetchall()]

    def _get_levels(self, levels=None):
        if levels is None:
            result = [level.value for level in AdministrativeDivisionLevel]
        else:
            result = list(levels)
        return result

