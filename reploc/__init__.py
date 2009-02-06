import os

VERSION = (0, 1, 0, 'pre3')

def version():
    return '%s.%s.%s-%s' % VERSION

def get_version():
    return 'Representative Locator %s' % version()

