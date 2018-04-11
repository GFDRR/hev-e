#########################################################################
#
# Copyright 2018, GeoSolutions Sas.
# All rights reserved.
#
# This source code is licensed under the BSD-style license found in the
# LICENSE file in the root directory of this source tree.
#
#########################################################################

"""Django REST framework serializers for GFDRR-DET"""

import logging
import re
from urlparse import urlparse

from django.conf import settings
from django.template.loader import get_template
from oseoserver import models as oseoserver_models
from oseoserver.operations.submit import submit
from pathlib2 import Path
from pyxb.bundles.opengis import oseo_1_0 as oseo
from rest_framework.reverse import reverse
from rest_framework_gis.serializers import GeoFeatureModelSerializer
from rest_framework.serializers import HyperlinkedModelSerializer
from rest_framework import serializers

from . import models
from .constants import DatasetType

logger = logging.getLogger(__name__)


class AdministrativeDivisionDetailSerializer(GeoFeatureModelSerializer):
    url = serializers.HyperlinkedIdentityField(
        view_name="administrativedivision-detail",
        lookup_field="pk",
    )
    region = serializers.HyperlinkedRelatedField(
        read_only=True,
        view_name="region-detail",
    )
    parent = serializers.HyperlinkedRelatedField(
        read_only=True,
        view_name="administrativedivision-detail",
    )
    datasets = serializers.HyperlinkedRelatedField(
        read_only=True,
        source="dataset_representations",
        many=True,
        view_name="datasetrepresentation-detail",
    )

    class Meta:
        model = models.AdministrativeDivision
        geo_field = "geom"
        fields = (
            "url",
            "level",
            "iso",
            "name",
            "name_eng",
            "name_local",
            "type",
            "engtype",
            "unregion",
            "population",
            "sqkm",
            "pop_sqkm",
            "region",
            "parent",
            "datasets",
        )

class AdministrativeDivisionListSerializer(GeoFeatureModelSerializer):
    url = serializers.HyperlinkedIdentityField(
        view_name="administrativedivision-detail",
        lookup_field="pk",
    )
    region = serializers.HyperlinkedRelatedField(
        read_only=True,
        view_name="region-detail",
    )
    parent = serializers.HyperlinkedRelatedField(
        read_only=True,
        view_name="administrativedivision-detail",
    )
    datasets = serializers.HyperlinkedRelatedField(
        read_only=True,
        source="dataset_representations",
        many=True,
        view_name="datasetrepresentation-detail",
    )

    class Meta:
        model = models.AdministrativeDivision
        geo_field = "geom"
        fields = (
            "url",
            "level",
            "iso",
            "name",
            "type",
            "unregion",
            "region",
            "parent",
            "datasets",
        )


class RegionSerializer(HyperlinkedModelSerializer):

    class Meta:
        model = models.Region
        fields = (
            "url",
            "name",
            "level",
        )


class DatasetRepresentationSerializer(GeoFeatureModelSerializer):
    url = serializers.HyperlinkedIdentityField(
        view_name="datasetrepresentation-detail",
        lookup_field="pk",
    )

    class Meta:
        model = models.DatasetRepresentation
        geo_field = "geom"
        fields = (
            "url",
            "name",
            "dataset_type",
        )


class OrderItemSerializer(serializers.Serializer):
    id = serializers.HyperlinkedIdentityField(view_name="orderitem-detail")
    status = serializers.CharField(read_only=True)
    additional_status_info = serializers.CharField(read_only=True)
    layer = serializers.SerializerMethodField()
    format = serializers.SerializerMethodField()
    bbox = serializers.SerializerMethodField()
    taxonomic_categories = serializers.SerializerMethodField()
    created_on = serializers.DateTimeField(read_only=True)
    expires_on = serializers.DateTimeField(read_only=True)
    download_url = serializers.SerializerMethodField()

    def get_layer(self, obj):
        return obj.identifier

    def get_bbox(self, obj):
        options = obj.export_options()
        return options.get("bbox")

    def get_taxonomic_categories(self, obj):
        options = obj.export_options()
        return options.get("exposureTaxonomicCategory")

    def get_format(self, obj):
        options = obj.export_options()
        return options.get("format")

    def get_download_url(self, obj):
        if obj.available:
            file_hash = [i for i in obj.url.split("/") if i != ""][-1]
            result = reverse(
                "retrieve_download",
                kwargs={
                    "file_hash": file_hash,
                },
                request=self.context.get("request")
            )
        else:
            result = None
        return result


class OrderSerializer(serializers.BaseSerializer):

    def to_representation(self, instance):
        items = oseoserver_models.OrderItem.objects.filter(
            batch__order=instance)
        serialized_items = []
        for item in items:
            serializer = OrderItemSerializer(
                item,
                context={"request": self.context.get("request")}
            )
            serialized_items.append(serializer.data)
        return {
            "id": reverse(
                "order-detail",
                kwargs={"pk": instance.id},
                request=self.context.get("request")
            ),
            "status": instance.status,
            "additional_status_info": instance.additional_status_info,
            "created_on": instance.created_on,
            "order_items": serialized_items,
        }

    def create(self, validated_data):
        requested_items = validated_data["order_items"]
        template_order_items = []
        for index, requested_item in enumerate(requested_items):
            collection, layer_name = requested_item["layer"].partition(
                ":")[::2]
            categories = requested_item["taxonomic_categories"] or []
            template_item = {
                "id": "item{}".format(index),
                "product_id": "{}".format(requested_item["layer"]),
                "collection": collection,
                "options": {
                    "format": requested_item["format"],
                    "bbox": requested_item.get("bbox"),
                    "taxonomic_categories": [c.lower() for c in categories]
                }
            }
            template_order_items.append(template_item)
        request_template = get_template("gfdrr_det/download_request.xml")
        request_xml = request_template.render(
            context={
                "notification_email": validated_data.get("notification_email"),
                "order_items": template_order_items
            }
        )
        oseo_request = oseo.CreateFromDocument(request_xml)
        user = validated_data.get("user")
        oseo_response, order = submit(oseo_request, user)
        return order

    def to_internal_value(self, data):
        requested_items = data.get("order_items")
        if not requested_items:
            raise serializers.ValidationError(
                {"order_items": "this field is required"})
        order_items = []
        for item in requested_items:
            layer = item.get("layer")
            if not layer:
                raise serializers.ValidationError(
                    {"layer": "this field is required"})
            collection, layer_name = layer.partition(":")[::2]
            if collection not in DatasetType.__members__:
                raise serializers.ValidationError(
                    {"layer": "invalid collection"})
            format_ = item.get("format", "").lower()
            if not format_:
                raise serializers.ValidationError(
                    {"format": "this field is required"})
            options_conf = settings.OSEOSERVER_PROCESSING_OPTIONS
            format_choices = [
                i["choices"] for i in options_conf if i["name"] == "format"][0]
            if format_ not in format_choices:
                raise serializers.ValidationError({"format": "invalid value"})
            bbox_str = item.get("bbox")
            if bbox_str is not None:
                try:
                    x0, y0, x1, y1 = (float(i) for i in bbox_str.split(","))
                except ValueError:
                    raise serializers.ValidationError(
                        {"bbox": "Invalid numeric values"})
                valid_x = -180 <= x0 <= 180 and -180 <= x1 <= 180
                valid_y = -90 <= y0 <= 90 and -90 <= y1 <= 90
                if not (valid_x and valid_y):
                    raise serializers.ValidationError(
                        {"bbox": "Invalid values. Expecting x0,y0,x1,y1"})
                else:
                    parsed_bbox = {
                        "x0": x0,
                        "y0": y0,
                        "x1": x1,
                        "y1": y1,
                    }
            else:
                parsed_bbox = None
            cats = item.get("taxonomic_categories")
            taxonomic_categories = [
                c.lower() for c in cats.split(",")] if cats else cats
            order_item = {
                "layer": layer,
                "format": format_,
                "bbox": parsed_bbox,
                "taxonomic_categories": taxonomic_categories
            }
            order_items.append(order_item)
        notification_email = data.get("notification_email")
        result = {
            "order_items": order_items
        }
        if notification_email is not None:
            result["notification_email"] = notification_email
        return result


def parse_bbox(bbox_str):
    x0, y0, x1, y1 = (float(i) for i in bbox_str.split(","))
    valid_x0 = -180 < x0 < 180
    valid_x1 = -180 < x1 < 180
    valid_y0 = -90 < x0 < 90
    valid_y1 = -90 < x1 < 90
    if not (valid_x0 and valid_x1 and valid_y0 and valid_y1):
        raise serializers.ValidationError()
    else:
        return {
            "x0": x0,
            "y0": y0,
            "x1": x1,
            "y1": y1,
        }

