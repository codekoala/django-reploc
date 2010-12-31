from django.db import models
from decimal import Decimal
from datetime import datetime

class RepresentativeManager(models.Manager):
    def active(self):
        return self.filter(is_active=True)

class Representative(models.Model):
    """
    This model can be used for dealers, vendors, friends, etc... anything
    you want really.
    """
    name = models.CharField(max_length=50)
    is_active = models.BooleanField(default=True)
    date_created = models.DateTimeField(auto_now_add=True)
    date_updated = models.DateTimeField(auto_now=True)

    objects = RepresentativeManager()

    def __unicode__(self):
        return self.name

    location_count = property(lambda r: r.locations.count())

    class Meta:
        ordering = ['name']

class Attribute(models.Model):
    """
    If your representatives are dealers or vendors, for example, attributes
    may represent the various types of your products that the representatives
    carry.
    """
    name = models.CharField(max_length=100)
    description = models.CharField(max_length=255, blank=True)
    icon = models.ImageField(upload_to='img/attributes', blank=True)

    def __unicode__(self):
        return self.name

    class Meta:
        ordering = ['name']

class LocationManager(models.Manager):
    def active(self):
        return self.filter(representative__is_active=True)

class Location(models.Model):
    """
    Locations are just that--locations that your representatives have.  In
    many cases, your reps may only have one location, but you are allowed to
    define many more than just one location per rep.
    """
    representative = models.ForeignKey(Representative, related_name='locations')
    street1 = models.CharField('Street Address', max_length=50)
    street2 = models.CharField("Street Address, con't", max_length=50, blank=True)
    city = models.CharField(max_length=50)

    # TODO: see if it's worth linking this to a table
    state = models.CharField('State/Province', max_length=50, blank=True)
    postal_code = models.CharField(max_length=20, blank=True)

    # TODO: see if it's worth linking this to a table
    country = models.CharField(max_length=30, default='USA')
    telephone = models.CharField(max_length=30, blank=True)
    fax = models.CharField(max_length=30, blank=True)
    website = models.CharField(max_length=100, blank=True)
    email = models.EmailField(blank=True)
    attributes = models.ManyToManyField(Attribute, related_name='attributes', blank=True)
    date_created = models.DateTimeField(auto_now_add=True)
    date_updated = models.DateTimeField(auto_now=True)

    # the following fields are used to keep track of information pertaining to
    # latitude and longitude coordinates.  These should be
    get_coordinates = models.BooleanField(default=True, help_text='Check this box if you wish to have the coordinates retrieved automatically.')
    coordinate_error = models.BooleanField(default=False, editable=False, help_text='This will be True if the automated coordinate fetcher finds a problem and cannot retrieve the coordinates.')
    latitude = models.DecimalField(max_digits=10, decimal_places=7, blank=True, null=True, help_text='This is usually set automatically.')
    longitude = models.DecimalField(max_digits=10, decimal_places=7, blank=True, null=True, help_text='This is usually set automatically.')
    last_coord_check = models.DateTimeField(editable=False, null=True)

    objects = LocationManager()

    def __unicode__(self):
        return u'Location for %s in %s, %s' % (self.representative, self.city, self.state)

    coordinates = property(lambda l: (float(l.latitude), float(l.longitude)))

    def is_active(self):
        """
        Passes through to display the status of the representative
        """
        return self.representative.is_active
    is_active.short_description = 'Is Active'

    def update_coordinates(self, new_coords):
        """
        Saves a new set of coordinates
        """
        self.latitude = Decimal(str(new_coords[0]))
        self.longitude = Decimal(str(new_coords[1]))
        self.last_coord_check = datetime.now()
        self.coordinate_error = False
        return self.save()

    def __string_address(self):
        """
        Returns the whole address in a one-line string
        """
        return u'%s %s, %s, %s %s, %s' % (self.street1,
                                          self.street2,
                                          self.city,
                                          self.state,
                                          self.postal_code,
                                          self.country)
    string_address = property(__string_address)

    class Meta:
        ordering = ['state', 'city', 'street1', 'street2']
