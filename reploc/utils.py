from django.db.models.signals import post_save
from django.conf import settings
from reploc.models import Location
from datetime import datetime, timedelta
from geopy import geocoders


def get_coordinates(location=None, address=None):
    if not location and not address:
        raise ValueError('You must specify either a Location object or a string address!')
    elif location:
        addy = location.string_address
    elif address:
        addy = address

    try:
        g = geocoders.Google(settings.GOOGLE_MAPS_KEY)
    except AttributeError:
        return

    # retrieve the coordinates from Google Maps
    results = g.geocode(addy, exactly_one=False)
    place, coord = results.next()

    return coord

def update_coordinates(sender, instance, created, *args, **kwargs):
    """
    Retrieves the latitude and longitude coordinates of an address for a dealer
    location object.  This makes it so the application does not have to
    constantly be requesting the same information each time the dealer locator
    page is displayed.
    """

    now = datetime.now()

    # bail out if there has been an error getting the coordinates; avoids
    # infinite recursion
    if instance.coordinate_error:
        return

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
