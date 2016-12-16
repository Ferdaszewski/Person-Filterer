"use strict";

// namespace for this application
var app = {};

app.Person = Backbone.Model.extend({
    matchFilters: function(filters) {
        var match = false;
        filters.forEach(function(filter) {

            // for a person to match they must pass at least one criteria
            match = match || filter.checkPerson(this);
            if (match) return;
        }, this);

        return match;
    }
});

app.PersonList = Backbone.Collection.extend({
    model: app.Person,
    url: "/data/persons.json",
    comparator: function(person) {
        return person.get("lastName").toLowerCase() + person.get("firstName").toLowerCase();
    }
});

app.PersonView = Backbone.View.extend({
    tagName: 'tr',
    template: _.template($('#person-template').html()),
    render: function() {
        this.$el.html(this.template(this.model.toJSON()));
        return this;
    }
});

app.filterCriteria = Backbone.Model.extend({
    initialize: function() {
        this.set("active", false);
    },
    checkPerson: function(person) {
        var criteria = this.get("criteria");
        var pass = true;

        for (var key in criteria) {
            var pValue = person.get(key).toLowerCase();
            var cValue = criteria[key].toLowerCase();

            // for a person to pass they must match all criteria of a filter
            pass = pass && (pValue.indexOf(cValue) !== -1);
        }

        return pass;
    }
});

app.FilterList = Backbone.Collection.extend({
    model: app.filterCriteria,
    url: "/data/filters.json"
});

app.FilterView = Backbone.View.extend({
    tagName: 'button',
    template: _.template('<%= description %>'),
    render: function() {
        this.$el.html(this.template(this.model.toJSON()));
        return this;
    },
    events: {
        'click': 'toggleButton'
    },
    toggleButton: function(evt) {
        evt.preventDefault();

        // toggle whether this filter is active or not
        this.model.set('active', !this.model.get('active'))
        this.$el.toggleClass("selected");

        // the set of active filters has changed, so let's update the person list
        app.view.updatePersonList();
    }
});

app.View = Backbone.View.extend({
    el: '#app',
    initialize: function() {
        app.pList.on('add', this.updatePersonList, this);
        app.pList.fetch();

        app.fList.on('add', this.addOneFilter, this);
        app.fList.fetch();
    },
    addOnePerson: function(person) {
        var pView = new app.PersonView({model: person});
        $('#people-table tbody').append(pView.render().el);
    },
    updatePersonList: function() {
        var filteredList;
        var activeFilters = app.fList.where({active: true});

        // clear the persons table
        $('#people-table tbody').empty();

        if (activeFilters.length === 0) {
            filteredList = app.pList;
        }
        else {
            filteredList = app.pList.filter(function(person) {
                return person.matchFilters(activeFilters);
            }, this);
        }

        filteredList.forEach(this.addOnePerson, this);
    },
    addOneFilter: function(filter) {
        var fView = new app.FilterView({model: filter});
        $('#filter-buttons').append(fView.render().el);
    }
});


$(function() {
    app.pList = new app.PersonList();
    app.fList = new app.FilterList();
    app.view = new app.View();
});
