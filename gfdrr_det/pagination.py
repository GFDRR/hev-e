#########################################################################
#
# Copyright 2018, GeoSolutions Sas.
# All rights reserved.
#
# This source code is licensed under the BSD-style license found in the
# LICENSE file in the root directory of this source tree.
#
#########################################################################

"""Custom pagination classes for HEV-E"""

from rest_framework.pagination import PageNumberPagination


class HevePagination(PageNumberPagination):
    page_size_query_param = "page_size"
    max_page_size = 100