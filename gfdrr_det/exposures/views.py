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

from collections import namedtuple
from django.db.models import Q
from django.db import connections
from django.shortcuts import get_object_or_404
from django_filters import rest_framework as django_filters
from django.conf import settings
from geonode.layers.models import Layer
from geonode.base.models import HierarchicalKeyword
from rest_framework import viewsets
from rest_framework.decorators import detail_route
from rest_framework.exceptions import ParseError
from rest_framework.filters import OrderingFilter
from rest_framework.filters import SearchFilter
from rest_framework.response import Response
from rest_framework_gis.pagination import GeoJsonPagination
from rest_framework_gis.filters import InBBoxFilter

from . import serializers


# This class is inspired by django-rest-framework-gis' InBBoxFilter, with
# some modifications to make it suitable for a Geonode layer, which does
# not store bbox information on a geodjango field
class GeonodeLayerInBBoxFilterBackend(InBBoxFilter):
    bbox_param = "bbox"  # URL query param which contains the BBOX

    def get_filter_bbox(self, request):
        bbox_string = request.query_params.get(self.bbox_param, None)
        if bbox_string is not None:
            try:
                result = tuple(float(i) for i in bbox_string.split(","))
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


def get_category_qs(request):
    result = HierarchicalKeyword.objects.none()
    if request is not None:
        categories = settings.HEV_E["EXPOSURES"]["category_mappings"].keys()
        result = HierarchicalKeyword.objects.filter(name__in=categories)
    return result


def get_area_type_qs(request):
    result = HierarchicalKeyword.objects.none()
    if request is not None:
        aggregation_types = settings.HEV_E[
            "EXPOSURES"]["area_type_mappings"].keys()
        result = HierarchicalKeyword.objects.filter(name__in=aggregation_types)
    return result


class ExposureLayerListFilterSet(django_filters.FilterSet):
    category = django_filters.ModelChoiceFilter(
        name="keywords",
        to_field_name="name",
        queryset=get_category_qs
    )
    aggregation_type = django_filters.ModelChoiceFilter(
        name="keywords",
        to_field_name="name",
        queryset=get_area_type_qs)


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
    queryset = Layer.objects.filter(keywords__name="exposure")
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
        elif self.action == "barchart":
            result = serializers.ExposureLayerBarChartSerializer
        else:
            result = serializers.ExposureLayerSerializer
        return result

    @detail_route(methods=["get"])
    def barchart(self, request, pk=None, **kwargs):
        variable = request.query_params.get("variable")
        aggregated_by = request.query_params.get("aggregated_by")
        layer = get_object_or_404(Layer, pk=pk)
        with connections["hev_e"].cursor() as db_cursor:
            barchart_data = get_exposure_barchart_data(
                db_cursor, layer, variable, aggregated_by)
        layer.barcharts = {
            barchart_data["title"]: barchart_data,
        }
        serializer = self.get_serializer(layer)
        return Response(serializer.data)


def get_exposure_barchart_data(db_cursor, layer, variable, aggregated_by):
    handler = {
        "occupancy": {
            "material": get_occupancy_by_material
        },
    }.get(variable, {}).get(aggregated_by)
    return handler(db_cursor, layer.name)


def get_occupancy_by_material(db_cursor, layer_name, count_occupants=False):
    count_type = "occupants" if count_occupants else 1
    query = """
    SELECT 
        taxonomy,
        COUNT({count_type})
    FROM exposures.{layer}
    GROUP BY taxonomy
    """.format(count_type=count_type, layer=layer_name)
    db_cursor.execute(query)
    ResultTuple = namedtuple(
        "ResultTuple", [col[0] for col in db_cursor.description])
    materials = (
        ("--", "Unknown material"),
        ("C", "Concrete, unknown reinforcement"),
        ("CR", "Concrete, reinforced"),
        ("CU", "Concrete, unreinforced"),
        ("SRC", "Concrete, composite with steel section"),
        ("S", "Steel"),
        ("ME", "Metal(except steel)"),
        ("M", "Masonry, unknown reinforcement"),
        ("MUR", "Masonry, unreinforced"),
        ("MCF", "Masonry, confined"),
        ("MR", "Masonry, reinforced"),
        ("E", "Earth, unknown reinforcement"),
        ("ER", "Earth, reinforced"),
        ("EU", "Earth, unreinforced"),
        ("W", "Wood"),
        ("MIX", "* MIX(material_a, material_b) *, mixed materials"
                "(hybrid or composite)"),
        ("INF", "Informal materials"),
        ("MATO", "Other material"),
    )
    counts = {}
    for row in db_cursor.fetchall():
        record = ResultTuple(*row)
        building_material = process_gem_taxonomy_entry(
            record.taxonomy, materials)
        counts.setdefault(building_material, 0)
        counts[building_material] += record.count
    result = {
        "title": "Occupancy by material",
        "occupancy": counts.values(),
        "material": counts.keys(),
    }
    print("result: {}".format(result))
    return result


def process_gem_taxonomy_entry(taxonomy, mapping):
    code_separator = "/"
    multiple_categories_separator = "+"
    parsed_taxonomy = taxonomy.split(
        code_separator)[0].split(multiple_categories_separator)[0]
    for code, description in mapping:
        if parsed_taxonomy == code or parsed_taxonomy == description:
            result = description
            break
    else:
        result = None
    return result
