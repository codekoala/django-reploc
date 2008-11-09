from django.conf.urls.defaults import *
from reploc import views

urlpatterns = patterns('',
    url(r'^$', 'django.views.generic.simple.direct_to_template',
        {'template': 'reploc/locator.html'}, name='reploc-map'),
    url(r'^locations/find/$', views.find_locations_in_radius, name='reploc-find-locations'),
    url(r'^locations/$', views.get_locations, name='reploc-locations'),
)
