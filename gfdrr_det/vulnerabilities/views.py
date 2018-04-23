#########################################################################
#
# Copyright 2018, GeoSolutions Sas.
# All rights reserved.
#
# This source code is licensed under the BSD-style license found in the
# LICENSE file in the root directory of this source tree.
#
#########################################################################

"""View classes for HEV-e Vulnerabilities"""

import logging

from django.db import connections
from django_filters import rest_framework as django_filters
from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.settings import api_settings
from rest_framework_csv.renderers import CSVRenderer

from . import serializers
from . import filters
from . import utils
from ..constants import DatasetType
from ..models import HeveDetails
from ..pagination import HevePagination


LOGGER = logging.getLogger(__name__)


class VulnerabilityViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = HeveDetails.objects.filter(
        dataset_type=DatasetType.vulnerability.name)
    filter_backends = (
        filters.HeveInBboxFilter,
        django_filters.DjangoFilterBackend,
    )
    filter_class = filters.VulnerabilityLayerListFilterSet
    bbox_filter_field = "envelope"
    pagination_class = HevePagination
    serializer_class = serializers.VulnerabilityListSerializer
    renderer_classes = tuple(api_settings.DEFAULT_RENDERER_CLASSES) + (
        CSVRenderer,
    )

    def retrieve(self, request, *args, **kwargs):
        heve_details_instance = self.get_object()
        type_ = heve_details_instance.details["vulnerability_type"]
        record_getter, serializer_class = {
            "vulnerability_function": (
                utils.get_extended_vulnerability_record,
                serializers.VulnerabilityDetailSerializer,
            ),
            "fragility_function": (
                utils.get_extended_fragility_record,
                serializers.FragilityDetailSerializer,
            ),
            "damage_to_loss_function": (
                utils.get_extended_damage_to_loss_record,
                serializers.DamageToLossDetailSerializer,
            ),
        }.get(type_, (None, self.serializer_class))
        if record_getter is not None:
            with connections["hev_e"].cursor() as db_cursor:
                record = record_getter(
                    db_cursor,
                    heve_details_instance.details["record_id"]
                )
            serializer = serializer_class(
                instance={
                    "heve_details": heve_details_instance,
                    "record": record,
                },
                context={"request": request}
            )
        else:
            serializer = serializer_class(
                instance=heve_details_instance,
                context={"request": request}
            )
        return Response(serializer.data)
