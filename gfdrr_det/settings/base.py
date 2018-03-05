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

# Django settings for the GeoNode project.
import os
# Load more settings from a file called local_settings.py if it exists
try:
    from geonode.local_settings import *
except ImportError:
    from geonode.settings import *

#
# General Django development settings
#
DEBUG = False

PROJECT_NAME = 'gfdrr_det'

SITENAME = 'gfdrr_det'

FRONTEND_APP_NAME = 'dataexplorationtool'

# Defines the directory that contains the settings file as the PROJECT_ROOT
# It is used for relative settings elsewhere.
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '../'))

MEDIA_ROOT = '%s/uploaded/' % PROJECT_ROOT
STATIC_ROOT = '%s/static_root' % PROJECT_ROOT

WSGI_APPLICATION = "{}.wsgi.application".format(PROJECT_NAME)

ALLOWED_HOSTS = ['localhost', 'django', 'det-dev.geo-solutions.it'] if os.getenv('ALLOWED_HOSTS') is None \
    else re.split(r' *[,|:|;] *', os.getenv('ALLOWED_HOSTS'))

PROXY_ALLOWED_HOSTS += ('nominatim.openstreetmap.org',)

# AUTH_IP_WHITELIST property limits access to users/groups REST endpoints
# to only whitelisted IP addresses.
#
# Empty list means 'allow all'
#
# If you need to limit 'api' REST calls to only some specific IPs
# fill the list like below:
#
# AUTH_IP_WHITELIST = ['192.168.1.158', '192.168.1.159']
AUTH_IP_WHITELIST = []

MANAGERS = ADMINS = os.getenv('ADMINS', [])
TIME_ZONE = os.getenv('TIME_ZONE', "America/Chicago")
USE_TZ = True

INSTALLED_APPS += ('geonode', PROJECT_NAME,)

# Location of url mappings
ROOT_URLCONF = os.getenv('ROOT_URLCONF', '{}.urls'.format(PROJECT_NAME))

# MEDIA_ROOT = os.getenv('MEDIA_ROOT', os.path.join(PROJECT_ROOT, "uploaded"))

# STATIC_ROOT = os.getenv('STATIC_ROOT',
#                        os.path.join(PROJECT_ROOT, "static_root")
#                        )

# Additional directories which hold static files
STATICFILES_DIRS.append(
    os.path.join(PROJECT_ROOT, "static"),
)

# Location of locale files
LOCALE_PATHS = (
    os.path.join(PROJECT_ROOT, 'locale'),
) + LOCALE_PATHS

TEMPLATES[0]['DIRS'].insert(0, os.path.join(PROJECT_ROOT, "templates"))
loaders = TEMPLATES[0]['OPTIONS'].get(
    'loaders') or ['django.template.loaders.filesystem.Loader',
                   'django.template.loaders.app_directories.Loader']
# loaders.insert(0, 'apptemplates.Loader')
TEMPLATES[0]['OPTIONS']['loaders'] = loaders
TEMPLATES[0].pop('APP_DIRS', None)

# ######################################################################################

# WARNING: Map Editing is affected by this. GeoExt Configuration is cached for 5 minutes
# CACHES = {
#     'default': {
#         'BACKEND': 'django.core.cache.backends.filebased.FileBasedCache',
#         'LOCATION': '/var/tmp/django_cache',
#     }
# }

UPLOADER = {
    'BACKEND': 'geonode.rest',
    # 'BACKEND': 'geonode.importer',
    'OPTIONS': {
        'TIME_ENABLED': False,
        'MOSAIC_ENABLED': False,
        'GEOGIG_ENABLED': False,
    },
    'SUPPORTED_CRS': [
        'EPSG:4326',
        'EPSG:3785',
        'EPSG:3857',
        'EPSG:900913',
        'EPSG:32647',
        'EPSG:32736'
    ],
    'SUPPORTED_EXT': [
        '.shp',
        '.csv',
        '.kml',
        '.kmz',
        '.json',
        '.geojson',
        '.tif',
        '.tiff',
        '.geotiff',
        '.gml',
        '.xml'
    ]
}

# ############################################################################# Account settings

# prevent signing up by default
ACCOUNT_OPEN_SIGNUP = True
ACCOUNT_EMAIL_REQUIRED = True
ACCOUNT_EMAIL_VERIFICATION = 'optional'
ACCOUNT_EMAIL_CONFIRMATION_EMAIL = True
ACCOUNT_EMAIL_CONFIRMATION_REQUIRED = True
ACCOUNT_CONFIRM_EMAIL_ON_GET = True
ACCOUNT_APPROVAL_REQUIRED = True

SOCIALACCOUNT_ADAPTER = 'geonode.people.adapters.SocialAccountAdapter'

SOCIALACCOUNT_AUTO_SIGNUP = False

# Uncomment this to enable Linkedin and Facebook login
# INSTALLED_APPS += (
#     'allauth.socialaccount.providers.linkedin_oauth2',
#     'allauth.socialaccount.providers.facebook',
# )

SOCIALACCOUNT_PROVIDERS = {
    'linkedin_oauth2': {
        'SCOPE': [
            'r_emailaddress',
            'r_basicprofile',
        ],
        'PROFILE_FIELDS': [
            'emailAddress',
            'firstName',
            'headline',
            'id',
            'industry',
            'lastName',
            'pictureUrl',
            'positions',
            'publicProfileUrl',
            'location',
            'specialties',
            'summary',
        ]
    },
    'facebook': {
        'METHOD': 'oauth2',
        'SCOPE': [
            'email',
            'public_profile',
        ],
        'FIELDS': [
            'id',
            'email',
            'name',
            'first_name',
            'last_name',
            'verified',
            'locale',
            'timezone',
            'link',
            'gender',
        ]
    },
}

SOCIALACCOUNT_PROFILE_EXTRACTORS = {
    "facebook": "geonode.people.profileextractors.FacebookExtractor",
    "linkedin_oauth2": "geonode.people.profileextractors.LinkedInExtractor",
}

# ############################################################################# GID Client settings

# MAPs and Backgrounds

# GeoNode javascript client configuration

# default map projection
# Note: If set to EPSG:4326, then only EPSG:4326 basemaps will work.
DEFAULT_MAP_CRS = "EPSG:900913"

# Where should newly created maps be focused?
DEFAULT_MAP_CENTER = (0, 0)

# How tightly zoomed should newly created maps be?
# 0 = entire world;
# maximum zoom is between 12 and 15 (for Google Maps, coverage varies by area)
DEFAULT_MAP_ZOOM = 0

# Default preview library
# GEONODE_CLIENT_LAYER_PREVIEW_LIBRARY = 'geoext'  # DEPRECATED use
# HOOKSET instead
GEONODE_CLIENT_HOOKSET = "geonode.client.hooksets.GeoExtHookSet"

# To enable the REACT based Client enable those
# INSTALLED_APPS += ('geonode-client', )
# GEONODE_CLIENT_LAYER_PREVIEW_LIBRARY = 'react'  # DEPRECATED use HOOKSET instead
# GEONODE_CLIENT_HOOKSET = "geonode.client.hooksets.ReactHookSet"

# To enable the Leaflet based Client enable those
# GEONODE_CLIENT_LAYER_PREVIEW_LIBRARY = 'leaflet'  # DEPRECATED use HOOKSET instead
# GEONODE_CLIENT_HOOKSET = "geonode.client.hooksets.LeafletHookSet"

# To enable the MapStore2 based Client enable those
# INSTALLED_APPS += ('geonode_mapstore_client', )
# GEONODE_CLIENT_LAYER_PREVIEW_LIBRARY = 'mapstore'  # DEPRECATED use HOOKSET instead
# GEONODE_CLIENT_HOOKSET = "geonode_mapstore_client.hooksets.MapStoreHookSet"

# LEAFLET_CONFIG = {
#    'TILES': [
# Find tiles at:
# http://leaflet-extras.github.io/leaflet-providers/preview/
#
# Map Quest
#        ('Map Quest',
#         'http://otile4.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png',
#         'Tiles Courtesy of <a href="http://www.mapquest.com/">MapQuest</a> '
#         '&mdash; Map data &copy; '
#         '<a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'),
# Stamen toner lite.
# ('Watercolor',
# 'http://{s}.tile.stamen.com/watercolor/{z}/{x}/{y}.png',
# 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, \
# <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; \
# <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, \
# <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>'),
# ('Toner Lite',
# 'http://{s}.tile.stamen.com/toner-lite/{z}/{x}/{y}.png',
# 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, \
# <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; \
# <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, \
# <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>'),
#    ],
#    'PLUGINS': {
#        'esri-leaflet': {
#            'js': 'lib/js/esri-leaflet.js',
#            'auto-include': True,
#        },
#        'leaflet-fullscreen': {
#            'css': 'lib/css/leaflet.fullscreen.css',
#            'js': 'lib/js/Leaflet.fullscreen.min.js',
#            'auto-include': True,
#        },
#    },
#    'SRID': 3857,
#    'RESET_VIEW': False
#}

ALT_OSM_BASEMAPS = os.environ.get('ALT_OSM_BASEMAPS', False)
CARTODB_BASEMAPS = os.environ.get('CARTODB_BASEMAPS', False)
STAMEN_BASEMAPS = os.environ.get('STAMEN_BASEMAPS', False)
THUNDERFOREST_BASEMAPS = os.environ.get('THUNDERFOREST_BASEMAPS', False)
MAPBOX_ACCESS_TOKEN = os.environ.get('MAPBOX_ACCESS_TOKEN', '')
BING_API_KEY = os.environ.get('BING_API_KEY', None)

MAP_BASELAYERS = [{
    "source": {"ptype": "gxp_olsource"},
    "type": "OpenLayers.Layer",
    "args": ["No background"],
    "name": "background",
    "visibility": False,
    "fixed": True,
    "group":"background"
}, {
    "source": {"ptype": "gxp_olsource"},
    "type": "OpenLayers.Layer.XYZ",
    "title": "UNESCO",
    "args": ["UNESCO", "http://en.unesco.org/tiles/${z}/${x}/${y}.png"],
    "wrapDateLine": True,
    "name": "background",
    "attribution": "&copy; UNESCO",
    "visibility": False,
    "fixed": True,
    "group":"background"
}, {
    "source": {"ptype": "gxp_olsource"},
    "type": "OpenLayers.Layer.XYZ",
    "title": "UNESCO GEODATA",
    "args":
        ["UNESCO GEODATA",
            "http://en.unesco.org/tiles/geodata/${z}/${x}/${y}.png"],
    "name": "background",
    "attribution": "&copy; UNESCO",
    "visibility": False,
    "wrapDateLine": True,
    "fixed": True,
    "group":"background"
}, {
    "source": {"ptype": "gxp_olsource"},
    "type": "OpenLayers.Layer.XYZ",
    "title": "Humanitarian OpenStreetMap",
    "args":
        ["Humanitarian OpenStreetMap",
            "http://a.tile.openstreetmap.fr/hot/${z}/${x}/${y}.png"],
    "name": "background",
    "attribution":
        "&copy; <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a>, Tiles courtesy of <a href='http://hot.openstreetmap.org/' target='_blank'>Humanitarian OpenStreetMap Team</a>",
    "visibility": False,
    "wrapDateLine": True,
    "fixed": True,
    "group":"background"
    # }, {
    #     "source": {"ptype": "gxp_olsource"},
    #     "type": "OpenLayers.Layer.XYZ",
    #     "title": "MapBox Satellite Streets",
    #     "args": ["MapBox Satellite Streets", "http://api.mapbox.com/styles/v1/mapbox/satellite-streets-v9/tiles/${z}/${x}/${y}?access_token="+MAPBOX_ACCESS_TOKEN],
    #     "name": "background",
    #     "attribution": "&copy; <a href='https://www.mapbox.com/about/maps/'>Mapbox</a> &copy; <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a> <a href='https://www.mapbox.com/feedback/' target='_blank'>Improve this map</a>",
    #     "visibility": False,
    #     "wrapDateLine": True,
    #     "fixed": True,
    #     "group":"background"
    # }, {
    #     "source": {"ptype": "gxp_olsource"},
    #     "type": "OpenLayers.Layer.XYZ",
    #     "title": "MapBox Streets",
    #     "args": ["MapBox Streets", "http://api.mapbox.com/styles/v1/mapbox/streets-v9/tiles/${z}/${x}/${y}?access_token="+MAPBOX_ACCESS_TOKEN],
    #     "name": "background",
    #     "attribution": "&copy; <a href='https://www.mapbox.com/about/maps/'>Mapbox</a> &copy; <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a> <a href='https://www.mapbox.com/feedback/' target='_blank'>Improve this map</a>",
    #     "visibility": False,
    #     "wrapDateLine": True,
    #     "fixed": True,
    #     "group":"background"
}, {
    "source": {"ptype": "gxp_osmsource"},
    "type": "OpenLayers.Layer.OSM",
    "title": "OpenStreetMap",
    "name": "mapnik",
    "attribution":
        "&copy; <a href='http://osm.org/copyright'>OpenStreetMap</a> contributors",
    "visibility": True,
    "wrapDateLine": True,
    "fixed": True,
    "group": "background"
}]

# ############################################################################# Additional settings

# notification settings
NOTIFICATION_ENABLED = True

# notifications backends
_EMAIL_BACKEND = "pinax.notifications.backends.email.EmailBackend"
PINAX_NOTIFICATIONS_BACKENDS = [
    ("email", _EMAIL_BACKEND),
]

# Queue non-blocking notifications.
PINAX_NOTIFICATIONS_QUEUE_ALL = False
PINAX_NOTIFICATIONS_LOCK_WAIT_TIMEOUT = -1

# pinax.notifications
# or notification
NOTIFICATIONS_MODULE = 'pinax.notifications'

# Use kombu broker by default
# REDIS_URL = 'redis://localhost:6379/1'
# BROKER_URL = REDIS_URL
# CELERY_RESULT_BACKEND = REDIS_URL
CELERYD_HIJACK_ROOT_LOGGER = True
CELERYD_CONCURENCY = 1
# Set this to False to run real async tasks
CELERY_ALWAYS_EAGER = True
CELERYD_LOG_FILE = None
CELERY_REDIRECT_STDOUTS = True
CELERYD_LOG_LEVEL = 1

# Haystack Search Backend Configuration. To enable,
# first install the following:
# - pip install django-haystack
# - pip install elasticsearch==2.4.0
# - pip install woosh
# - pip install pyelasticsearch
# Set HAYSTACK_SEARCH to True
# Run "python manage.py rebuild_index"
# HAYSTACK_SEARCH = False
# Avoid permissions prefiltering
SKIP_PERMS_FILTER = False
# Update facet counts from Haystack
HAYSTACK_FACET_COUNTS = True
HAYSTACK_CONNECTIONS = {
    'default': {
        'ENGINE':
            'haystack.backends.elasticsearch2_backend.Elasticsearch2SearchEngine',
        'URL': 'http://127.0.0.1:9200/',
        'INDEX_NAME': 'haystack',
    },
    #    'db': {
    #        'ENGINE': 'haystack.backends.simple_backend.SimpleEngine',
    #        'EXCLUDED_INDEXES': ['thirdpartyapp.search_indexes.BarIndex'],
    #        }
}
HAYSTACK_SIGNAL_PROCESSOR = 'haystack.signals.RealtimeSignalProcessor'
# HAYSTACK_SEARCH_RESULTS_PER_PAGE = 20

CORS_ORIGIN_ALLOW_ALL = True

MONITORING_ENABLED = False

# add following lines to your local settings to enable monitoring
if MONITORING_ENABLED:
    if 'geonode.contrib.monitoring' not in INSTALLED_APPS:
        INSTALLED_APPS += ('geonode.contrib.monitoring',)
    if 'geonode.contrib.monitoring.middleware.MonitoringMiddleware' not in MIDDLEWARE_CLASSES:
        MIDDLEWARE_CLASSES += \
            ('geonode.contrib.monitoring.middleware.MonitoringMiddleware',)
    MONITORING_CONFIG = None
    MONITORING_SERVICE_NAME = 'local-geonode'
    MONITORING_HOST_NAME = 'localhost'

    INSTALLED_APPS += ('geonode.contrib.ows_api',)

CORS_ORIGIN_ALLOW_ALL = True

GEOIP_PATH = "/usr/local/share/GeoIP"

# Define email service on GeoNode
EMAIL_ENABLE = False

if EMAIL_ENABLE:
    EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
    EMAIL_HOST = 'localhost'
    EMAIL_PORT = 25
    EMAIL_HOST_USER = ''
    EMAIL_HOST_PASSWORD = ''
    EMAIL_USE_TLS = False
    DEFAULT_FROM_EMAIL = 'Example.com <no-reply@localhost>'

# Documents Thumbnails
UNOCONV_ENABLE = True

if UNOCONV_ENABLE:
    UNOCONV_EXECUTABLE = os.getenv('UNOCONV_EXECUTABLE', '/usr/bin/unoconv')
    UNOCONV_TIMEOUT = os.getenv('UNOCONV_TIMEOUT', 30)  # seconds

# Advanced Security Workflow Settings
CLIENT_RESULTS_LIMIT = 20
API_LIMIT_PER_PAGE = 1000
FREETEXT_KEYWORDS_READONLY = False
RESOURCE_PUBLISHING = False
ADMIN_MODERATE_UPLOADS = False
GROUP_PRIVATE_RESOURCES = False
GROUP_MANDATORY_RESOURCES = False
MODIFY_TOPICCATEGORY = True
USER_MESSAGES_ALLOW_MULTIPLE_RECIPIENTS = True
DISPLAY_WMS_LINKS = True

# For more information on available settings please consult the Django docs at
# https://docs.djangoproject.com/en/dev/ref/settings

# ############################################################################# Logging settings

LOGGING = {
    'version': 1,
    'disable_existing_loggers': True,
    'formatters': {
        'verbose': {
            'format': '%(levelname)s %(asctime)s %(module)s %(process)d '
                      '%(thread)d %(message)s'
        },
        'simple': {
            'format': '%(message)s',
        },
    },
    'filters': {
        'require_debug_false': {
            '()': 'django.utils.log.RequireDebugFalse'
        }
    },
    'handlers': {
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'simple'
        },
        'mail_admins': {
            'level': 'INFO', 'filters': ['require_debug_false'],
            'class': 'django.utils.log.AdminEmailHandler',
        }
    },
    "loggers": {
        "django": {
            "handlers": ["console"], "level": "INFO", },
        "geonode": {
            "handlers": ["console"], "level": "INFO", },
        "gsconfig.catalog": {
            "handlers": ["console"], "level": "INFO", },
        "owslib": {
            "handlers": ["console"], "level": "INFO", },
        "pycsw": {
            "handlers": ["console"], "level": "INFO", },
        "gfdrr_det": {
            "handlers": ["console"], "level": "INFO", },
    },
}
