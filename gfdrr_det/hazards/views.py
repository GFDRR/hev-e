#########################################################################
#
# Copyright 2018, GeoSolutions Sas.
# All rights reserved.
#
# This source code is licensed under the BSD-style license found in the
# LICENSE file in the root directory of this source tree.
#
#########################################################################

import logging

from django.db import connections
from django.contrib.gis.geos import Polygon
from django_filters.views import FilterMixin
from django_filters import rest_framework as django_filters
from rest_framework import viewsets
from rest_framework.serializers import ValidationError
from rest_framework.renderers import BrowsableAPIRenderer
from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response
from rest_framework_gis.pagination import GeoJsonPagination

from gfdrr_det.management.commands.ingesthazards import get_materialized_view
from .. import filters as general_filters
from ..models import HeveDetails
from ..constants import DatasetType
from . import filters
from . import serializers

LOGGER = logging.getLogger(__name__)


class HazardLayerViewSet(FilterMixin, viewsets.ReadOnlyModelViewSet):
    pagination_class = GeoJsonPagination
    queryset = HeveDetails.objects.filter(dataset_type=DatasetType.hazard.name)
    renderer_classes = (
        JSONRenderer,
        BrowsableAPIRenderer,
    )
    serializer_class = serializers.HazardLayerListSerializer
    filter_backends = (
        django_filters.DjangoFilterBackend,
    )
    bbox_filter_field = "envelope"
    filter_class = filters.HazardLayerListFilterSet

    def get_serializer_class(self):
        if self.action == "list":
            result = serializers.HazardLayerListSerializer
        else:
            result = serializers.HazardLayerDetailSerializer
        return result

    def retrieve(self, request, *args, **kwargs):
        bbox_param = request.query_params.get("bbox")
        bbox_ewkt = get_filter_bbox(bbox_param).ewkt if bbox_param else None
        heve_details = self.get_object()
        with connections["hev_e"].cursor() as db_cursor:
            events = get_materialized_view(
                db_cursor, heve_details.layer.name,
                bbox_ewkt=bbox_ewkt,
            )
        serializer_class = self.get_serializer_class()
        serializer = serializer_class(
            instance=heve_details,
            context={
                "request": request,
                "events": events,
                "events_info": heve_details.details.get("events"),
            }
        )
        return Response(serializer.data)

    def filter_queryset(self, queryset):
        if self.action == "list":
            backends = list(self.filter_backends) + [
                general_filters.HeveInBboxFilter,
            ]
        else:
            backends = list(self.filter_backends)
        LOGGER.debug("filter backends in use: %s", (backends,))
        for backend in backends:
            queryset = backend().filter_queryset(self.request, queryset, self)
        return queryset


def get_filter_bbox(bbox_string):
    try:
        x0, y0, x1, y1 = (float(n) for n in bbox_string.split(','))
    except ValueError:
        raise ValidationError({"bbox": "Invalid value"})
    return Polygon.from_bbox((x0, y0, x1, y1))
