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

git remote update

UPSTREAM=${1:-'@{u}'}
LOCAL=$(git rev-parse @)
REMOTE=$(git rev-parse "$UPSTREAM")
BASE=$(git merge-base @ "$UPSTREAM")

if [ $LOCAL = $REMOTE ]; then
    echo "Up-to-date"
elif [ $LOCAL = $BASE ]; then
    echo "Need to pull"
    git pull
    DJANGO_SETTINGS_MODULE=gfdrr_det.settings.development paver update
    touch gfdrr_det/wsgi.py
    sudo service uwsgi restart
elif [ $REMOTE = $BASE ]; then
    echo "Need to push"
else
    echo "Diverged"
fi

exit 0
