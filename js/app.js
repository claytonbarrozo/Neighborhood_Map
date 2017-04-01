var ObservableLocation = function(data) {
  this.title = ko.observable(data.title);
  this.blurb = ko.observable(data.blurb);
/*
  this.when = ko.observable(data.when);
  this.day = ko.observable(data.day);
  this.weeks = ko.observable(data.weeks);
  this.hour = ko.observable(data.hour);
  this.minute = ko.observable(data.minute);
*/
  /*this.link = ko.observable(data.link);*/
  this.address=ko.observable(data.address);
  this.location = ko.observable(data.location);
  /*this.placeId = ko.observable(data.placeId);*/
  this.type = ko.observable(data.type);
  this.nextMeeting = ko.observable(data.nextMeeting);
  this.prettyMeeting = ko.observable(data.prettyMeeting);
  this.listExpanded = ko.observable(false);
  /*this.listHidden = ko.observable(false);*/
  this.googleReady = ko.observable(false);

  this.nowReading = ko.observable(data.nowReading);
  this.author = ko.observable(data.author);
  this.bookImage = ko.observable(data.bookImage);

  this.defaultIcon = null;
  this.bigIcon = null;

  var backColor = '#' + getColor(data.type);
  this.color = ko.observable(backColor);

  this.listContents = ko.observable('<h3 class="list-header">' + this.title() + '</h3>');

  this.currentTime = ko.computed(function() {
    var d = new Date();
    return d;
  }, this);

  this.timeToNext = ko.observable(this.nextMeeting() - this.currentTime());
/*
  this.suggestedBooks = ko.observableArray(data.suggestedBooks);

  console.log('suggestedBooks = ' + this.suggestedBooks());
*/
};

var ViewModel = function() {
  this.googleReady = ko.observable(false);

  var self = this;
  self.locationList = ko.observableArray([]);
  self.filteredList = ko.observableArray([]);
  self.currentLocation = ko.observable();
  self.noLocationSelected = ko.observable(true);

  self.allBounds = null;

  locations.forEach(function(locItem) {
    var newLocItem = new ObservableLocation(locItem);
    self.locationList.push(newLocItem);
    self.filteredList.push(newLocItem);
  });

  this.makeMarkers = ko.computed(function() {
    if (self.googleReady()) {
      var largeInfowindow = new google.maps.InfoWindow();
      var bounds = new google.maps.LatLngBounds();

      self.locationList().forEach(function(item) {
        var iconColor = getColor(item.type());
        var icon = makeMarkerIcon(iconColor);
        var bigIcon = makeBigIcon(iconColor);
        item.defaultIcon = icon;
        item.bigIcon = bigIcon;
        item.marker = new  google.maps.Marker({
          map: map,
          position: item.location(),
          title: item.title(),
          address: item.address(),
          prettyMeeting: item.prettyMeeting(),
          blurb: item.blurb(),
          thumbnail: "http://books.google.com/books/content?id=w6RlAAAAMAAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api",
          booktitle: "VGL",
          icon: icon
        });

        item.marker.setAnimation(null);

        item.marker.addListener('click', function() {
          populateInfoWindow(this, largeInfowindow);
          self.locationList().forEach(function(item) {
            item.marker.setAnimation(null);
          });
          if (this.getAnimation() === null) {
            this.setAnimation(google.maps.Animation.BOUNCE);
          } else {
            this.setAnimation(null);
          }
        });

        bounds.extend(item.marker.position);
      });

      self.allBounds = bounds;
      map.fitBounds(bounds);
    }

  }, this);

  this.listItemMouseOver = function() {
    var bounds = new google.maps.LatLngBounds();
    bounds.extend(this.marker.position);

    // Thanks to StackOverflow for this nifty trick of extending bounds when you only have one point (which makes the map zoom too close!)
    // http://stackoverflow.com/questions/3334729/google-maps-v3-fitbounds-zoom-too-close-for-single-marker
    var extendPoint1 = new google.maps.LatLng(bounds.getNorthEast().lat() + 0.005, bounds.getNorthEast().lng() + 0.005);
    var extendPoint2 = new google.maps.LatLng(bounds.getNorthEast().lat() - 0.005, bounds.getNorthEast().lng() - 0.005);
    bounds.extend(extendPoint1);
    bounds.extend(extendPoint2);

    map.fitBounds(bounds);
    this.marker.setIcon(this.bigIcon);
  }

  this.listItemMouseOut = function() {
    this.marker.setIcon(this.defaultIcon);
    map.fitBounds(self.allBounds);
  }

  this.listContentsClicked = function() {
    if (!this.listExpanded()){
      this.listExpanded(true);
      this.listContents('<h3 class="list-header">' + this.title() + '</h3>' +
                        '<div class="list-item"><span class="item-header">Next Event:</span> ' + this.prettyMeeting() + '</div>' +
                        '<div class="list-item"><span class="item-header">About:</span> ' + this.blurb() + '</div>');

      self.currentLocation(this);
      self.noLocationSelected(false);

      // Make the marker associated with this list item bounce
      this.marker.setAnimation(google.maps.Animation.BOUNCE);

    } else {
      this.listExpanded(false);
      this.listContents('<h3 class="list-header">' + this.title() + '</h3>');

      self.currentLocation(null);
      self.noLocationSelected(true);

      // Stop marker from bouncing
      this.marker.setAnimation(null);
    }
  };

  this.filter = function(type) {
    var bounds = new google.maps.LatLngBounds();
    self.filteredList().length = 0;
    self.locationList().forEach(function(item) {
      if (item.type() === type || type === 'all') {
        self.filteredList.push(item);
        item.marker.setMap(map);
        bounds.extend(item.marker.position);
      } else {
        item.marker.setMap(null);
      }
    });
    self.allBounds = bounds;
    map.fitBounds(bounds);
  };

  this.checkIfInTime = function(timePeriod) {
    var bounds = new google.maps.LatLngBounds();
    var cutOffTime;

    switch (timePeriod) {
      case 'day':
        cutOffTime = 86400000;   // milliseconds in 24 hours
        break;
      case 'week':
        cutOffTime = 86400000 * 7;
        break;
      default:
        cutOffTime = 0;
    }

    self.filteredList().length = 0;
    self.locationList().forEach(function(item) {
      if (item.timeToNext() <= cutOffTime) {
        self.filteredList.push(item);
        item.marker.setMap(map);
        bounds.extend(item.marker.position);
      } else {
        item.marker.setMap(null);
      }
    });
    self.allBounds = bounds;
    map.fitBounds(bounds);
  };

  this.loadBookData = function() {
    var title = $('#title').val();
    var author = $('#author').val();
    var dataEntered = false;
    var bookTitle = 'No Title Found';
    var bookAuthor = 'No Author Listed';
    var bookImageSrc = 'img/books.jpg';

    // TODO Make replacement of "bad" characters more robust.
    if (title) {
      var titleForURL = title.replace('<', ' ').replace('>', ' ').replace(' ', '%20');
      if (author) {
        var authorForURL = author.replace('<', ' ').replace('>', ' ').replace(' ', '%20');
      }
    } else if (author) {
      var authorForURL = author.replace(' ', '%20');
      nytQuery = authorForURL;
      wikiQuery = authorForURL;
    } else {
      dataEntered = false;
    }

    var googleBooksURL = 'https://www.googleapis.com/books/v1/volumes?q=';

    if (title) {
      dataEntered = true;
      var titleForURL = title.replace('<', ' ').replace('>', ' ').replace(' ', '%20');
      googleBooksURL += 'intitle:' + titleForURL;
      if (author) {
        var authorForURL = author.replace('<', ' ').replace('>', ' ').replace(' ', '%20');
        googleBooksURL += '+inauthor:' + authorForURL;
      }
    } else if (author) {
      dataEntered = true;
      var authorForURL = author.replace('<', ' ').replace('>', ' ').replace(' ', '%20');
      googleBooksURL += 'inauthor:' + authorForURL;
    }

    if (!dataEntered) {
      googleBooksURL +='Guelph%20Ontario'
    }

    googleBooksURL += '&key=AIzaSyCNgnR6srI-o-L_1msz-0AA03afwiyOrxA';

    console.log('googleBooksURL = ' + googleBooksURL);

    var bookFound = false;

    $.getJSON( googleBooksURL )
      .done(function(data) {
        // log data to see how it's structured.
        console.log(data);

        if (data.hasOwnProperty('items')) {
          bookFound = true;
          /*var items = data.items;*/
          var firstBook = data.items[0];
          console.log(firstBook);
        }

        if (bookFound) {
          // Check if properties exist and assign their values to global variables
          if (firstBook.volumeInfo.hasOwnProperty('title')) {
            bookTitle = firstBook.volumeInfo.title;
          } else {
            bookTitle = "No Title Found";
          }
          if (firstBook.volumeInfo.hasOwnProperty('authors')) {
            bookAuthor = "";
            var authors = firstBook.volumeInfo.authors;
            var numAuthors = authors.length;
            for (var i = 0; i < (numAuthors - 1); i++) {
              bookAuthor += authors[i];
              bookAuthor += ', ';
            }
            bookAuthor += authors[numAuthors - 1];
          } else {
            bookAuthor = "No Author Listed";
          }
          if (firstBook.volumeInfo.hasOwnProperty('imageLinks')) {
            if (firstBook.volumeInfo.imageLinks.hasOwnProperty('smallThumbnail')) {
              bookImageSrc = firstBook.volumeInfo.imageLinks.smallThumbnail;
            } else if (firstBook.volumeInfo.imageLinks.hasOwnProperty('thumbnail')) {
              bookImageSrc = firstBook.volumeInfo.imageLinks.thumbnail;
            }
          } else {
            bookImageSrc = "img/books.jpg";
          }
        } else {
          bookTitle = 'No Title Found';
          bookAuthor = 'No Author Listed';
          bookImageSrc = 'img/books.jpg';
        }
        self.currentLocation().nowReading(bookTitle);
        self.currentLocation().author(bookAuthor);
        self.currentLocation().bookImage(bookImageSrc);
      })
      .fail(function() {
        console.log('Google Books data Unavailable');
      });

    return false;
  };
};


var viewModel = new ViewModel();

ko.applyBindings(viewModel);

