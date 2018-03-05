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

from django.conf.urls import url, include
from django.views.generic import TemplateView

from geonode.urls import urlpatterns

urlpatterns += [
    # include your urls here

]

urlpatterns = [#'',
               url(r'^$',
                   TemplateView.as_view(
                       template_name='site_index.html'),
                   name='home'),
               ] + urlpatterns
