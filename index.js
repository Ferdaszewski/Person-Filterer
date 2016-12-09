"use strict";


// IIFE used to scope my vars!
(function() {

    // ordered array of person data (keys)
    var PERSON_KEYS = [
        "firstName",
        "lastName",
        "streetAddress",
        "city",
        "state",
        "zip"
    ];

    // save persons data so we only have to get it once.
    var persons = [];
    var activeFilters = {};


    /**
     * Fetches person data.
     * Takes an optional retry argument, that if true, on failure of the GET request
     * it will attempt to getPersons again.
     */
    function getPersons(retry) {
        retry = !!retry;

        $.getJSON("data/persons.json")
            .done(function(data) {
                if (data && data.length > 0) {
                    data.sort(sortByName);
                    persons = data;
                    populate(persons);
                }
            })

            .fail(function(error) {
                console.log("ERROR getting persons: ", error);

                if (retry) {
                    window.setTimeout(function() {
                        // try again, but don't keep trying
                        getPersons(false);
                    }, 5000);
                }
            });
    }


    /** Fetch filter data.
     * Takes an optional retry argument, that if true, on failure of the GET request
     * it will attempt to getFilters again.
     */
    function getFilters(retry) {
        retry = !!retry;

        $.getJSON("data/filters.json")
            .done(function(data) {
                if (data && data.length > 0) {
                    buttonify(data);
                }
            })

            .fail(function(error) {
                console.log("ERROR getting filters: ", error);
                if (retry) {
                    window.setTimeout(function() {
                        // try again, but don't keep trying
                        getFilters(false);
                    }, 5000);
                }
            });
    }


    /**
     * Takes an array of persons and populates them into an HTML table.
     */
    function populate(persons) {
        // remove any existing data in the table
        var tableBody = $("#people-table tbody").empty();

        // append a row for each person to the table
        for (var i = 0; i < persons.length; i++) {
            var person = persons[i];
            var row = $("<tr>");
            for (var j = 0; j < PERSON_KEYS.length; j++) {
                row.append($("<td>").text(person[PERSON_KEYS[j]]));
            }
            tableBody.append(row);
        }

    }


    /** Takes an array of filter objects and makes them into buttons.
     */
    function buttonify(filters) {
        // remove any existing buttons
        var buttonDiv = $("#button-div").empty();

        for (var i = 0; i < filters.length; i++) {
            var filter = filters[i];
            var button = $("<button>").text(filter.description);

            // used to uniquely identify filters, description could be used, but
            // since it is not guaranteed to be unique, could cause issues.
            filter["index"] = i;

            button.data(filter);
            button.click(buttonClickHandler);
            buttonDiv.append(button);
        }
    }

    /**
     * Filters the persons list using the activeFilters list.
     * A person passes a filter if for *all* of the filter's "criteria",
     * the criterion value exists as a case-insensitive substring of the
     * same key on the person object
     */
    function filterPersons() {
        // if there are no active filters, display everybody
        if (Object.keys(activeFilters).length === 0) {
            return populate(persons);
        }

        var filteredPeople = persons.filter(function(person) {

            // for a person to match they must match all criteria of a filter
            for (var i in activeFilters) {
                var match = true;
                var criteria = activeFilters[i].criteria;

                for (var key in criteria) {
                    var pValue = person[key].toLowerCase();
                    var cValue = criteria[key].toLowerCase();
                    match = match && (pValue.indexOf(cValue) !== -1);
                }

                // we can exit early once we have one match
                if (match) return true;
            }

            // no filter matched
            return false;
        });

        populate(filteredPeople);
    }


    /**
     * Utility function to handle a click on a filter button.
     */
    function buttonClickHandler(event) {
        event.preventDefault();
        var button = $(event.target);
        var filterData = button.data();

        if (button.hasClass("selected")) {
            delete activeFilters[filterData.index];
        } else {
            activeFilters[filterData.index] = filterData;
        }

        button.toggleClass("selected");
        filterPersons();
    }


    /** 
     * Utility function that takes two objects, sorts lexicographically by
     * "lastName" then "firstName", and returns -1 if a is before b, 1 if a is after b,
     * and 0 if they are the same.  Intended to be used as the compareFunction when
     * sorting an array of person objects.
     */
    function sortByName(a, b) {
        var nameA = a.lastName.toLowerCase() + a.firstName.toLowerCase();
        var nameB = b.lastName.toLowerCase() + b.firstName.toLowerCase();

        if (nameA < nameB) return -1;
        if (nameA > nameB) return 1;

        return 0;
    }


    // kick this thing off once the DOM is ready
    $(function() {
        getPersons(true);
        getFilters(true);
    });

}())
