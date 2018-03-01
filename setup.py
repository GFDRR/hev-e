# -*- coding: utf-8 -*-
#########################################################################
#
# Copyright (C) 2018 OSGeo
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program. If not, see <http://www.gnu.org/licenses/>.
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
	   'Django==1.9.13',
       'django-filter==1.1.0',
       'django-cuser==2017.3.16',
       'django-apptemplates==1.4',
       'django-model-utils==3.0.0',
       'django-simple-history==1.9.0',
       'six==1.10.0',
       'celery==4.1.0',
       'django-celery-beat==1.0.1',
       'django-celery-results==1.0.1',
       'Shapely>=1.5.13,<1.6.dev0',
       'proj==0.1.0',
       'pyshp==1.2.12',
       'pyproj==1.9.5.1',
       'pygdal==2.2.1.3',
       'inflection==0.3.1',
       'SQLAlchemy==1.1.14',
       'djangorestframework==3.7.7',
       'djangorestframework-gis==0.12',
       'drf-openapi==1.3.0',
       'drf-nested-routers==0.90.0'
       # 'geonode>=2.9'
    ],
)
