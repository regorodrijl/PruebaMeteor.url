Router.configure({
	notFoundTemplate: 'NotFound'
	, loadingTemplate: 'Loading'
	, templateNameConverter: 'upperCamelCase'
	, routeControllerNameConverter: 'upperCamelCase'
	, layoutTemplate: 'MasterLayout'
});


// For data configuration, see /client/controllers
Router.map(function () {
    this.route('home', {path: '/'});
    this.route('url.show', {path: '/show/:shortURL'});
    this.route('url.edit', {path: '/edit/:shortURL'});
    this.route('url.redirect', {path: '/redirect/:shortURL'});
    this.route('user.url.index', {path: '/user/urls/:limit?'});
    this.route('public.url.index', {path: '/public/:limit?'});
    this.route('not.found', {path: '/url/not-found'});
});


// Server side routing (for faster URL redirection)
// If :shortURL is a private link, we'll switch to client-side redirection 
// since user authorization is needed
Router.route('/:shortURL', function () {
    var request = this.request
        , response = this.response
        , url = URLs.findOne({shortURL: this.params.shortURL})    
        , location;
    
    // Not found
    if (!url) location = Router.path('not.found');
    
    // For private links, go to client side to authorize the requester 
    else if (url.isPrivate) location = Router.path('url.redirect', {shortURL: url.shortURL});
    
    // For public links, record statistical data and process redirection
    else {               
        var clientIP = (request.headers['x-forwarded-for'] || '').split(',')[0]
                       || request.connection.remoteAddress
                       || request.socket.remoteAddress
                       || request.connection.socket.remoteAddress      
            
            , userAgent = request.headers['user-agent'];
                
        // Record statistical data
        Meteor.call('/visit/insert', url.shortURL, clientIP, userAgent);
        
        location = url.targetURL;
    }
           
    response.writeHead(302, {'Location': location});    
    response.end();
}, {where: 'server'});


Router.map(function () {
    this.route("/short", {
        path: '/short/:url',
        where: 'server',
        layout: null,
        action: function () {
            console.log(request);
            var url = this.params.url;
            var urlBD = URLs.findOne({shortURL: url});
            var clientIP = (request.headers['x-forwarded-for'] || '').split(',')[0]
                       || request.connection.remoteAddress
                       || request.socket.remoteAddress
                       || request.connection.socket.remoteAddress      
            
            , userAgent = request.headers['user-agent'];

            // si no exsite la creamos y la añadimos
            if (!urlBD){
                //Crearlo y redirigir
                this.response.writeHead(200, {"Content-Type": "application/json"});
                this.response.end(JSON.stringify({"results": url}));
            }else{
                 Meteor.call('/visit/insert', url, clientIP, userAgent);
            //redirection
            //MOSTRAR
            this.response.writeHead(200, {"Content-Type": "application/json"});
            this.response.end(JSON.stringify({"results": urlBD}));
            }s 
        }
    });
});

Router.map(function() {
    this.route('/', {
        path: '/:url',
        where: 'server',
        layout: null,
        action: function () {
            console.log(request);
            var url = this.params.url;
            var urlBD = URLs.findOne({shortURL: url});
            var clientIP = (request.headers['x-forwarded-for'] || '').split(',')[0]
                       || request.connection.remoteAddress
                       || request.socket.remoteAddress
                       || request.connection.socket.remoteAddress      
            
            , userAgent = request.headers['user-agent'];

            // si no exsite la creamos y la añadimos
            if (!urlBD){
                //añadimos visita
                Meteor.call('/visit/insert', url, clientIP, userAgent);
                //Crearlo y redirigir
                //
                Router.path('url.redirect', {shortURL: url.shortURL}); 
            }
            Meteor.call('/visit/insert', url, clientIP, userAgent);
            //redirection
            Router.path('url.redirect', {shortURL: url.shortURL}); 
        }
    });
});