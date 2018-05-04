#########################################################################
#
# Copyright 2018, GeoSolutions Sas.
# All rights reserved.
#
# This source code is licensed under the BSD-style license found in the
# LICENSE file in the root directory of this source tree.
#
#########################################################################

import hashlib
import logging
from email.utils import parseaddr
import re

from django.conf import settings
from django.contrib.sites.models import Site
from django.core.urlresolvers import reverse
from pathlib2 import Path
from oseoserver.models import OrderItem

from .constants import DatasetType
from .exposures import download as exposure_download
from .hazards import download as hazard_download
from .vulnerabilities import download as vulnerability_download
from . import utils

logger = logging.getLogger(__name__)


def get_downloadable_file_path(url):
    file_hash = [i for i in url.split("/") if i != ""][-1]
    downloads_dir = Path(settings.HEV_E["general"]["downloads_dir"])
    try:
        result = list(downloads_dir.glob("*{}*".format(file_hash)))[0]
    except IndexError:
        result = None
    return result


def prepare_collection_type_batch(sequential_items):
    hash_contents = []
    for item_info in sequential_items:
        hash_contents += [
            item_info["identifier"],
            utils.get_dict_str(item_info["options"])
        ]
    name_hash = hashlib.md5("".join(sorted(hash_contents))).hexdigest()
    return name_hash


def get_mail_recipients(subject, message, current_recipients, order=None):
    """Override oseoserver's default mail recipient selection

    This function is called by oseoserver just before sending e-mails. It
    allows one to modify the email recipient list.

    """

    if order is not None:
        end_user_mail_address = order.remark.replace("notification_email:", "")
        valid_address = parseaddr(end_user_mail_address)[-1] != ""
        result = [end_user_mail_address] if valid_address else []
    else:
        result = current_recipients
    return result


def select_processing_type(order_item_identifier, **order_item_options):
    logger.debug("select_processing_type_called: {}".format(locals()))
    format_ = order_item_options.get(
        "format",
        order_item_options.get("vulnerabilityFormat")
    )
    logger.debug("format_: {}".format(format_))
    return "sequential" if format_ == "geopackage" else "parallel"


class HeveOrderProcessor(object):

    def clean_item(self, url):
        """Clean an item that was previously available via 'onlinedataaccess'

        This method is called by oseoserver as soon as an item's expiry date is
        reached.

        If all order items that use the URL are marked as not available we
        may safely delete it. Otherwise, we keep the file around.

        """

        url_still_needed = OrderItem.objects.filter(url=url).filter(
            available=True).exists()
        if url_still_needed:
            logger.debug("URL {} is still being used in available order "
                         "items, will not delete the file".format(url))
        else:
            logger.debug("URL {} is not being used in any available order "
                         "item, it is safe to delete the file".format(url))
            path = get_downloadable_file_path(url)
            if path is not None:
                try:
                    path.unlink()
                except OSError:
                    logger.exception(msg="Could not remove {}".format(path))

    def deliver_item(self, item_url, *args, **kwargs):
        """Deliver a single order item.

           Returns
           -------
           url: str
               URL where the file may be accessed by the user that placed the
               order

        """

        file_hash = re.search(r"(.{32})\.", item_url).group(1)
        delivery_url = "http://{}{}".format(
            Site.objects.get_current().domain,
            reverse(
                "retrieve_download",
                kwargs={"version": 1, "file_hash": file_hash}
            )
        )
        return delivery_url

    def get_collection_id(self, item_id):
        pass

    @classmethod
    def parse_option(cls, name, value, **kwargs):
        """Parse the input option into a string for storing in the DB"""
        if name == "bbox":
            result = utils.parse_bbox_option(value)
        else:
            result = value.text
        return result

    def prepare_batch(self, sequential_items, *args, **kwargs):
        target_dir = Path(settings.HEV_E["general"]["downloads_dir"])
        if not target_dir.is_dir():
            target_dir.mkdir(parents=True)
        result = {
            "target_dir": str(target_dir),
        }
        pre_gen_dir = Path(
            settings.HEV_E["general"]["pre_generated_files_dir"])
        for type_name in DatasetType.__members__.keys():
            items = [i for i in sequential_items if
                     i["identifier"].partition(":")[0] == type_name]
            name_hash = prepare_collection_type_batch(items)
            file_name = "{}.gpkg".format(name_hash)
            pre_gen_path = pre_gen_dir / file_name
            cached_path = target_dir / file_name
            target = pre_gen_path if pre_gen_path.exists() else cached_path
            result[type_name] = {
                "name_hash": name_hash,
                "geopackage_target_path": str(target),
                "geopackage_exists": target.is_file()
            }
        return result


    def prepare_item(self, identifier, options=None, batch_data=None,
                     **kwargs):
        """Prepare an order item according to the input options

        Returns
        -------
        str
            A file url to the prepared item

        Raises
        ------
        oseoserver.errors.OseoServerError
            If the item cannot be found

        """

        logger.debug("prepare_item called: {}".format(locals()))
        collection, layer_name = identifier.partition(":")[::2]
        options = dict(options) if options is not None else {}
        # altering the option's name to `format_` to avoid clashing with
        # python's `format` function
        if options.get("format") is not None:
            options["format_"] = options["format"]
            del options["format"]
        handler = {
            DatasetType.exposure.name: exposure_download.prepare_exposure_item,
            DatasetType.hazard.name: hazard_download.prepare_item,
            DatasetType.vulnerability.name: (
                vulnerability_download.prepare_item),
        }[collection]
        return handler(layer_name, batch_data=batch_data, **options)


