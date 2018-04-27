#########################################################################
#
# Copyright 2018, GeoSolutions Sas.
# All rights reserved.
#
# This source code is licensed under the BSD-style license found in the
# LICENSE file in the root directory of this source tree.
#
#########################################################################

"""Filter utilities for views"""

from django.db.models import Q
from django_filters import rest_framework as django_filters
from rest_framework_gis.filters import InBBoxFilter


def filter_category(queryset, name, value):
    """Filter by category

    This function exists because the current django version does not
    support using the ``in`` lookup expression in fields of type
    ``JSONField``.

    We work around this limitation by creating a Q object and OR'ing all
    of the input values

    """

    lookup_expression = "__".join((name, "exact"))
    if len(value) > 1:
        q_obj = Q(**{name: value[0]})
        for category in value[1:]:
            q_obj = q_obj | Q(**{lookup_expression: category})
        qs = queryset.filter(q_obj)
    elif len(value) == 1:
        qs = queryset.filter(**{lookup_expression:value[0]})
    else:
        qs = queryset
    return qs


class CategoryInFilter(django_filters.BaseInFilter, django_filters.CharFilter):
    pass


class HeveInBboxFilter(InBBoxFilter):
    bbox_param = "bbox"

    def filter_queryset(self, request, queryset, view):
        filter_field = getattr(view, "bbox_filter_field", None)
        if not filter_field:
            raise RuntimeError("Define the `bbox_filter_field` parameter")
        geodjango_filter = "intersects"
        bbox = self.get_filter_bbox(request)
        if not bbox:
            return queryset
        return queryset.filter(
            Q(**{'%s__%s' % (filter_field, geodjango_filter): bbox}))

