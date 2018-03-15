#########################################################################
#
# Copyright 2018, GeoSolutions Sas.
# All rights reserved.
#
# This source code is licensed under the BSD-style license found in the
# LICENSE file in the root directory of this source tree.
#
#########################################################################

from .development import *

#PROJECT_ROOT = os.path.abspath(os.path.dirname(__file__))

ALLOWED_HOSTS = [
    "10.0.1.95"
]

SITE_HOST_NAME = "10.0.1.95"

# remove qgis_server from installed apps
INSTALLED_APPS = tuple(
    app for app in INSTALLED_APPS if app != "geonode.qgis_server")

SECRET_KEY = get_environment_variable("DJANGO_SECRET_KEY")

DATABASES["default"].update({
    "NAME": "gfdrr-det",
    "USER": get_environment_variable("GFDRR_DET_DB_USER"),
    "PASSWORD": get_environment_variable("GFDRR_DET_DB_PASSWORD"),
})

DATABASES["datastore"].update({
    "NAME": "gfdrr-det",
    "USER": get_environment_variable("GFDRR_DET_DB_USER"),
    "PASSWORD": get_environment_variable("GFDRR_DET_DB_PASSWORD"),
})

OGC_SERVER = {
    'default': {
        'BACKEND': 'geonode.geoserver',
        'LOCATION': "http://10.0.1.95:8080/geoserver/",
        'LOGIN_ENDPOINT': 'j_spring_oauth2_geonode_login',
        'LOGOUT_ENDPOINT': 'j_spring_oauth2_geonode_logout',
        'PUBLIC_LOCATION': "http://{}:{}/geoserver/".format(
            SITE_HOST_NAME, "8080"),
        'USER': "admin",
        'PASSWORD': "geoserver",
        'MAPFISH_PRINT_ENABLED': True,
        'PRINT_NG_ENABLED': True,
        'GEONODE_SECURITY_ENABLED': True,
        'GEOFENCE_SECURITY_ENABLED': True,
        'GEOGIG_ENABLED': False,
        'WMST_ENABLED': False,
        'BACKEND_WRITE_ENABLED': True,
        'WPS_ENABLED': False,
        'LOG_FILE': '/home/geosolutions/work/logs/geoserver.log',
        # Set to dictionary identifier of database containing spatial data in
        # DATABASES dictionary to enable
        'DATASTORE': 'datastore',
        'PG_GEOGIG': False,
        'TIMEOUT': 30  # number of seconds to allow for HTTP requests
    }
}

EMAIL_ENABLE = True

if EMAIL_ENABLE:
    EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
    EMAIL_HOST = "smtp.geo-solutions.it"
    EMAIL_PORT = 587
    EMAIL_HOST_USER = get_environment_variable("DJANGO_EMAIL_HOST_USER")
    EMAIL_HOST_PASSWORD = get_environment_variable(
        "DJANGO_EMAIL_HOST_PASSWORD")
    EMAIL_USE_TLS = True
    DEFAULT_FROM_EMAIL = 'gfdrr-det <no-reply@localhost>'
