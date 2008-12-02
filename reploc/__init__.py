import os

VERSION = (0, 1, 0, 'pre2')

def version():
    return '%s.%s.%s-%s' % VERSION

def get_version():
    return 'Representative Locator %s' % version()

if os.environ.get('DJANGO_SETTINGS_MODULE', None):
    from django.db.models.signals import post_save
    from reploc.models import Location
    from decimal import Decimal
    from datetime import datetime, timedelta
    from reploc.utils import get_coordinates

    def update_coordinates(sender, instance, created, *args, **kwargs):
        """
        Retrieves the latitude and longitude coordinates of an address for a dealer
        location object.  This makes it so the application does not have to
        constantly be requesting the same information each time the dealer locator
        page is displayed.
        """

        now = datetime.now()

        # if the last check was within the last 5 minutes, skip the coord update
        # since we call the instance.save() method in this function, we would be
        # put in an infinite loop without something like this.
        if not instance.get_coordinates or \
            (instance.last_coord_check and \
            instance.last_coord_check > now - timedelta(minutes=5)):
            return

        try:
            # retrieve the coordinates from Google Maps
            coords = get_coordinates(instance)
        except:
            # if we run into any problems, just set the error and leave
            instance.coordinate_error = True
            instance.save()
        else:
            # otherwise, save the coordinates
            instance.update_coordinates(coords)

    # connect the callback to the signal
    post_save.connect(update_coordinates, sender=Location)
