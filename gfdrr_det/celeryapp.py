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

from __future__ import absolute_import

from celery import Celery

app = Celery('gfdrr_det')
app.config_from_object('django.conf:settings', namespace="CELERY")
app.autodiscover_tasks()
