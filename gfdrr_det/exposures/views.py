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
from django.shortcuts import get_object_or_404
from django_filters import rest_framework as django_filters
from django_filters.views import FilterMixin
from geonode.layers.models import Layer
from rest_framework import viewsets
from rest_framework.filters import OrderingFilter
from rest_framework.filters import SearchFilter
from rest_framework.renderers import BrowsableAPIRenderer
from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response
from rest_framework_gis.pagination import GeoJsonPagination

from .. import utils as general_utils
from ..constants import DatasetType
from . import filters
from . import serializers
from . import utils


# TODO: Add permissions
# TODO: Enhance ordering in order to support ordering by category
# TODO: Enhance ordering in order to support ordering by aggregation_type
class ExposureLayerViewSet(FilterMixin, viewsets.ReadOnlyModelViewSet):
    pagination_class = GeoJsonPagination
    queryset = Layer.objects.filter(
        hevedetails__dataset_type=DatasetType.exposure.name)
    filter_backends = (
        django_filters.DjangoFilterBackend,
        filters.GeonodeLayerInBBoxFilterBackend,
        OrderingFilter,
        SearchFilter,
    )
    filter_class = filters.ExposureLayerListFilterSet
    ordering_fields = (
        "name",
    )
    ordering = ("name",)  # default ordering
    search_fields = (
        "abstract",
        "name",
    )
    renderer_classes = (
        JSONRenderer,
        BrowsableAPIRenderer,
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
        bbox = filters.get_filter_bbox(bbox_string) if bbox_string else None
        serializer_context = {
            "bbox": bbox,
            "request": request,
            "taxonomic_counts": layer.hevedetails.details[
                "taxonomic_categories"]["counts"]
        }
        response_headers = None
        if bbox_string is None:
            serializer = self.get_serializer_class()(
                layer, context=serializer_context)
        else:
            db_connection = connections["hev_e"]
            with db_connection.cursor() as db_cursor:
                taxonomic_counts = utils.calculate_taxonomic_counts(
                    db_cursor,
                    layer.name,
                    layer.hevedetails.details["taxonomy_source"],
                    bbox_ewkt=general_utils.get_ewkt_from_bbox(
                        *bbox, srid=4326)
                )
            serializer_context["taxonomic_counts"] = taxonomic_counts
            serializer = self.get_serializer_class()(
                layer, context=serializer_context)
        return Response(serializer.data, headers=response_headers)
