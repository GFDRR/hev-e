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

from django.conf import settings
from django.contrib.gis import geos
from rest_framework import serializers
from rest_framework_gis import serializers as gis_serializers

from geonode.layers.models import Layer


class ExposureLayerListSerializer(gis_serializers.GeoFeatureModelSerializer):
    category = serializers.SerializerMethodField()
    aggregation_type = serializers.SerializerMethodField()
    bbox = gis_serializers.GeometrySerializerMethodField()
    description = serializers.CharField(source="abstract")

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

    def get_category(self, obj):
        exposure_categories = settings.HEV_E[
            "EXPOSURES"]["category_mappings"].keys()
        category = obj.keywords.filter(name__in=exposure_categories).first()
        return category.name

    def get_aggregation_type(self, obj):
        aggregation_types = settings.HEV_E[
            "EXPOSURES"]["area_type_mappings"].keys()
        type_ = obj.keywords.filter(name__in=aggregation_types).first()
        return type_.name if type_ is not None else None


    class Meta:
        model = Layer
        geo_field = "bbox"
        fields = (
            "name",
            "description",
            "category",
            "aggregation_type",
        )
