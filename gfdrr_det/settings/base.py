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

from celery.schedules import crontab
from django.core.exceptions import ImproperlyConfigured

# Load more settings from a file called local_settings.py if it exists
try:
    from geonode.local_settings import *
except ImportError:
    from geonode.settings import *


def get_environment_variable(var_name, default_value=None):
    value = os.getenv(var_name)
    if value is None:
        if default_value is None:
            error_msg = "Set the {0} environment variable".format(var_name)
            raise ImproperlyConfigured(error_msg)
        else:
            value = default_value
    return value


def get_boolean_env_value(environment_value):
    return True if environment_value.lower() == "true" else False


def get_list_env_value(environment_value, separator=":"):
    return [item for item in environment_value.split(separator) if
            item != ""]

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

ALLOWED_HOSTS = get_list_env_value(
    get_environment_variable(
        "ALLOWED_HOSTS",
        default_value="localhost:django"
    ),
)

PROXY_ALLOWED_HOSTS = get_list_env_value(
    get_environment_variable(
        "PROXY_ALLOWED_HOSTS",
        default_value="localhost:django:nominatim.openstreetmap.org"
    ),
)

DATABASES = {
    'default': {
        'ENGINE': 'django.contrib.gis.db.backends.postgis',
        'NAME': get_environment_variable("GFDRR_DET_DB_NAME", default_value="gfdrr_det"),
        'USER': get_environment_variable("GFDRR_DET_DB_USER", default_value='geonode'),
        'PASSWORD': get_environment_variable("GFDRR_DET_DB_PASSWORD", default_value='geonode'),
        'HOST': get_environment_variable("GFDRR_DET_DB_HOST", default_value='localhost'),
        'PORT': get_environment_variable("GFDRR_DET_DB_PORT", default_value='5432'),
        'CONN_TOUT': 900,
    },
    # vector datastore for uploads
    'datastore': {
        'ENGINE': 'django.contrib.gis.db.backends.postgis',
        # 'ENGINE': '',  # Empty ENGINE name disables
        'NAME': get_environment_variable("GFDRR_DET_DB_DATA_NAME", default_value="gfdrr_det_data"),
        'USER': get_environment_variable("GFDRR_DET_DB_USER", default_value='geonode'),
        'PASSWORD': get_environment_variable("GFDRR_DET_DB_PASSWORD", default_value='geonode'),
        'HOST': get_environment_variable("GFDRR_DET_DB_HOST", default_value='localhost'),
        'PORT': get_environment_variable("GFDRR_DET_DB_PORT", default_value='5432'),
        'CONN_TOUT': 900,
    },
    'hev_e': {
        'ENGINE': 'django.contrib.gis.db.backends.postgis',
        'OPTIONS': {
            'options': '-c search_path=exposures,vulnerabilities,public'
        },
        'NAME': get_environment_variable("HEV_E_DB_NAME", default_value="hev-e"),
        'USER': get_environment_variable("HEV_E_DB_USER", default_value='geonode'),
        'PASSWORD': get_environment_variable("HEV_E_DB_PASSWORD", default_value='geonode'),
        'HOST': get_environment_variable("HEV_E_DB_HOST", default_value='localhost'),
        'PORT': get_environment_variable("HEV_E_DB_PORT", default_value='5432'),
        'CONN_TOUT': 900,
    }
}

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

INSTALLED_APPS += (
    "geonode",
    "crispy_forms",
    "django_filters",
    "rest_framework",
    "rest_framework_gis",
    "mailqueue",
    "oseoserver",
    "gfdrr_det.apps.GfdrrdetConfig",
    "{}.exposures".format(PROJECT_NAME),
    "{}.vulnerabilities".format(PROJECT_NAME),
)

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
        "oseoserver": {
            "handlers": ["console"], "level": "INFO", },
        "gfdrr_det": {
            "handlers": ["console"], "level": "INFO", },
    },
}

USE_NATIVE_JSONFIELD = True

# TODO: Add DEFAULT_AUTHENTICATION_CLASSES
# TODO: Add DEFAULT_PERMISSION_CLASSES
# TODO: Add DEFAULT_PAGINATION_CLASS
REST_FRAMEWORK = {
    "DEFAULT_RENDERER_CLASSES": (
        "rest_framework.renderers.JSONRenderer",
        "rest_framework.renderers.BrowsableAPIRenderer",
    ),
    "DEFAULT_PARSER_CLASSES": (
        "rest_framework.parsers.JSONParser",
    ),
    "DEFAULT_PAGINATION_CLASS": (
        "rest_framework.pagination.PageNumberPagination"),
    "PAGE_SIZE": 10,
    "DEFAULT_VERSIONING_CLASS": "rest_framework.versioning.URLPathVersioning",
}

CELERY_BROKER_URL = "amqp://{user}:{password}@{host}:{port}//".format(
    user=get_environment_variable("RABBITMQ_USER", "guest"),
    password=get_environment_variable("RABBITMQ_PASSWORD", "guest"),
    host=get_environment_variable("RABBITMQ_HOST", "localhost"),
    port=get_environment_variable("RABBITMQ_PORT", "5672"),
)
CELERY_TASK_IGNORE_RESULT = False
CELERY_RESULT_BACKEND = "redis://{password}@{host}:{port}/{db}".format(
    password=get_environment_variable("REDIS_PASSWORD", ""),
    host=get_environment_variable("REDIS_HOST", "localhost"),
    port=get_environment_variable("REDIS_PORT", "6379"),
    db=get_environment_variable("REDIS_DB", "0"),
)
CELERY_TASK_RESULT_EXPIRES = 180000  # 5 hours
CELERY_TASK_ALWAYS_EAGER = False
CELERY_TASK_ACKS_LATE = True
CELERY_ACCEPT_CONTENT = ["json",]
CELERY_WORKER_REDIRECT_STDOUTS = True
CELERY_WORKER_HIJACK_ROOT_LOGGER = False
CELERY_WORKER_PREFETCH_MULTIPLIER = 1  # appropriate for long-running tasks
CELERY_BEAT_SCHEDULE = {
    "expire-items": {
        "task": "oseoserver.tasks.clean_expired_items",
        "schedule": crontab(minute="0", hour="1"),  # execute daily at 01:00
    }
}

MAILQUEUE_CELERY = True
SENDFILE_BACKEND = "sendfile.backends.simple"

OSEOSERVER_PRODUCT_ORDER = {
    "enabled": True,
    "automatic_approval": True,
    "item_processor": "gfdrr_det.orderprocessors.HeveOrderProcessor",
    "item_availability_days": 2,
    "notifications": {
        "moderation": False,
        "item_availability": False,
        "batch_availability": "immediate",

    }
}

OSEOSERVER_PROCESSING_OPTIONS = [
    {
        "name": "bbox",
        "description": "Specify a region of interest for cropping the order "
                       "item",
    },
    {
        "name": "format",
        "description": "Output format for the ordered item",
        "choices": [
            "shapefile",
            "geopackage",
        ],
    },
    {
        "name": "exposureTaxonomicCategory",
        "description": "Taxonomic categories for subsetting exposure layers",
        "multiple_entries": True,
    },
]

OSEOSERVER_ONLINE_DATA_ACCESS_OPTIONS = [
    {
        "protocol": "http",
        "fee": 0,
    }
]

OSEOSERVER_COLLECTIONS = [
    {
        "name": "exposure",
        "catalogue_endpoint": None,  # FIXME - add a sensible value
        "collection_identifier": "exposure",
        "generation_frequency": "on-demand",
        "item_processing": "gfdrr_det.orderprocessors.select_processing_type",
        "product_order": {
            "enabled": True,
            "options": [
                "bbox",
                "format",
                "exposureTaxonomicCategory",
            ],
            "online_data_access_options": [
                "http",
            ],
        }
    }
]


# TODO: confirm category names as more data becomes available
# TODO: Confirm mapping of exposure categories to ISO19115 topic categories
HEV_E = {
    "general": {
        "downloads_dir": "/tmp/hev_e",
        "downloads_name_pattern": "hev_e_{hash}.{format}"
    },
    "EXPOSURES": {
        "category_mappings": {
            "buildings": {
                "view_geometries": {
                    "coarse_geometry_column": "the_geom",
                    "coarse_geometry_type": "Point",
                    "detail_geometry_column": "full_geom",
                    "detail_geometry_type": "MultiPolygon",
                },
                "exposure_model_categories": ["buildings"],
                "topic_category": "structure",
            },
            "road_network": {
                "view_geometries": {
                    "coarse_geometry_column": "full_geom",
                    "coarse_geometry_type": "MultiLineString",
                    "detail_geometry_column": "full_geom",
                    "detail_geometry_type": "MultiLineString",
                },
                "exposure_model_categories": ["road_network"],
                "topic_category": "transportation",
            },
            # "rails": {
            #     "exposure_model_categories": [],
            #     "topic_category": "transportation",
            # },
            # "pipelines": {
            #     "exposure_model_categories": [],
            #     "topic_category": "utilitiesCommunication",
            # },
            # "storage_tanks": {
            #     "exposure_model_categories": [],
            #     "topic_category": "utilitiesCommunication",
            # },
            # "power_grid": {
            #     "exposure_model_categories": [],
            #     "topic_category": "utilitiesCommunication",
            # },
            # "bridges": {
            #     "exposure_model_categories": [],
            #     "topic_category": "structure",
            # },
            # "energy": {
            #     "exposure_model_categories": [],
            #     "topic_category": "utilitiesCommunication",
            # },
            # "crops": {
            #     "exposure_model_categories": [],
            #     "topic_category": "farming",
            # },
            # "livestock": {
            #     "exposure_model_categories": [],
            #     "topic_category": "farming",
            # },
            # "forestry": {
            #     "exposure_model_categories": [],
            #     "topic_category": "farming",
            # },
        },
        "area_type_mappings": {
            "aggregated": ["aggregated"],
            "per_asset": ["per_asset"],
        },
        "taxonomy_mappings": {
            "sources": {
                "GEM": [
                    "gem_building_taxonomy_2.0",
                    "gem taxonomy",
                    "simple taxonomy"
                ],
                "GED4ALL": [
                    "ged4all taxonomy"
                ]
            },
            "mapping": {
                "construction_material": {
                    "composite": {
                        "GEM": ["MIX"]
                    },
                    "concrete": {
                        "GEM": ["C99", "CR", "CU", "SRC"]
                    },
                    "earth": {
                        "GEM": ["E99", "ER", "EU"]
                    },
                    "masonry": {
                        "GEM": ["M99", "MUR", "MCF", "MR"]
                    },
                    "metal": {
                        "GEM": ["ME"]
                    },
                    "steelframe": {
                        "GEM": ["S"]
                    },
                    "unknown": {
                        "GEM":["MAT99", "MATO"]
                    },
                    "wood": {
                        "GEM": ["W"]
                    },
                },
                "occupancy": {
                    "commercial": {
                        "GEM": ["COM"]
                    },
                    "education": {
                        "GEM": ["EDU"]
                    },
                    "government": {
                        "GEM": ["GOV"]
                    },
                    "healthcare": {
                        "GEM": []
                    },
                    "industrial": {
                        "GEM": ["IND"]
                    },
                    "residential": {
                        "GEM": ["RES"]
                    },
                    "unknown": {
                        "GEM": ["OC99", "MIX", "OCO"]
                    },
                },
                "construction_date": {},
            },
        }
    },
}
