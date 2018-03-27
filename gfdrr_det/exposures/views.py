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

from django.db import connections
from django.db.models import Q
from django.conf import settings
from django.shortcuts import get_object_or_404
from django_filters import rest_framework as django_filters
from geonode.layers.models import Layer
from rest_framework import viewsets
from rest_framework.exceptions import ParseError
from rest_framework.filters import OrderingFilter
from rest_framework.filters import SearchFilter
from rest_framework.response import Response
from rest_framework_gis.pagination import GeoJsonPagination
from rest_framework_gis.filters import InBBoxFilter

from . import serializers
from . import utils
from ..constants import DatasetType


def get_filter_bbox(bbox_string):
    try:
        return tuple(float(i) for i in bbox_string.split(","))
    except ValueError:
        raise ParseError("Invalid bbox string")


# This class is inspired by django-rest-framework-gis' InBBoxFilter, with
# some modifications to make it suitable for a Geonode layer, which does
# not store bbox information on a geodjango field
class GeonodeLayerInBBoxFilterBackend(InBBoxFilter):
    bbox_param = "bbox"  # URL query param which contains the BBOX

    def get_filter_bbox(self, request):
        bbox_string = request.query_params.get(self.bbox_param, None)
        if bbox_string is not None:
            try:
                result = get_filter_bbox(bbox_string)
            except ValueError:
                raise ParseError("Invalid bbox string supplied for "
                                 "parameter {0}".format(self.bbox_param))
        else:
            result = None
        return result

    def filter_queryset(self, request, queryset, view):
        result = queryset
        bbox = self.get_filter_bbox(request)
        if bbox is not None:
            x0, y0, x1, y1 = bbox
            # this expression was taken from geonode's
            # geonode.api.resourcebase_api.CommonModelApi.filter_bbox()
            # method
            intersects = ~(Q(bbox_x0__gt=x1) | Q(bbox_x1__lt=x0) |
                           Q(bbox_y0__gt=y1) | Q(bbox_y1__lt=y0))
            result = queryset.filter(intersects)
        return result


class ExposureLayerListFilterSet(django_filters.FilterSet):
    aggregation_type = django_filters.ChoiceFilter(
        name="hevedetails__details__area_type",
        empty_label="",
        choices=[
            (v, v) for v in settings.HEV_E[
                "EXPOSURES"]["area_type_mappings"].keys()
        ],
    )
    category = django_filters.MultipleChoiceFilter(
        name="hevedetails__details__category",
        choices=[
            (v, v) for v in settings.HEV_E[
                "EXPOSURES"]["category_mappings"].keys()
        ],
    )

    class Meta:
        model = Layer
        fields = (
            "category",
            "aggregation_type",
        )


# TODO: Add permissions
# TODO: Enhance ordering in order to support ordering by category
# TODO: Enhance ordering in order to support ordering by aggregation_type
class ExposureLayerViewSet(viewsets.ReadOnlyModelViewSet):
    pagination_class = GeoJsonPagination
    queryset = Layer.objects.filter(
        hevedetails__dataset_type=DatasetType.exposure.name)
    filter_backends = (
        django_filters.DjangoFilterBackend,
        GeonodeLayerInBBoxFilterBackend,
        OrderingFilter,
        SearchFilter,
    )
    filter_class = ExposureLayerListFilterSet
    ordering_fields = (
        "name",
    )
    ordering = ("name",)  # default ordering
    search_fields = (
        "abstract",
        "name",
    )

    def get_serializer_class(self):
        if self.action == "list":
            result = serializers.ExposureLayerListSerializer
        else:
            result = serializers.ExposureLayerSerializer
        return result

    def retrieve(self, request, pk=None, *args, **kwargs):
        layer = get_object_or_404(Layer, pk=pk)
        bbox_string = request.query_params.get("bbox")
        if bbox_string is None:
            taxonomic_counts = layer.hevedetails.details
        else:
            bbox = get_filter_bbox(bbox_string)
            db_connection = connections["hev_e"]
            with db_connection.cursor() as db_cursor:
                taxonomic_counts = utils.calculate_taxonomic_counts(
                    db_cursor,
                    layer.name,
                    layer.hevedetails.details["taxonomy_source"],
                    bbox_ewkt=utils.get_ewkt_from_bbox(*bbox, srid=4326)
                )
        serializer = self.get_serializer_class()(
            layer,
            context={
                "request": request,
                "taxonomic_counts": taxonomic_counts,
            }
        )
        return Response(serializer.data)
