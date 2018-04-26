#########################################################################
#
# Copyright 2018, GeoSolutions Sas.
# All rights reserved.
#
# This source code is licensed under the BSD-style license found in the
# LICENSE file in the root directory of this source tree.
#
#########################################################################

"""Django management command for integrating the vulnerabilities DB"""

from __future__ import print_function
from __future__ import unicode_literals

from django.db import connections
from django.contrib.gis import geos
from django.core.management.base import BaseCommand

from gfdrr_det.constants import DatasetType
from gfdrr_det.models import AdministrativeDivision
from gfdrr_det.models import HeveDetails
from gfdrr_det.vulnerabilities import utils


class Command(BaseCommand):  # pylint: disable=missing-docstring
    help = "Integrate with the vulnerabilities database"

    def handle(self, *args, **options):
        table_params = {
            "vf_table": {
                "vulnerability_type": "vulnerability_function",
            },
            "ff_table": {
                "vulnerability_type": "fragility_function",
            },
            "dtl_table": {
                "vulnerability_type": "damage_to_loss_function",
            },
        }
        with connections["hev_e"].cursor() as db_cursor:
            for table, extra in table_params.items():
                for record in utils.get_vulnerability_records(db_cursor, table):
                    details = {
                        "db_table": table,
                        "record_id": record.id,
                        "hazard": record.hazard.lower(),
                        "asset": record.asset.lower(),
                        "reference": record.reference,
                    }
                    details.update(extra)
                    hev_e_detail, created = HeveDetails.objects.get_or_create(  # pylint: disable=no-member
                        details__contains=details,
                    )
                    if created:
                        self.stdout.write(
                            "Integrated vulnerabilities record {} - {}".format(
                                table, record.id)
                        )
                        hev_e_detail.dataset_type = (
                            DatasetType.vulnerability.name)
                        details.update(
                            countries=get_country_names(record.countries_iso)
                        )
                        hev_e_detail.details = details
                        hev_e_detail.envelope = get_envelope(
                            record.countries_iso)
                        hev_e_detail.save()


def get_country_names(country_iso_codes):
    country_names = []
    for country_iso in country_iso_codes:
        try:
            adm_division = AdministrativeDivision.objects.get(  # pylint: disable=no-member
                iso=country_iso, level=0)
            country_names.append(adm_division.name_eng)
        except AdministrativeDivision.DoesNotExist:  # pylint: disable=no-member
            country_names.append(country_iso)
    return country_names


def get_envelope(country_iso_codes):
    """Returns a MultiPolygon with a simplified geometry of the countries

    The simplified geometry is calculated as the convex hull of each individual
    polygon that makes up each country's territory.

    """

    qs = AdministrativeDivision.objects.filter(  # pylint: disable=no-member
        level=0,
        iso__in=country_iso_codes,
    ).values_list("geom", flat=True)
    geoms = []
    for multipolygon_geom in qs:
        geoms += [poly.convex_hull for poly in multipolygon_geom]
    unioned = geos.MultiPolygon(geoms).cascaded_union
    if unioned.geom_typeid == 3:  # Polygon
        result = geos.MultiPolygon(unioned)
    elif unioned.geom_typeid == 6:  # MultiPolygon
        result = unioned
    else:
        raise RuntimeError("Invalid geometry type")
    return result
