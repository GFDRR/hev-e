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

from collections import namedtuple
from django.core.urlresolvers import reverse
from django.contrib.gis.db import models as gismodels
from django.db import models
from django.db.models import CASCADE
# jsonfield conflicts with django's native JSONField but we have to use it
# here because geonode is also using it somewhere. More info on this:
# https://bitbucket.org/schinckel/django-jsonfield/issues/57/cannot-use-in-the-same-project-as-djangos
from jsonfield import JSONField
from mptt.models import MPTTModel, TreeForeignKey
from django.core import files

from . import validators
from .constants import DatasetType


BBox = namedtuple("BBox", [
    "x_min",
    "y_min",
    "x_max",
    "y_max",
])


class Exportable(object):
    EXPORT_FIELDS = []

    def export(self, fieldset=None):
        out = {}
        if fieldset is None:
            fieldset = self.EXPORT_FIELDS
        for fname, fsource in fieldset:
            val = getattr(self, fsource, None)
            if callable(val):
                val = val()
            elif isinstance(val, files.File):
                try:
                    val = val.url
                except ValueError:
                    val = None
            out[fname] = val
        return out


class LocationAware(object):

    def get_url(self, url_name, *args, **kwargs):
        # TODO: reverse url
        #       e.g.:
        #        1. geometry url -> /gfdrr_det/explorationtool/geom/DZA.17.525/
        #        2. location url -> /gfdrr_det/explorationtool/loc/DZA.17.525/
        #        3. ...
        return reverse('{}:{}:{}'.format(app_namespace, app_name, url_name), args=args, kwargs=kwargs)

    # hack to set location context, so we can return
    # location-specific related objects
    def set_location(self, loc):
        self._location = loc
        return self

    def get_location(self):
        if not getattr(self, '_location', None):
            raise ValueError("Cannot use location-less {} here".format(self.__class__.__name__))
        return self._location


class AdministrativeDivisionManager(models.Manager):
    """
    """
    def get_by_natural_key(self, name):
        return self.get(name=name)


class AdministrativeDivision(Exportable, MPTTModel):
    """
    Administrative Division Gaul dataset.
    """

    EXPORT_FIELDS = (('label', 'name',),
                     ('href', 'href',),
                     ('geom', 'geom_href',),
                     ('parent_geom', 'parent_geom_href',),
                     )
    id = models.AutoField(primary_key=True)
    objectid = models.IntegerField(null=False, blank=False, db_index=True)
    # Adm level
    level = models.IntegerField(null=False, blank=False, db_index=True)
    iso = models.CharField(max_length=10, null=False, blank=False, db_index=True)
    iso_id = models.IntegerField(null=False, blank=False, db_index=True)
    name = models.CharField(max_length=50, null=False, blank=False,
                            db_index=True)

    name_eng = models.CharField(max_length=50, null=True, blank=True)
    name_fao = models.CharField(max_length=50, null=True, blank=True)
    name_local = models.CharField(max_length=50, null=True, blank=True)

    type = models.CharField(max_length=80, null=True, blank=True)
    engtype = models.CharField(max_length=80, null=True, blank=True)
    contains = models.CharField(max_length=255, null=True, blank=True)
    sovereign = models.CharField(max_length=50, null=True, blank=True)

    fips = models.CharField(max_length=50, null=True, blank=True)
    unregion = models.CharField(max_length=50, null=True, blank=True)
    ison = models.DecimalField(max_digits=21, decimal_places=8, blank=True, null=True)
    valid_from = models.CharField(max_length=50, null=True, blank=True)
    valid_to = models.CharField(max_length=50, null=True, blank=True)

    population = models.DecimalField(max_digits=21, decimal_places=8, blank=True, null=True)
    sqkm = models.DecimalField(max_digits=21, decimal_places=8, blank=True, null=True)
    pop_sqkm = models.DecimalField(max_digits=21, decimal_places=8, blank=True, null=True)
    shape_leng = models.DecimalField(max_digits=21, decimal_places=8, blank=True, null=True)
    shape_area = models.DecimalField(max_digits=21, decimal_places=8, blank=True, null=True)

    # GeoDjango-specific: a geometry field (MultiPolygonField)
    geom = gismodels.MultiPolygonField(spatial_index=True)
    # geom = models.TextField()  # As WKT
    srid = models.IntegerField(default=4326)

    # Relationships
    parent = TreeForeignKey('self', null=True, blank=True,
                            related_name='children')
    region = models.ForeignKey('Region')

    @property
    def href(self):
        # TODO build full hyerarchy ISO code <lev_0_iso>.<lev_1_iso_id>.<lev_2_iso_id>...
        #      e.g.: DZA.17.525 --> ALGERIA/El Bayadh/El Mehara
        # self.get_parents_chain()
        iso = self.parent.iso if self.parent else self.iso
        iso_code = "{}{}".format(iso, self.iso_id)
        return self.get_url('location', iso_code)

    @property
    def geom_href(self):
        # TODO build full hyerarchy ISO code <lev_0_iso>.<lev_1_iso_id>.<lev_2_iso_id>...
        #      e.g.: DZA.17.525 --> ALGERIA/El Bayadh/El Mehara
        # self.get_parents_chain()
        iso = self.parent.iso if self.parent else self.iso
        iso_code = "{}{}".format(iso, self.iso_id)
        return self.get_url('geometry', iso_code)

    @property
    def parent_geom_href(self):
        if self.parent:
            return self.parent.geom_href

    def __unicode__(self):
        return u"{0}".format(self.name)

    class Meta:
        """
        """
        ordering = ['iso', 'name', 'iso_id']
        db_table = 'explorationtool_administrativedivision'
        verbose_name_plural = 'DET Administrative Divisions'

    class MPTTMeta:
        """
        """
        order_insertion_by = ['name']

    def get_parents_chain(self):
        parent = self.parent
        out = []
        while parent is not None:
            out.append(parent)
            parent = parent.parent
        out.reverse()
        return out

    def get_bbox(self):
        x_min = 200
        x_max = -200
        y_min = 100
        y_max = -100
        for x, y in self.geom.envelope.coords[0][:-1]:
            x_min = x if x < x_min else x_min
            x_max = x if x > x_max else x_max
            y_min = y if y < y_min else y_min
            y_max = y if y > y_max else y_max
        return BBox(x_min=x_min, y_min=y_min, x_max=x_max, y_max=y_max)


class Region(models.Model):
    """
    Groups a set of AdministrativeDivisions
    """
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255, null=False, blank=False,
                            db_index=True)
    # Adm level
    level = models.IntegerField(null=False, unique=False,
                                db_index=True)

    # Relationships
    administrative_divisions = models.ManyToManyField(
        AdministrativeDivision,
        related_name='administrative_divisions'
    )

    def __unicode__(self):
        return u"{0}".format(self.name)

    class Meta:
        ordering = ['name', 'level']
        db_table = 'explorationtool_region'
        verbose_name_plural = 'DET Regions'


class DatasetRepresentation(gismodels.Model):
    dataset_id = models.CharField(
        max_length=255,
        unique=True,
        help_text="Identifier for the dataset in the dataset type's database"
    )
    name = models.CharField(
        max_length=255,
        help_text="Name of this dataset",
    )
    dataset_type = models.CharField(
        max_length=255,
        validators=[validators.validate_dataset_type,]
    )
    geom = gismodels.PolygonField(
        spatial_index=True,
        help_text="Compound geometry of all the records in the dataset"
    )
    administrative_divisions = models.ManyToManyField(
        AdministrativeDivision,
        related_name="dataset_representations",
    )

    class Meta:
        unique_together = ("dataset_id", "dataset_type")


class HeveDetails(models.Model):
    dataset_type = models.CharField(
        max_length=20,
        choices=[(t.name, t.name) for t in DatasetType],
        validators=[validators.validate_dataset_type],
    )
    layer = models.OneToOneField(
        "layers.Layer",
        on_delete=CASCADE,
        null=True,
        blank=True
    )
    details = JSONField(
        blank=True,
        null=True
    )
