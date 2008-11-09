from geopy import geocoders
from django.conf import settings

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