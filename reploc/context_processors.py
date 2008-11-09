from django.conf import settings

def representatives(request):
    """
    Injects the Google Maps API key into the context
    """
    try:
        key = settings.GOOGLE_MAPS_KEY
    except AttributeError:
        key = ''
    try:
        js = settings.REPLOC_USE_JS
    except AttributeError:
        js = True

    return {'GOOGLE_MAPS_KEY': key,
            'REPLOC_USE_JS': js}