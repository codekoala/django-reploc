``django-reploc`` is a project that allows you to install a Google Map on your
site to display and filter "representatives" for your site. These
representatives may be dealers/vendors for your products, your friends or
business associates, or just places you've been and want to advertise. I built
the application to be a dealer locator, but I realize the value in an
application like this and tried to make it as generic as possible.

Features
========

* Unlimited number of representatives.
* Unlimited number of locations _per_ representative.
* Automatic latitude/longitude determination for locations.  If there's a
  problem determining the coordinates to the address, you can enter them
  manually.
* Locations can have "attributes."  This is a way of specifying, for example,
  which locations carry which lines of your products.
* You can decide whether you want to use JavaScript or Python to do the heavy
  lifting.
* Users can search for locations within a radius of an address they specify.
* Offer your users driving directions to various representative locations.

Requirements
============

``django-reploc`` requires at least Django 1.0.  For automatic coordinate
determination, ``django-reploc`` requires the ``geopy`` library.  This can be
installed using ``easy_install geopy``.  The application also requires that you
have a Google Maps API key.  To get one of those, simply go to `the Google Maps
API page <http://code.google.com/apis/maps/signup.html>`_ and fill out the
necessary information.  Finally, ``django-reploc`` relies heavily upon jQuery
in order to operate.  I used the latest version of jQuery, which is currently
1.2.6.

Installation
============

Download ``django-reploc`` using *one* of the following methods:

easy_install
------------

You can download the package from the `CheeseShop
<http://pypi.python.org/pypi/django-reploc/>`_ or use::

    easy_install django-reploc

to download and install ``django-reploc``.

pip
---

Install ``django-reploc`` using::

    pip install -U django-reploc

Package Download
----------------

Download the latest ``.tar.gz`` file from the downloads section and extract it
somewhere you'll remember.  Use ``python setup.py install`` to install it.

Clone From Source Control
-------------------------

You can get the latest copy of the source code from any of the these official
repositories::

    hg clone http://bitbucket.org/codekoala/django-reploc
    hg clone http://django-reploc.googlecode.com/hg django-reploc
    git clone http://github.com/codekoala/django-reploc.git

Verifying Installation
----------------------

The easiest way to ensure that you have successfully installed Pendulum is to
execute a command such as::

    python -c "import reploc; print reploc.get_version()"

If that displays the version of ``django-reploc`` that you tried to install,
you're good to roll.  If you see something other than that, you probably need
to check your ``PYTHONPATH`` environment variable.

Configuration
=============

First of all, you must add this project to your list of ``INSTALLED_APPS`` in
``settings.py``::

    INSTALLED_APPS = (
        'django.contrib.admin',
        'django.contrib.auth',
        'django.contrib.contenttypes',
        'django.contrib.sessions',
        'django.contrib.sites',
        ...
        'reploc',
        ...
    )

Next you should add the context processor to your
``TEMPLATE_CONTEXT_PROCESSORS`` setting so the templates have access to the
Google Maps API key.  You don't really need this step if you're going to put
the API key straight into your template.

::

    TEMPLATE_CONTEXT_PROCESSORS = (
        'django.core.context_processors.auth',
        'django.core.context_processors.i18n',
        'django.core.context_processors.media',
        'reploc.context_processors.representatives',
    )

Define your Google Maps API key in your ``settings.py`` file::

    GOOGLE_MAPS_KEY = 'sdfsafasfdasfdasdf'

Additionally, you may specify whether you would like the grunt work (distance
calculations and whatnot) handled by JavaScript or Python::

    REPLOC_USE_JS = False

This will probably never be used much, but it's there just in case.  The
application defaults to using JavaScript.

Run ``python manage.py syncdb``.  This creates a few tables in your database
that are necessary for operation.

Next, you should add an entry to your main ``urls.py`` file.  For example::

    from django.conf.urls.defaults import *

    from django.contrib import admin
    admin.autodiscover()

    urlpatterns = patterns('',
        (r'^admin/(.*)', admin.site.root),
        (r'^locator/', include('reploc.urls')),
    )

Finally, you'll probably want to copy the media files that I use in
``django-reploc``, unless you have some of your own.  Those files can be found
in the ``/media/`` directory of the project.  There are really only two files
that you should need to copy to your media directory:
``reploc/media/js/jquery-1.3.1.min.js`` and ``reploc/media/img/ajax.gif`` (see
http://code.google.com/p/django-reploc/source/browse/#hg%2Freploc%2Fmedia
for the specific files).  Alternatively, you may just override the templates to
use whatever you want.  I make no guarantees that the application will still
work if you do that though ;)

Usage
=====

As soon as you have all of the configuration taken care of, simply fire up your
site (or restart it) and jump into the Django administration interface.  You
can add locations straight from the "Add Representative" page if you'd like.
When you're done, head on over to http://www.yourwebsite.com/locator/ (or
whatever it happens to be in your case) to see the application in action.

Updating Location Coordinates
-----------------------------

I've created a utility to help you update the location coordinates if you feel
the need.  They should be updated each time you save a location, but if you
want to update all of the locations in one swing, you can use the command
``python manage.py reploc_update_coords``.
