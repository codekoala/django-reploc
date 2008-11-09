//<![CDATA[
var map, circle, circleRadius, centerMarker, origin, geocoder;
var markers = [];
var blurbs = [];
var titles = [];
var C = 57.2958;
var ajax, dirTitle, directions, directionsPanel, dpJQ;
var refAdd, refRad, maxDist;
var btnFind, btnReset;
var locMatch;

// Things to do when the page is fully loaded
$(document).ready(function () {
    // Make it easy to access page elements
    dirTitle = $('#directions-title');
    dpJQ = $('#location-directions');
    ajax = $('#ajax-progress');
    refAdd = $('#reference-address');
    refRad = $('#reference-radius');
    btnFind = $('#find-locations');
    btnReset = $('#reset-locations');
    locMatch = $('#location-matches');

    // for some reason, pulling this back with jQuery doesn't work with the API
    directionsPanel = document.getElementById("location-directions");

    // make sure the browser can handle Google Maps
    if (GBrowserIsCompatible()) {
        // set up Google Maps
        origin = new GLatLng(39.232253,-95.273437);
        map = new GMap2(document.getElementById("representative-map"));
        map.setCenter(origin, 4);
        map.addControl(new GSmallMapControl());
        map.addControl(new GMapTypeControl());
        //map.enableScrollWheelZoom();

        {% if REPLOC_USE_JS %}geocoder = new GClientGeocoder();{% endif %}

        // for getting driving directions
        directions = new GDirections(map, directionsPanel);

        // put markers on the map for all locations in the database
        showAllLocations();

        // Setup some event listeners
        refAdd.keypress(function (e) {
            // If the user hits enter in the address box, simulate clicking
            // the "search" button
            if (e.which == 13) { findLocationsInRadius(); }
        });
        btnFind.click(findLocationsInRadius);
        btnReset.click(resetMap);
    } else {
        alert('This page requires a modern browser which supports Google Maps!');
    }
});
$(document).unload(GUnload);

function createMarker(point, number, loc) {
    // Add a marker overlay to the map and store various bits of info about it
    var marker = new GMarker(point);
    marker.value = number;

    // The only time we shouldn't have a representative is when it's the address
    // entered by the user
    if (loc.representative) {
        // Setup the blurb for the marker's info box
        var myHtml = '<h3 class="representative">' + loc.representative + '</h3>';
        myHtml += '<div>' + loc.street1 + '</div>';
        myHtml += '<div>' + loc.street2 + '</div>';
        myHtml += '<div>' + loc.city + ', ';
        myHtml += loc.state + ' ' + loc.postal_code + '</div>';

        // Only show the telephone number if it's available
        if (loc.telephone.length) {
            myHtml += '<div><strong>Tel.</strong>: ' + loc.telephone + '</div>';
        }

        // Only show the fax number if it's available
        if (loc.fax.length) {
            myHtml += '<div><strong>Fax</strong>: ' + loc.fax + '</div>';
        }

        // Only show the website if it's available
        if (loc.website.length) {
            myHtml += '<div><strong>WWW</strong>: ' + loc.website + '</div>';
        }

        // Only show the email if it's available
        if (loc.email.length) {
            myHtml += '<div><strong>E-mail</strong>: ' + loc.email + '</div>';
        }

        // Add a listener to pop up an info box when the mouse goes over a marker
        GEvent.addListener(marker, "mouseover", function() {
            map.openInfoWindowHtml(point, myHtml);
        });

        // Keep track of the marker's data
        titles.push(loc.representative);
        markers.push(marker);
        blurbs.push(myHtml);
    }

    return marker;
}

function showAllLocations() {
    // Pull back all locations from the database and make markers for each one
    $.ajax({
        url : '{% url reploc-locations %}',
        type : 'POST',
        dataType : 'json',
        success : function (json) {
            for (var l = 0; l < json.locations.length; l++) {
                var loc = json.locations[l];
                var point = new GLatLng(loc.lat, loc.lng);
                map.addOverlay(createMarker(point, l, loc));
            }
        }
    });
}

function findLocationsInRadius() {
    // Search all of the markers we have for points that are within the chosen
    // radius from the address entered by the user
    ajax.fadeIn('fast');

    // reset some elements
    dirTitle.text('');
    directionsPanel.innerHTML = '';
    directions.clear();
    map.closeInfoWindow();

    locMatch.slideUp('fast');
    maxDist = parseInt(refRad.val());

    {% if REPLOC_USE_JS %}
    geocoder.getLatLng(
        refAdd.val(),
        function (point) {
            // Bail out if there was a problem on the server
            if (!point) { alert('Please enter a valid address'); ajax.fadeOut(); return; }

            if (centerMarker) {
                map.removeOverlay(centerMarker);
            }

            centerMarker = createMarker(point, 10000, {address : refAdd.val()});
            map.addOverlay(centerMarker);
            doDrawCircle();

            // Only show markers that are within the specified radius
            var op = centerMarker.getLatLng();
            var lat1 = op.lat();
            var lng1 = op.lng();
            var matches = [];

            // iterate over all markers to find the distance from the specified address
            for (var l = 0; l < markers.length; l++) {
                var m = markers[l];
                var mp = m.getLatLng();
                var lat2 = mp.lat();
                var lng2 = mp.lng();

                // Compute the distance between the input address and the marker
                var dist = 0;
                with (Math) {
                    // Source: http://www.meridianworlddata.com/Distance-Calculation.asp
                    dist = 3963.189 * acos(sin(lat1 / C) * sin(lat2 / C) + cos(lat1 / C) * cos(lat2 / C) * cos(lng2 / C - lng1 / C));
                }
                m.hide();

                if (dist <= maxDist) {
                    m.show();
                    matches.push(m);
                }
            }

            filterLocations(matches);
        }
    );
    {% else %}
    $.ajax({
        url : '{% url reploc-find-locations %}',
        type : 'POST',
        data : {'address': refAdd.val(),
                'radius' : refRad.val()},
        dataType : 'json',
        error : function (xhr, status, err) {
            alert(err);
        },
        success : function (json) {
            // Bail out if there was a problem on the server
            if (json.error) { alert(json.error); ajax.fadeOut(); return; }

            if (centerMarker) {
                map.removeOverlay(centerMarker);
            }

            var matches = [];
            var point = new GLatLng(json.center.lat, json.center.lng);
            centerMarker = createMarker(point, 10000, json.center);
            map.addOverlay(centerMarker);
            doDrawCircle();

            // now run over all markers to find markers with the same lat/lng
            for (var l = 0; l < markers.length; l++) {
                var m = markers[l];
                var mp = m.getLatLng();
                var lat = mp.lat();
                var lng = mp.lng();

                m.hide();

                with (Math) {
                    for (var z = 0; z < json.locations.length; z++) {
                        var loc = json.locations[z];
                        if (loc.lat.toFixed(5) == lat.toFixed(5) &&
                            loc.lng.toFixed(5) == lng.toFixed(5)) {
                            m.show();
                            matches.push(m);
                        }
                    }
                }
            }
            filterLocations(matches);
        }
    });
    {% endif %}
}

function resetMap() {
    // Reset the map and overlays
    ajax.fadeIn();
    map.setZoom(4);
    map.panTo(origin);
    locMatch.slideUp('slow', function () { $(this).html(''); });
    map.removeOverlay(circle);
    map.removeOverlay(centerMarker);
    map.closeInfoWindow();
    for (var m = 0; m < markers.length; m++) {
        var mkr = markers[m];
        if (mkr.isHidden()) { mkr.show(); }
    }
    dirTitle.text('');
    directionsPanel.innerHTML = '';
    directions.clear();
    ajax.fadeOut();
}

// Source: http://maps.forum.nu/gm_sensitive_circle2.html
function doDrawCircle() {
    if (circle) {
        map.removeOverlay(circle);
    }

    var center = centerMarker.getLatLng();
    var bounds = new GLatLngBounds();
    var circlePoints = Array();
    circleRadius = parseInt(refRad.val());

    with (Math) {
        var d = circleRadius / 3963.189;  // radians

        var lat1 = (PI / 180) * center.lat(); // radians
        var lng1 = (PI / 180) * center.lng(); // radians

        for (var a = 0 ; a < 361 ; a++ ) {
            var tc = (PI / 180) * a;
            var y = asin(sin(lat1) * cos(d) + cos(lat1) * sin(d) * cos(tc));
            var dlng = atan2(sin(tc) * sin(d) * cos(lat1), cos(d) - sin(lat1) * sin(y));
            var x = ((lng1 - dlng + PI) % (2 * PI)) - PI ; // MOD function
            var point = new GLatLng(parseFloat(y * (180 / PI)), parseFloat(x * (180 / PI)));
            circlePoints.push(point);
            bounds.extend(point);
        }

        if (d < 1.5678565720686044) {
            circle = new GPolygon(circlePoints, '#051b2d', 2, 1, '#7688a0', 0.3);
        }
        else {
            circle = new GPolygon(circlePoints, '#000000', 2, 1);
        }
        map.addOverlay(circle);

        map.setZoom(map.getBoundsZoomLevel(bounds));
    }
    map.panTo(centerMarker.getLatLng());
}

function filterLocations(matches) {
    // now list each of the matches
    var html = '<h4>Locations Found Within ' + maxDist + ' Miles of ' + refAdd.val() + '</h4>';
    if (matches.length <= 0) {
        html += '<p>No locations are within the area specified.</p>';
    } else {
        for (var m = 0; m < matches.length; m++) {
            marker = matches[m];
            html += '<div class="representative-location" id="dl' + marker.value + '">';
            html += blurbs[marker.value];
            html += '<div><a href="#representative-map" id="dda' + marker.value + '" class="get-directions">Driving directions</a></div>';
            html += '</div>';
        }
    }
    locMatch.html(html);

    // add a listener for when the user clicks on a match
    var locs = $('div.representative-location');
    locs.click(function () {
            document.location = '#representative-map';
            ajax.fadeIn();

            // Get the marker's value
            var num = parseInt($(this).attr('id').replace('dl', ''));
            marker = markers[num];
            map.setZoom(14);

            // show an info box for the marker
            map.openInfoWindowHtml(marker.getLatLng(), blurbs[num]);
            map.panTo(marker.getLatLng());

            // keep the chosen match highlighted
            $(this).siblings().removeClass('active');
            $(this).addClass('active');

            ajax.fadeOut();
        });

    locMatch.slideDown();

    // add an event handler for when the user wants to get driving directions
    var drvDirs = $('a.get-directions').click(function () {
            ajax.fadeIn();

            directionsPanel.innerHTML = '';

            // Get the marker's value
            var num = parseInt($(this).attr('id').replace('dda', ''));
            marker = markers[num];
            directions.load('from: ' + centerMarker.getLatLng().lat() + ', ' + centerMarker.getLatLng().lng() + ' to: ' + marker.getLatLng().lat() + ', ' + marker.getLatLng().lng());
            dirTitle.text('Driving Directions to ' + titles[num]);

            ajax.fadeOut();
        });

    // make all matches the same height, both for aesthetics and CSS sanity
    var maxHeight = 0;
    $.each(locs, function () {
            var h = $(this).height();
            if (h > maxHeight) { maxHeight = h; }
        });
    locs.height(maxHeight);

    ajax.fadeOut('slow');
}
//]]>