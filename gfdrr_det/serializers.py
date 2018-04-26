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

from django.conf import settings
from django.template.loader import get_template
from oseoserver import models as oseoserver_models
from oseoserver.operations.submit import submit
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
    created_on = serializers.DateTimeField(read_only=True)
    expires_on = serializers.DateTimeField(read_only=True)
    download_url = serializers.SerializerMethodField()

    def get_layer(self, obj):
        return obj.identifier

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


class ExposureOrderItemSerializer(OrderItemSerializer):
    format = serializers.SerializerMethodField()
    bbox = serializers.SerializerMethodField()
    taxonomic_categories = serializers.SerializerMethodField()

    def get_bbox(self, obj):
        options = obj.export_options()
        return options.get("bbox")

    def get_taxonomic_categories(self, obj):
        options = obj.export_options()
        return options.get("exposureTaxonomicCategory")

    def get_format(self, obj):
        options = obj.export_options()
        return options.get("format")


class VulnerabilityOrderItemSerializer(OrderItemSerializer):
    format = serializers.SerializerMethodField()

    def get_format(self, obj):
        options = obj.export_options()
        return options.get("vulnerabilityFormat")


class OrderSerializer(serializers.BaseSerializer):

    def to_representation(self, instance):
        items = oseoserver_models.OrderItem.objects.filter(
            batch__order=instance)
        serialized_items = []
        for item in items:
            item_dataset_type = item.identifier.partition(":")[0]
            serializer_class = {
                DatasetType.exposure.name: ExposureOrderItemSerializer,
                DatasetType.vulnerability.name: (
                    VulnerabilityOrderItemSerializer),
            }.get(item_dataset_type, OrderItemSerializer)
            serializer = serializer_class(
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
            collection, layer_name = _validate_layer(layer)
            format_ = item.get("format", "").lower()
            if not format_:
                raise serializers.ValidationError(
                    {"format": "this field is required"})
            _validate_format(format_, collection)
            bbox_str = item.get("bbox")
            cats = item.get("taxonomic_categories")
            order_item = {
                "layer": layer,
                "format": format_,
                "bbox": _parse_bbox(bbox_str) if bbox_str else bbox_str,
                "taxonomic_categories": _parse_categories(
                    cats, collection) if cats else cats
            }
            order_items.append(order_item)
        notification_email = data.get("notification_email")
        result = {
            "order_items": order_items
        }
        if notification_email is not None:
            result["notification_email"] = notification_email
        return result


def _validate_layer(layer_str):
    collection, layer_name = layer_str.partition(":")[::2]
    if collection not in DatasetType.__members__:
        raise serializers.ValidationError(
            {"layer": "invalid collection"})
    return collection, layer_name


def _validate_format(format_str, collection):
    options_conf = settings.OSEOSERVER_PROCESSING_OPTIONS
    option_name = {
        "vulnerability": "vulnerabilityFormat"
    }.get(collection, "format")
    format_choices = [
        i["choices"] for i in options_conf if i["name"] == option_name][0]
    if format_str not in format_choices:
        raise serializers.ValidationError({"format": "invalid value"})


def _parse_categories(taxonomic_categories_str, collection_name):
    main_cat = {
        DatasetType.exposure.name: "EXPOSURES",
    }[collection_name]
    categories = []
    config = settings.HEV_E[main_cat]["taxonomy_mappings"]["mapping"]
    allowed_categories = config.keys()
    for cat_info in taxonomic_categories_str.split(","):
        info = cat_info.lower()
        try:
            cat_type, cat_value = info.split(":")
        except ValueError:
            raise serializers.ValidationError(
                {
                    "taxonomic_categories": "Invalid category {!r}. Please "
                                            "provide a value of the form "
                                            "category_type:"
                                            "category_name".format(
                                                info.encode("utf-8"))
                }
            )
        if cat_type not in allowed_categories:
            raise serializers.ValidationError(
                {
                    "taxonomic_categories": "Invalid category "
                                            "type: {}".format(cat_type)
                }
            )
        allowed_values = config.get(cat_type, {})
        if cat_value not in allowed_values.keys():
            raise serializers.ValidationError(
                {
                    "taxonomic_categories": "Invalid category "
                                            "value: {}".format(cat_value)
                }
            )
        categories.append(info)
    return categories


def _parse_bbox(bbox_str):
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
        return {
            "x0": x0,
            "y0": y0,
            "x1": x1,
            "y1": y1,
        }

