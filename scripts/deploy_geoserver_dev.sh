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

source ~/Envs/gfdrr-det/bin/activate

pushd $(dirname $0)/../

# sudo wget http://build.geonode.org/geoserver/latest/geoserver-2.12.x.war
sudo service tomcat8 stop
sudo rm -Rf /var/lib/tomcat8/webapps/geoserver*
sudo mv geoserver-2.12.x.war /var/lib/tomcat8/webapps/geoserver.war
sudo service tomcat8 restart

exit 0
