#!/usr/bin/env python
# -*- coding: utf-8 -*-

from distutils.core import setup
import reploc
import sys, os

def fullsplit(path, result=None):
    """
    Split a pathname into components (the opposite of os.path.join) in a
    platform-neutral way.
    """
    if result is None:
        result = []
    head, tail = os.path.split(path)
    if head == '':
        return [tail] + result
    if head == path:
        return result
    return fullsplit(head, [tail] + result)

packages, data_files = [], []
root_dir = os.path.dirname(__file__)
if root_dir != '':
    os.chdir(root_dir)
reploc_dir = 'reploc'

for path, dirs, files in os.walk(reploc_dir):
    # ignore hidden directories and files
    for i, d in enumerate(dirs):
        if d.startswith('.'): del dirs[i]

    if '__init__.py' in files:
        packages.append('.'.join(fullsplit(path)))
    elif files:
        data_files.append((path, [os.path.join(path, f) for f in files]))

setup(
    name='django-reploc',
    version=reploc.version(),
    url='http://code.google.com/p/django-reploc/',
    author='Josh VanderLinden',
    author_email='codekoala@gmail.com',
    license='MIT',
    packages=packages,
    data_files=data_files,
    description="A simple way for people to find representative locations on your Django-powered Web site.",
    long_description="""
django-reploc is a project that allows you to install a Google Map on your site to display and filter "representatives" for your site. These representatives may be dealers/vendors for your products, your friends or business associates, or just places you've been and want to advertise. I built the application to be a dealer locator, but I realize the value in an application like this and tried to make it as generic as possible.
""",
    keywords='django, dealers, vendors, representatives, locator, map',
    classifiers=[
        'Development Status :: 4 - Beta',
        'Environment :: Web Environment',
        'Framework :: Django',
        'Intended Audience :: Developers',
        'Intended Audience :: End Users/Desktop',
        'License :: OSI Approved :: MIT License',
        'Operating System :: OS Independent',
        'Programming Language :: Python',
        'Topic :: Communications',
        'Topic :: Internet :: WWW/HTTP :: Dynamic Content'
    ]
)
