import traceback

from django.core.management.base import BaseCommand
from reploc.models import Location
from reploc import utils

class Command(BaseCommand):
    help = """Attempts to find the appropriate latitude and longitude coordinates for
each of the active locations in the representatives database."""

    def handle(self, **options):
        self.validate(display_num_errors=False)

        self.stdout.write('Updating location coordinates...\n')

        count = {'s': 0, 'f': 0}

        for l in Location.objects.active():
            try:
                coords = utils.get_coordinates(l)
                self.stdout.write('\t%s\t' % l.string_address)
            except:
                self.stdout.write('Error getting coordinates for %s:\n%s\n\n' % (l, traceback.format_exc()))
                l.coordinate_error = True
                l.save()
                count['f'] += 1
            else:
                self.stdout.write('%s\n' % (coords,))
                l.update_coordinates(coords)
                count['s'] += 1

        self.stdout.write('Successful updates: %i\n' % count['s'])
        self.stdout.write('Failed updates: %i\n' % count['f'])
        self.stdout.write('All done!\n')
