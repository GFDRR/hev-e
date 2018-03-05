"""views for GFDRR-DET"""

from django.db.models import Q
from django_filters import rest_framework as filters
from rest_framework.filters import SearchFilter
from rest_framework import viewsets
from rest_framework_gis.filterset import GeoFilterSet
from rest_framework_gis.filters import InBBoxFilter
from rest_framework_gis.pagination import GeoJsonPagination

from . import models
from . import serializers

# TODO: Add schema generation
# TODO: Add permission_classes

class AdministrativeDivisionFilter(GeoFilterSet):

    class Meta:
        model = models.AdministrativeDivision
        fields = [
            "level",
        ]


class AdministrativeDivisionViewSet(viewsets.ReadOnlyModelViewSet):
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
