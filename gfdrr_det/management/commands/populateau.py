# -*- coding: utf-8 -*-
#########################################################################
#
# Copyright (C) 2017 OSGeo
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program. If not, see <http://www.gnu.org/licenses/>.
#
#########################################################################

from optparse import make_option

from django.core.management.base import BaseCommand, CommandError
from django.contrib.gis.gdal import DataSource
from django.contrib.gis import geos

from gfdrr_det.models import Region, AdministrativeDivision


class Command(BaseCommand):
    """
    Data Source (http://gadm.org/version2):
       http://biogeo.ucdavis.edu/data/gadm2.8/gadm28_levels.shp.zip

    Example Usage:
    $> python manage.py populateau -a 0 \
         -s /data/gadm28/levels/gadm28_adm0.shp
    """

    help = 'Populate Administrative Units Dataset'

    option_list = BaseCommand.option_list + (
        make_option(
            '-a',
            '--adm-level',
            dest='adm_level',
            type="int",
            help='Administrative Unit Level.'),
        make_option(
            '-s',
            '--shape-file',
            dest='shape_file',
            type="string",
            help='Input Administrative Unit Shapefile.'),
        make_option(
            '-t',
            '--tolerance',
            dest='tolerance',
            type="float",
            default=0.0001,
            help='Geometry Simplify Tolerance. [0.0001]'))

    def handle(self, **options):
        adm_level = options.get('adm_level')
        shape_file = options.get('shape_file')
        tolerance = options.get('tolerance')

        if adm_level is None:
            raise CommandError("Input Administrative Unit Level '--adm-level' \
is mandatory")

        if not shape_file or len(shape_file) == 0:
            raise CommandError("Input Administrative Unit Shapefile \
'--shape-file' is mandatory")

        ds = DataSource(shape_file)
        print ('Opening Data Source "%s"' % ds.name)

        for layer in ds:
            print('Layer "%s": %i %ss' %
                  (layer.name, len(layer), layer.geom_type.name))

            counter = 1
            for feat in layer:
                # Simplify the Geometry
                geom = geos.fromstr(feat.geom.wkt, srid=4326)
                if tolerance > 0:
                    geom = geom.simplify(tolerance, preserve_topology=True)

                # Generalize to 'Multiploygon'
                if geom:
                    # geom = geos.MultiPolygon(geom)
                    region_level = adm_level if adm_level == 0 else (adm_level - 1)
                    region_name = feat.get("NAME_ISO") if adm_level == 0 else feat.get("NAME_{adm_level}".format(adm_level=adm_level - 1))

                    iso = feat.get("ISO")
                    # print(dir(feat))
                    # print(feat.fields)
                    # print(feat.get('OBJECTID'))
                    iso_parent_id = feat.get("ID_{adm_level}".format(adm_level=adm_level)) if adm_level == 0 else feat.get("ID_{adm_level}".format(adm_level=adm_level - 1))
                    iso_id = feat.get("ID_{adm_level}".format(adm_level=adm_level))
                    name_iso = feat.get("NAME_ISO") if adm_level == 0 else feat.get("NAME_{adm_level}".format(adm_level=adm_level))
                    print(" %s ************* %s(%s) / %s(%s) " % (counter, region_name, iso_parent_id, name_iso, iso_id))
                    # print(geom)
                counter = counter + 1
            # (region_obj, is_new_region) = Region.objects.get_or_create(
            #     name=region,
            #     defaults=dict(
            #         level=region_level
            #     )
            # )
            #
            # for feat in layer:
            #     # Simplify the Geometry
            #     geom = geos.fromstr(feat.geom.wkt, srid=4326)
            #     if tolerance > 0:
            #         geom = geom.simplify(tolerance, preserve_topology=True)
            #
            #     # Generalize to 'Multiploygon'
            #     geom = geos.MultiPolygon(geom)
            #
            #     if adm_level == 0:
            #         (adm_division, is_new_amdiv) = \
            #             AdministrativeDivision.objects.get_or_create(
            #                 code=feat.get('HRPcode'),
            #                 defaults=dict(
            #                     name=feat.get('HRname'),
            #                     geom=geom.wkt,
            #                     region=region_obj
            #                 )
            #             )
            #
            #         if not is_new_amdiv:
            #             adm_division.name = feat.get('HRname')
            #             adm_division.geom = geom.wkt
            #             adm_division.region = region_obj
            #             adm_division.save()
            #         else:
            #             region_obj.administrative_divisions.add(adm_division)
            #
            #     if adm_level == 1:
            #         adm_division_0 = \
            #             AdministrativeDivision.objects.get(
            #                 code=feat.get('HRparent')[:-2])
            #         (adm_division, is_new_amdiv) = \
            #             AdministrativeDivision.objects.get_or_create(
            #                 code=feat.get('HRpcode'),
            #                 defaults=dict(
            #                     name=feat.get('HRname'),
            #                     geom=geom.wkt,
            #                     region=region_obj,
            #                     parent=adm_division_0
            #                 )
            #             )
            #
            #         if not is_new_amdiv:
            #             adm_division.name = feat.get('HRname')
            #             adm_division.geom = geom.wkt
            #             adm_division.region = region_obj
            #             adm_division.parent = adm_division_0
            #             adm_division.save()
            #         else:
            #             region_obj.administrative_divisions.add(adm_division)
            #
            #     if adm_level == 2:
            #         adm_division_1 = AdministrativeDivision.objects.get(code=feat.get('HRparent'))
            #         (adm_division, is_new_amdiv) = AdministrativeDivision.objects.get_or_create(
            #             code=feat.get('HRpcode'),
            #             defaults=dict(
            #                 name=feat.get('HRname'),
            #                 geom=geom.wkt,
            #                 region=region_obj,
            #                 parent=adm_division_1
            #             )
            #         )
            #
            #         if not is_new_amdiv:
            #             adm_division.name = feat.get('HRname')
            #             adm_division.geom = geom.wkt
            #             adm_division.region = region_obj
            #             adm_division.parent = adm_division_1
            #             adm_division.save()
            #         else:
            #             region_obj.administrative_divisions.add(adm_division)
