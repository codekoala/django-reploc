from math import *

from django.shortcuts import render_to_response
from django.http import Http404
from django.utils.simplejson import JSONEncoder
from reploc.models import Location
from reploc import utils

def get_locations(request):
    """
    Retrieves all locations for all active representatives and returns the
    collection as a JSON object.
    """

    locations = Location.objects.active()
    json = JSONEncoder()

    data = {'locations': [jsonify_location(l) for l in locations]}

    return render_to_response('reploc/json.js',
                              {'json': json.encode(data)},
                              mimetype='text/javascript')

def find_locations_in_radius(request):
    """
    Determines the coordinates of the input address and finds all active
    locations within the specified radius.  The results are returned as a JSON
    object.
    """

    # This view should only be requested via an HTTP POST + XHR request
    if not (request.method == 'POST' and request.is_ajax()):
        raise Http404

    json = JSONEncoder()

    # snag some needed info from the request
    address = request.POST.get('address', '')
    radius = float(request.POST.get('radius', 25));

    try:
        # TODO: figure out how to make this better when more than one result
        # is retrieved
        coords = utils.get_coordinates(address=address)
    except StopIteration:
        # this happens if no matches were found
        err = {'error': 'Please enter a valid location!'}
        return render_to_response('reploc/json.js',
                                  {'json': json.encode(err)})

    lat1, lng1 = float(coords[0]), float(coords[1])

    # put stuff into a dictionary
    data = {'center': {
                'address': address,
                'lat': lat1,
                'lng': lng1
            },
            'locations': []}

    # this number is used a lot.  I'm not math wiz, so I have no idea what it's
    # used for, but my guess is that it has something to do with trig (which I
    # conveniently skipped in school)
    C = 57.2958

    # iterate over all active locations
    for location in Location.objects.active():
        lat2, lng2 = location.coordinates

        # check the distance between the center and the location
        # source: http://www.meridianworlddata.com/Distance-Calculation.asp
        dist = 3963.189 * acos(sin(lat1 / C) * sin(lat2 / C) + cos(lat1 / C) * cos(lat2 / C) * cos(lng2 / C - lng1 / C))

        # if the location is within the radius of the input address, add it to
        # our collection
        if dist <= radius:
            data['locations'].append(jsonify_location(location))

    # send everything back as a JSON object
    return render_to_response('reploc/json.js',
                              {'json': json.encode(data)},
                              mimetype='text/javascript')

def jsonify_location(l):
    """
    Puts the appropriate information about a location into a JSON-serializable
    format.  I think the biggest showstoppers that required this function were
    the latitude and longitude fields because they are Decimal objects, and
    the JSONEncoder does not like them.
    """

    lat = l.latitude
    if lat:
        lat = float(lat)

    lng = l.longitude
    if lng:
        lng = float(lng)

    return {
            'representative': l.representative.name,
            'street1': l.street1,
            'street2': l.street2,
            'city': l.city,
            'state': l.state,
            'postal_code': l.postal_code,
            'telephone': l.telephone,
            'fax': l.fax,
            'website': l.website,
            'email': l.email,
            'lat': lat,
            'lng': lng
        }
