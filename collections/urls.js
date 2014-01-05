URLs = new Meteor.Collection('urls');

Meteor.methods({
   submitURL: function(urlAttributes) {

       // If user has chosen a short url
       if (urlAttributes.shortURL) {
           // Check if the chosen short url is unique
           if (URLs.findOne({ shortURL: urlAttributes.shortURL })) throw new Meteor.Error(302, 'The chosen URL is not available.')
           else var shortURL = urlAttributes.shortURL;
       // If not, generate a random string
       } else {
           var numberOfDigits = getRandomInt(3, 9);
           var shortURL = Random.hexString(numberOfDigits);
           // Make sure it is unique
           while (URLs.findOne({ shortURL: shortURL})) shortURL = Random.hexString(numberOfDigits);
       }


       // Build the new url
       var url = _.extend(_.pick(urlAttributes, 'targetURL', 'makePrivate'), {
           userId: Meteor.userId(),
           shortURL: shortURL,
           timeCreated: (new Date()).getTime(),
           timeModified: undefined,
           numVisit: 0
       });

       // Insert into db
       URLs.insert(url);
       return url.shortURL;
   }
});