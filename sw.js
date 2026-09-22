// Keeps the hub opening even with no signal, and picks up new versions when online.
var CACHE='hub-v6';
var CORE=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./apple-touch-icon.png'];

self.addEventListener('install',function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(CORE)}).then(function(){return self.skipWaiting()}));
});

self.addEventListener('activate',function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){return k!==CACHE}).map(function(k){return caches.delete(k)}));
  }).then(function(){return self.clients.claim()}));
});

self.addEventListener('fetch',function(e){
  var req=e.request;
  if(req.method!=='GET')return;
  var url=new URL(req.url);
  if(url.origin!==location.origin)return;
  // the app page: try the internet first so updates arrive, fall back to the saved copy offline
  if(req.mode==='navigate'||url.pathname.endsWith('/')||url.pathname.endsWith('index.html')){
    e.respondWith(fetch(req).then(function(res){
      var copy=res.clone();caches.open(CACHE).then(function(c){c.put('./index.html',copy)});
      return res;
    }).catch(function(){return caches.match('./index.html')}));
    return;
  }
  // icons and the manifest: saved copy first
  e.respondWith(caches.match(req).then(function(hit){return hit||fetch(req)}));
});
