// Keeps the hub opening even with no signal, and picks up new versions when online.
var CACHE='hub-v42';
var CORE=['./','./index.html','./manifest.webmanifest','./supabase.js','./qrcode.js','./favicon-16.png','./favicon-32.png','./icon-maskable-512.png','./icon-192.png','./icon-512.png','./apple-touch-icon.png'];

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

// lock-screen reminders: the server pushes a message, and we must always show it
self.addEventListener('push',function(e){
  var d={};
  try{d=e.data?e.data.json():{}}catch(x){}
  e.waitUntil(self.registration.showNotification(d.title||'Doable',{
    body:d.body||'',icon:'./icon-192.png',badge:'./favicon-32.png',tag:d.tag||'doable',data:{url:'./'}
  }));
});
self.addEventListener('notificationclick',function(e){
  e.notification.close();
  e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(function(list){
    for(var i=0;i<list.length;i++){if('focus' in list[i])return list[i].focus()}
    return self.clients.openWindow('./');
  }));
});
