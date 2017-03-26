var ObservableLocation = function(data) {
  this.title = ko.observable(data.title);
  this.blurb = ko.observable(data.blurb);
  this.when = ko.observable(data.when);
  this.day = ko.observable(data.day);
  this.weeks = ko.observable(data.weeks);
  this.hour = ko.observable(data.hour);
  this.minute = ko.observable(data.minute);
  this.link = ko.observable(data.link);
  this.location = ko.observable(data.location);
  this.placeId = ko.observable(data.placeId);
  this.type = ko.observable(data.type);
  this.nextMeeting = ko.observable(data.nextMeeting);
  this.prettyMeeting = ko.observable(data.prettyMeeting);
  this.listExpanded = ko.observable(false);

  var backColor = '#' + getColor(data.type);
  this.color = ko.observable(backColor);

  this.listContents = ko.observable('<h3 class="list-header">' + this.title() + '</h3>');

  var d = new Date();
  this.timeToNext = ko.observable(this.nextMeeting() - d);  // 24 hrs = 86400000 ms

};

var ViewModel = function() {
  var self = this;
  self.locationList = ko.observableArray([]);

  locations.forEach(function(locItem) {
    var newLocItem = new ObservableLocation(locItem);
    self.locationList.push(newLocItem);
  });

  this.listContentsClicked = function() {
    if (!this.listExpanded()){
      this.listExpanded(true);
      this.listContents('<h3 class="list-header">' + this.title() + '</h3>' +
                        '<div class="list-item"><span class="item-header">Next Event:</span> ' + this.prettyMeeting() + '</div>' +
                        '<div class="list-item"><span class="item-header">About:</span> ' + this.blurb() + '</div>');
    } else {
      this.listExpanded(false);
      this.listContents('<h3 class="list-header">' + this.title() + '</h3>');
    }
  };
/*
  this.isInTwentyFour = function() {
    var d = new Date();
    var inTwentyFour = false;
    if ((this.nextMeeting() - d) < 86400000) {
      inTwentyFour = true;
    }
    return inTwentyFour;
  }
*/

};

ko.applyBindings(new ViewModel());
