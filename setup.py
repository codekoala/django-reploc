#!/usr/bin/env python
# -*- coding: utf-8 -*-

from setuptools import setup, find_packages
import reploc

setup(
    name='django-reploc',
    version=reploc.version(),
    description="A simple way for people to find representative locations on your Django-powered Web site.",
    long_description=open('README.rst', 'r').read(),
    keywords='django, dealers, vendors, representatives, locator, map',
    author='Josh VanderLinden',
    author_email='codekoala at gmail dot com',
    url='http://bitbucket.org/codekoala/django-reploc/',
    license='MIT',
    package_dir={'reploc': 'reploc'},
    include_package_data=True,
    packages=find_packages(),
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
    ],
    zip_safe=False
)
