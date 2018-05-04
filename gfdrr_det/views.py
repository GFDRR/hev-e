#########################################################################
#
# Copyright 2018, GeoSolutions Sas.
# All rights reserved.
#
# This source code is licensed under the BSD-style license found in the
# LICENSE file in the root directory of this source tree.
#
#########################################################################

"""views for HEV-E"""

import logging

from django.conf import settings
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from django_filters import rest_framework as filters
from oseoserver import models as oseoserver_models
from oseoserver import requestprocessor
from pathlib2 import Path
from rest_framework import viewsets
from rest_framework import status
from rest_framework.filters import SearchFilter
from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework_gis.filterset import GeoFilterSet
from rest_framework_gis.filters import InBBoxFilter
from sendfile import sendfile

from . import models
from . import serializers
from .constants import DatasetType

logger = logging.getLogger(__name__)

# TODO: Add permission_classes

class AdministrativeDivisionFilter(GeoFilterSet):

    class Meta:
        model = models.AdministrativeDivision
        fields = [
            "level",
        ]


class AdministrativeDivisionViewSet(viewsets.ReadOnlyModelViewSet):
    """API endpoint to show Administrative Divisions of all levels

    retrieve:
    Return a single Administrative Division

    list:
    Return all Administrative Divisions

    """

    queryset = models.AdministrativeDivision.objects.all()
    filter_backends = (
        filters.DjangoFilterBackend,
        SearchFilter,
        InBBoxFilter,
    )
    bbox_filter_include_overlapping = True
    filter_class = AdministrativeDivisionFilter
    search_fields = (
        "name",
        "name_eng",
        "name_local",
    )

    def get_serializer_class(self):
        if self.action == "list":
            result = serializers.AdministrativeDivisionListSerializer
        else:
            result = serializers.AdministrativeDivisionDetailSerializer
        return result


class RegionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = models.Region.objects.all()
    serializer_class = serializers.RegionSerializer
    filter_backends = (
        filters.DjangoFilterBackend,
    )
    filter_fields = (
        "level",
    )


class CountryViewSet(viewsets.ReadOnlyModelViewSet):
    """API endpoint to show countries

    retrieve:
    Return a single country

    list:
    Return all countries

    """
    queryset = models.AdministrativeDivision.objects.filter(level=0)
    filter_backends = (
        filters.DjangoFilterBackend,
        SearchFilter,
        InBBoxFilter,
    )
    bbox_filter_include_overlapping = True
    search_fields = (
        "name",
        "name_eng",
        "name_local",
    )

    def get_serializer_class(self):
        if self.action == "list":
            result = serializers.AdministrativeDivisionListSerializer
        else:
            result = serializers.AdministrativeDivisionDetailSerializer
        return result


class RelevantCountryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = models.AdministrativeDivision.objects.filter(
        level=0,
        dataset_representations__isnull=False
    ).distinct()
    filter_backends = (
        filters.DjangoFilterBackend,
        SearchFilter,
        InBBoxFilter,
    )
    bbox_filter_include_overlapping = True
    filter_class = AdministrativeDivisionFilter
    search_fields = (
        "name",
        "name_eng",
        "name_local",
    )

    def get_serializer_class(self):
        if self.action == "list":
            result = serializers.AdministrativeDivisionListSerializer
        else:
            result = serializers.AdministrativeDivisionDetailSerializer
        return result


class DatasetRepresentationViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = models.DatasetRepresentation.objects.all()
    filter_backends = (
        SearchFilter,
        InBBoxFilter,
    )
    bbox_filter_include_overlapping = True
    filter_class = AdministrativeDivisionFilter
    search_fields = (
        "name",
        "dataset_type",
    )
    serializer_class = serializers.DatasetRepresentationSerializer


class OrderItemViewSet(viewsets.ModelViewSet):
    serializer_class = serializers.OrderItemSerializer
    queryset = oseoserver_models.OrderItem.objects.all()

    def list(self, request, *args, **kwargs):
        serializer = self.serializer_class(
            self.queryset, many=True, context={"request": request})
        return Response(serializer.data)

    def retrieve(self, request, pk=None, *args, **kwargs):
        order_item = self.get_object()
        serializer_class = {
            DatasetType.exposure.name: serializers.ExposureOrderItemSerializer,
            DatasetType.vulnerability.name: (
                serializers.VulnerabilityOrderItemSerializer),
            DatasetType.hazard.name: serializers.HazardOrderItemSerializer,
        }.get(order_item.item_specification.collection, self.serializer_class)
        serializer = serializer_class(
            order_item, context={"request": request})
        return Response(serializer.data)


class OrderViewSet(viewsets.ViewSet):
    serializer_class = serializers.OrderSerializer
    queryset = oseoserver_models.Order.objects.all()

    def list(self, request, *args, **kwargs):
        serializer = self.serializer_class(
            self.queryset, many=True, context={"request": request})
        return Response(serializer.data)

    def retrieve(self, request, pk=None, *args, **kwargs):
        order = get_object_or_404(self.queryset, pk=pk)
        serializer = self.serializer_class(
            order, context={"request": request})
        return Response(serializer.data)

    # TODO: Handle errors that may arise from incorrect request data
    def create(self, request, *args, **kwargs):
        user = get_user_model().objects.filter(is_superuser=True).first()
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            order = serializer.save(user=user)
            requestprocessor.moderate_order(order)
            order.refresh_from_db()
            response_serializer = self.serializer_class(
                order, context={"request": request})
            result = Response(
                response_serializer.data,
                status=status.HTTP_201_CREATED
            )
        else:
            result = Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )
        return result


@api_view()
def retrieve_download(request, file_hash=None, **kwargs):
    downloads_dir = Path(settings.HEV_E["general"]["downloads_dir"])
    pre_generated_dir = Path(
        settings.HEV_E["general"]["pre_generated_files_dir"])
    for directory in (downloads_dir, pre_generated_dir):
        try:
            path = list(directory.glob("*{}*".format(file_hash)))[0]
            break
        except IndexError:
            pass
    else:
        raise RuntimeError(
            "Could not find the file with hash {}".format(file_hash))
    mimetype = {
        "application/vnd.opengeospatial.geopackage+sqlite3": ".gpkg",
        "application/zip": ".zip",
    }.get(Path(path).suffix)
    return sendfile(
        request=request,
        filename=str(path),
        attachment=True,
        attachment_filename=path.name,
        mimetype=mimetype,
        encoding=None
    )
