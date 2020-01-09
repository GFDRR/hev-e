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

import os
from distutils.core import setup

def read(*rnames):
    return open(os.path.join(os.path.dirname(__file__), *rnames)).read()

setup(
    name="gfdrr_det",
    version="0.1",
    author="",
    author_email="",
    description="gfdrr_det, based on GeoNode",
    long_description=(read('README.rst')),
    # Full list of classifiers can be found at:
    # http://pypi.python.org/pypi?%3Aaction=list_classifiers
    classifiers=[
        'Development Status :: 1 - Planning',
    ],
    license="BSD",
    keywords="gfdrr_det geonode django",
    url='https://github.com/geosolutions-it/gfdrr_det',
    packages=['gfdrr_det',],
    include_package_data=True,
    zip_safe=False,
    install_requires=[
        'celery==4.1.0',
        'Django==1.11.23',
        'django-apptemplates==1.4',
        'django-celery-beat==1.0.1',
        'django-celery-results==1.0.1',
        'django-cuser==2017.3.16',
        'django-crispy-forms==1.7.0',
        'django-filter==1.1.0',
        'django-model-utils==3.0.0',
        'django-simple-history==1.9.0',
        'djangorestframework<3.7',
        'djangorestframework-csv==2.1.0',
        'djangorestframework-gis<0.12',
        'drf-nested-routers==0.90.0',
        'drf-openapi==1.0.0',
        'enum34==1.1.6',
        'inflection==0.3.1',
        'pathlib2==2.3.0',
        'proj==0.1.0',
        'pygdal==2.2.1.3',
        'pyproj==1.9.5.1',
        'pyshp==1.2.12',
        'Shapely>=1.5.13,<1.6.dev0',
        'SQLAlchemy==1.1.14',
        'six==1.10.0',
        # 'geonode>=2.9'
    ],
)
