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

from django_filters import rest_framework as filters
from rest_framework.filters import SearchFilter
from rest_framework import viewsets
from rest_framework_gis.filterset import GeoFilterSet
from rest_framework_gis.filters import InBBoxFilter

from . import models
from . import serializers

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
