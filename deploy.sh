#!/bin/bash

source ~/Envs/gfdrr-det/bin/activate

pushd $(dirname $0)

DJANGO_SETTINGS_MODULE=gfdrr_det.local_settings paver update

touch gfdrr_det/wsgi.py

exit 0

