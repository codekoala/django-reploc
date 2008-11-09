from django.core.management.base import BaseCommand
from reploc.models import Location
from reploc import utils

class Command(BaseCommand):
    help = """Attempts to find the appropriate latitude and longitude coordinates for
each of the active locations in the representatives database."""

    def handle(self, **options):
        self.validate(display_num_errors=False)

        print 'Updating location coordinates...'

        count = {'s': 0, 'f': 0}

        for l in Location.objects.active():
            try:
                coords = utils.get_coordinates(l)
                print '\t%s' % l.string_address,
            except:
                print 'Error'
                l.coordinate_error = True
                l.save()
                count['f'] += 1
            else:
                print coords
                l.update_coordinates(coords)
                count['s'] += 1

        print 'Successful updates: %i' % count['s']
        print 'Failed updates: %i' % count['f']
        print 'All done!'