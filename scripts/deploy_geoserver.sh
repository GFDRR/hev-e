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

sudo wget http://build.geonode.org/geoserver/latest/geoserver-2.12.x.war -O downloaded/geoserver-2.12.x.war
sudo rm -Rf geoserver/geoserver
unzip downloaded/geoserver-2.12.x.war -d geoserver/geoserver
sudo service supervisor restart

exit 0
