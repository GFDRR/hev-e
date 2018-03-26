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

from django.core.exceptions import ObjectDoesNotExist
from django.contrib.gis import geos
from rest_framework import serializers
from rest_framework_gis import serializers as gis_serializers

from geonode.layers.models import Layer


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
            "data": obj.hevedetails.details["taxonomic_categories"]["counts"]
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
