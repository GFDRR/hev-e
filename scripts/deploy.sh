#!/bin/bash
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

source ~/.virtualenvs/det-dev/bin/activate

pushd $(dirname $0)/../

DJANGO_SETTINGS_MODULE=gfdrr_det.gfdrr_det_settings paver update

touch gfdrr_det/wsgi.py

exit 0
