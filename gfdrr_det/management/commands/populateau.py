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

from decimal import *
from optparse import make_option

from django.core.management.base import BaseCommand, CommandError
from django.contrib.gis.gdal import DataSource
from django.contrib.gis import geos
from django.db.models import Q

from gfdrr_det.models import Region, AdministrativeDivision

getcontext().prec = 8


class Command(BaseCommand):
    """
    Data Source (http://gadm.org/version2):
       http://biogeo.ucdavis.edu/data/gadm2.8/gadm28_levels.shp.zip

    Example Usage:
    $> python manage.py populateau -a 0 \
         -s /data/gadm28/levels/gadm28_adm0.shp

    $> python manage.py populateau -a 1 \
         -s /data/gadm28/levels/gadm28_adm1.shp

    $> python manage.py populateau -a 2 \
         -s /data/gadm28/levels/gadm28_adm2.shp

    ... (must be run sequentially to build the tree correctly;
         adm levels depends from the previous one)
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

                if geom:
                    # Generalize to 'Multiploygon'
                    if isinstance(geom, geos.Polygon):
                        geom = geos.MultiPolygon(geom)

                    region_name = feat.get("NAME_{adm_level}".format(adm_level=adm_level - 1)) if adm_level > 0 else \
                        (feat.get("UNREGION2") if feat.get("UNREGION2") else feat.get("UNREGION1"))

                    (region_obj, is_new_region) = Region.objects.get_or_create(
                        name=region_name,
                        defaults=dict(
                            level=(adm_level - 1 if adm_level > 0 else adm_level)
                        )
                    )

                    level = adm_level
                    objectid = feat.get("OBJECTID")
                    iso_id = feat.get("ID_{adm_level}".format(adm_level=adm_level))
                    name_iso = feat.get("NAME_ISO") if adm_level == 0 else feat.get("NAME_{adm_level}".format(adm_level=adm_level))
                    iso_parent = feat.get("ISO")
                    iso_parent_id = iso_id if adm_level == 0 else feat.get("ID_{adm_level}".format(adm_level=adm_level - 1))

                    shape_leng = Decimal(feat.get("Shape_Leng"))
                    shape_area = Decimal(feat.get("Shape_Area"))

                    parent = None
                    if name_iso:
                        if level > 0:
                            type = feat.get("TYPE_{adm_level}".format(adm_level=adm_level))
                            engtype = feat.get("ENGTYPE_{adm_level}".format(adm_level=adm_level))
                            try:
                                parent = AdministrativeDivision.objects.get(Q(iso=iso_parent) &
                                                                            Q(iso_id=iso_parent_id) &
                                                                            Q(level=(adm_level - 1)))
                                (adm_division, is_new_amdiv) = \
                                    AdministrativeDivision.objects.get_or_create(
                                        name=name_iso,
                                        defaults=dict(
                                            objectid=objectid,
                                            level=level,
                                            iso=iso_parent,
                                            iso_id=iso_id,
                                            type=type,
                                            engtype=engtype,
                                            shape_leng=shape_leng,
                                            shape_area=shape_area,
                                            geom=geom,
                                            region=region_obj,
                                            parent=parent
                                        )
                                    )

                                if adm_division and is_new_amdiv:
                                    region_obj.administrative_divisions.add(adm_division)
                            except:
                                pass
                        else:
                            parent = region_obj
                            (adm_division, is_new_amdiv) = \
                                AdministrativeDivision.objects.get_or_create(
                                    name=name_iso,
                                    defaults=dict(
                                        objectid=objectid,
                                        level=level,
                                        iso=iso_parent,
                                        iso_id=iso_id,
                                        name_eng=feat.get("NAME_ENGLI"),
                                        name_fao=feat.get("NAME_FAO"),
                                        name_local=feat.get("NAME_LOCAL"),
                                        contains=feat.get("CONTAINS"),
                                        sovereign=feat.get("SOVEREIGN"),
                                        fips=feat.get("FIPS"),
                                        unregion=feat.get("UNREGION1"),
                                        ison=feat.get("ISON"),
                                        valid_from=feat.get("VALIDFR"),
                                        valid_to=feat.get("VALIDTO"),
                                        population=Decimal(feat.get("POP2000")),
                                        sqkm=Decimal(feat.get("SQKM")),
                                        pop_sqkm=Decimal(feat.get("POPSQKM")),
                                        shape_leng=shape_leng,
                                        shape_area=shape_area,
                                        geom=geom,
                                        region=region_obj
                                    )
                                )

                            if adm_division and is_new_amdiv:
                                region_obj.administrative_divisions.add(adm_division)

                        if parent:
                            print(" %s ************* Region : %s - Parent: %s(%s) - Adm Unit : %s(%s) " % (counter,
                                                                                                           region_name,
                                                                                                           parent,
                                                                                                           iso_parent,
                                                                                                           name_iso,
                                                                                                           iso_id))

                counter = counter + 1
