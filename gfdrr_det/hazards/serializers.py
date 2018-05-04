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

import json
import logging
from collections import OrderedDict

from django.core.exceptions import ObjectDoesNotExist
from django.contrib.gis import geos
from rest_framework import serializers
from rest_framework_gis import serializers as gis_serializers
from rest_framework_gis.fields import GeoJsonDict

from ..models import HeveDetails

LOGGER = logging.getLogger(__name__)


class HazardEventSerializer(serializers.Serializer):

    def to_representation(self, instance):
        feature = OrderedDict()
        feature["id"] = instance.event_id
        feature["type"] = "Feature"
        feature["geometry"] = GeoJsonDict(
            json.loads(
                geos.GEOSGeometry(instance.geom).envelope.geojson
            )
        )
        further_info = self.context["events_info"][str(instance.event_id)]
        feature["properties"] = self.get_feature_properties(
            instance, further_info)
        return feature

    def get_feature_properties(self, instance, further_info):
        result = OrderedDict()
        result["calculation_method"] = instance.calculation_method
        result["frequency"] = instance.frequency
        result["occurrence_probability"] = instance.occurrence_probability
        result["occurrence_time_start"] = instance.occurrence_time_start
        result["occurrence_time_end"] = instance.occurrence_time_end
        result["occurrence_time_span"] = instance.occurrence_time_span
        result["trigger_hazard_type"] = instance.trigger_hazard_type
        result["trigger_process_type"] = instance.trigger_process_type
        result["average_event_intensity"] = instance.average_event_intensity
        result["minimum_event_intensity"] = instance.minimum_event_intensity
        result["maximum_event_intensity"] = instance.maximum_event_intensity
        result["number_of_footprints"] = further_info["num_footprints"]
        return result


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
        return obj.details["hazard_type"]

    def get_wms_url(self, obj):
        try:
            wms_link = obj.layer.link_set.get(link_type="OGC:WMS").url
        except ObjectDoesNotExist:
            wms_link = None
        return wms_link


class HazardLayerDetailSerializer(serializers.Serializer):
    title = serializers.CharField(source="layer.title")
    name = serializers.CharField(source="layer.name")
    description = serializers.SerializerMethodField()
    hazard_type = serializers.SerializerMethodField()
    url = serializers.HyperlinkedIdentityField(view_name="hazards-detail")
    wms_url = serializers.SerializerMethodField()
    events = serializers.SerializerMethodField()
    time_start = serializers.SerializerMethodField()
    time_end = serializers.SerializerMethodField()
    time_duration = serializers.SerializerMethodField()
    bibliography = serializers.SerializerMethodField()

    class Meta:
        model = HeveDetails
        fields = (
            "id",
            "url",
            "title",
            "name",
            "description",
            "hazard_type",
            "wms_url",
            "events"
        )

    def get_description(self, obj):
        return obj.details["description"]

    def get_hazard_type(self, obj):
        return obj.details["hazard_type"]

    def get_time_start(self, obj):
        return obj.details["time_start"]

    def get_time_end(self, obj):
        return obj.details["time_end"]

    def get_time_duration(self, obj):
        return obj.details["time_duration"]

    def get_bibliography(self, obj):
        return obj.details["bibliography"]

    def get_wms_url(self, obj):
        try:
            wms_link = obj.layer.link_set.get(
                link_type="OGC:WMS").url
        except ObjectDoesNotExist:
            wms_link = None
        return wms_link

    def get_events(self, obj):
        serializer = HazardEventSerializer(
            instance=self.context["events"],
            many=True,
            context=self.context
        )
        return serializer.data
