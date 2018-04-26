#########################################################################
#
# Copyright 2018, GeoSolutions Sas.
# All rights reserved.
#
# This source code is licensed under the BSD-style license found in the
# LICENSE file in the root directory of this source tree.
#
#########################################################################

"""Serializers for HEV-E hazards"""

import logging

from django.core.exceptions import ObjectDoesNotExist
from rest_framework import serializers
from rest_framework_gis import serializers as gis_serializers

from gfdrr_det.management.commands._utils import get_mapped_category
from ..constants import DatasetType
from ..models import HeveDetails

LOGGER = logging.getLogger(__name__)


class HazardLayerListSerializer(gis_serializers.GeoFeatureModelSerializer):
    bbox = gis_serializers.GeometrySerializerMethodField()
    title = serializers.CharField(source="layer.title")
    name = serializers.CharField(source="layer.name")
    description = serializers.SerializerMethodField()
    hazard_type = serializers.SerializerMethodField()
    url = serializers.HyperlinkedIdentityField(view_name="hazards-detail")
    wms_url = serializers.SerializerMethodField()

    class Meta:
        model = HeveDetails
        geo_field = "bbox"
        id_field = "id"
        fields = (
            "id",
            "url",
            "title",
            "name",
            "description",
            "hazard_type",
            "wms_url",
        )

    def get_bbox(self, obj):
        return obj.envelope.envelope

    def get_description(self, obj):
        return obj.details["description"]

    def get_hazard_type(self, obj):
        return get_mapped_category(
            obj.details["hazard_type"], DatasetType.hazard)

    def get_wms_url(self, obj):
        try:
            wms_link = obj.layer.link_set.get(link_type="OGC:WMS").url
        except ObjectDoesNotExist:
            wms_link = None
        return wms_link


class HazardLayerDetailSerializer(gis_serializers.GeoFeatureModelSerializer):
    title = serializers.CharField(source="layer.title")
    name = serializers.CharField(source="layer.name")
    description = serializers.SerializerMethodField()
    hazard_type = serializers.SerializerMethodField()
    url = serializers.HyperlinkedIdentityField(view_name="hazards-detail")
    wms_url = serializers.SerializerMethodField()

    class Meta:
        model = HeveDetails
        geo_field = "envelope"
        id_field = "id"
        fields = (
            "id",
            "url",
            "title",
            "name",
            "description",
            "hazard_type",
            "wms_url",
        )

    def get_description(self, obj):
        return obj.details["description"]

    def get_hazard_type(self, obj):
        return get_mapped_category(
            obj.details["hazard_type"], DatasetType.hazard)

    def get_wms_url(self, obj):
        try:
            wms_link = obj.layer.link_set.get(link_type="OGC:WMS").url
        except ObjectDoesNotExist:
            wms_link = None
        return wms_link