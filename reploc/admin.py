from django.contrib import admin
from reploc.models import Representative, Location, Attribute

class LocationAdmin(admin.ModelAdmin):
    model = Location
    list_display = ['representative', 'city', 'state', 'postal_code', 'is_active', 'coordinate_error']
    search_fields = ['representative', 'street1', 'street2', 'city', 'state', 'postal_code', 'country']
    list_filter = ['coordinate_error', 'state', 'country']

    fieldsets = (
        (None, {'fields': ('representative', 'attributes',)}),
        ('Address Information', {
            'fields': ('street1', 'street2', 'city', 'state', 'postal_code', 'country')
        }),
        ('Contact Information', {
            'fields': ('telephone', 'fax', 'website', 'email')
        }),
        ('Miscellaneous Info', {
            'fields': ('get_coordinates', 'latitude', 'longitude'),
            'classes': ('collapse', )
        })
    )

class LocationInline(admin.StackedInline):
    model = Location
    extra = 1

class RepresentativeAdmin(admin.ModelAdmin):
    model = Representative
    inlines = [
        LocationInline,
    ]
    list_display = ['name', 'location_count', 'date_created']
    search_fields = ['name']
    date_hierarchy = 'date_created'
    list_filter = ['is_active']

admin.site.register(Location, LocationAdmin)
admin.site.register(Representative, RepresentativeAdmin)
admin.site.register(Attribute)