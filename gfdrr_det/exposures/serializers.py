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

from tempfile import mkdtemp

from django.core.exceptions import ObjectDoesNotExist
from django.contrib.gis import geos
from geonode.layers.models import Layer
from rest_framework import serializers
from rest_framework_gis import serializers as gis_serializers
from pathlib2 import Path

from . import utils


class ExposureLayerListSerializer(gis_serializers.GeoFeatureModelSerializer):
    aggregation_type = serializers.CharField(
        source="hevedetails.details.area_type")
    bbox = gis_serializers.GeometrySerializerMethodField()
    category = serializers.CharField(source="hevedetails.details.category")
    description = serializers.CharField(source="abstract")
    url = serializers.HyperlinkedIdentityField(view_name="exposures-detail")
    wms_url = serializers.SerializerMethodField()

    class Meta:
        model = Layer
        geo_field = "bbox"
        id_field = "id"
        fields = (
            "id",
            "url",
            "title",
            "name",
            "description",
            "category",
            "aggregation_type",
            "wms_url",
        )

    def get_bbox(self, obj):
        return geos.Polygon(
            (
                (obj.bbox_x0, obj.bbox_y0),
                (obj.bbox_x0, obj.bbox_y1),
                (obj.bbox_x1, obj.bbox_y1),
                (obj.bbox_x1, obj.bbox_y0),
                (obj.bbox_x0, obj.bbox_y0),
            )
        )

    def get_wms_url(self, obj):
        try:
            wms_link = obj.link_set.get(link_type="OGC:WMS").url
        except ObjectDoesNotExist:
            wms_link = None
        return wms_link


class ExposureLayerSerializer(ExposureLayerListSerializer):
    counts = serializers.SerializerMethodField()

    def get_counts(self, obj):
        return {
            "name": "Number of assets",
            "data": self.context["taxonomic_counts"]
        }


    class Meta:
        model = Layer
        geo_field = "bbox"
        id_field = "id"
        fields = (
            "id",
            "url",
            "title",
            "name",
            "description",
            "category",
            "aggregation_type",
            "wms_url",
            "counts",
        )


class ExposureLayerGeoPackageSerializer(serializers.BaseSerializer):

    def to_representation(self, instance):
        bbox = self.context.get("bbox")
        bbox_ewkt = utils.get_ewkt_from_bbox(*bbox) if bbox else None
        file_name = utils.generate_geopackage_download_name(
            instance.name, bbox=bbox)
        gpkg_path = Path(mkdtemp()) / file_name
        qualified_layer_name = "exposures.{}".format(instance.name)
        return_code, stdout, stderr = utils.prepare_layer_geopackage_download(
            qualified_layer_name, gpkg_path, bbox_ewkt=bbox_ewkt)
        if return_code != 0:
            raise RuntimeError("Could not generate geopackage")
        return {"path": gpkg_path}