/* RESONANCE speech — the browser's text-to-speech, shared by Play and Learn Thai.
   Classic script: pages read it as window.RSSpeech.
     speak(text, {lang, gender, voice, rate, pitch, onstart, onword(pos,len,estimated), onend, onerror})
                   voice: a SpeechSynthesisVoice to use instead of the automatic pick
     stop()        stop speaking
     has(lang)     true if the device has a voice for that language (once voices have loaded)
     ready()       true once the browser has listed its voices (some load a moment after the page)
     supported     false when the browser has no speech synthesis at all */
(function (root) {
  root.RSSpeech = (function(){
    const synth=('speechSynthesis' in root)?root.speechSynthesis:null;
    const FEM=/\b(zira|aria|jenny|ava|samantha|karen|fiona|victoria|moira|tessa|susan|hazel|libby|sonia|natasha|emma|michelle|sara|elsa|katja|denise|vivienne|nanami|haruka|sunhi|xiaoxiao|huihui|premwadee|achara|swara|salma|thilini|female|woman)\b/i;
    const MAL=/\b(david|mark|guy|davis|tony|jason|brian|christopher|eric|roger|andrew|ryan|thomas|william|liam|george|daniel|alex|fred|tom|oliver|keita|injoon|yunxi|niwat|madhur|hamed|sameera|male|man)\b/i;
    let voices=[],seq=0,timer=null,keep=null,current=null;

    function load(){if(synth){const v=synth.getVoices();if(v.length)voices=v;}}
    if(synth){
      load();
      if(synth.addEventListener)synth.addEventListener('voiceschanged',load);else synth.onvoiceschanged=load;
      [200,600,1500,3000].forEach(function(d){setTimeout(load,d);});
    }

    function matches(lang){
      const c=String(lang).toLowerCase(),b=c.split('-')[0],ex=[],nr=[];
      voices.forEach(function(v){const l=v.lang.replace(/_/g,'-').toLowerCase();if(l===c)ex.push(v);else if(l.split('-')[0]===b)nr.push(v);});
      return ex.length?ex:nr;
    }
    function score(v,g){
      let s=0;
      if(/natural|neural|online|premium|enhanced/i.test(v.name))s+=40;
      if(/google/i.test(v.name))s+=15;
      const f=FEM.test(v.name),m=MAL.test(v.name);
      if(g==='female'){if(f)s+=25;if(m)s-=25;}else if(g==='male'){if(m)s+=25;if(f)s-=25;}
      return s;
    }
    function pick(lang,g){const p=matches(lang);return p.length?p.slice().sort(function(a,b){return score(b,g)-score(a,g);})[0]:null;}

    function clear(){clearInterval(timer);clearInterval(keep);}
    function stop(){seq++;clear();current=null;if(synth)synth.cancel();}

    /* o: {lang, gender, rate, pitch, onstart, onword(pos,len,estimated), onend, onerror} */
    function speak(text,o){
      o=o||{};
      if(!synth){if(o.onerror)o.onerror('unsupported');return;}
      const busy=synth.speaking||synth.pending;
      stop();
      const id=seq,u=new SpeechSynthesisUtterance(text),v=o.voice||pick(o.lang||'en-US',o.gender);
      u.rate=o.rate||1;u.pitch=o.pitch||1;
      if(v){u.voice=v;u.lang=v.lang;}else u.lang=o.lang||'en-US';
      let t0=0,gotBoundary=false;
      u.onstart=function(){
        if(id!==seq)return;
        t0=performance.now();
        if(o.onstart)o.onstart();
        /* Engines without word events get a time-based estimate */
        timer=setInterval(function(){
          if(id!==seq||gotBoundary||synth.paused)return;
          const el=performance.now()-t0;
          if(el>700&&o.onword)o.onword(Math.min(text.length-1,Math.floor(el/1000*13*u.rate)),2,true);
        },170);
        /* Chrome's Google voices stop after ~15s unless nudged */
        if(v&&/google/i.test(v.name))keep=setInterval(function(){if(id===seq&&synth.speaking){synth.pause();synth.resume();}},9000);
      };
      u.onboundary=function(e){
        if(id!==seq||(e.name&&e.name!=='word'))return;
        gotBoundary=true;
        const m=text.slice(e.charIndex).match(/^\S+/);
        if(o.onword)o.onword(e.charIndex,e.charLength||(m?Math.min(m[0].length,14):1),false);
      };
      u.onend=function(){if(id!==seq)return;clear();current=null;if(o.onend)o.onend();};
      u.onerror=function(e){if(id!==seq||e.error==='interrupted'||e.error==='canceled')return;clear();current=null;if(o.onerror)o.onerror(e.error);};
      current=u; /* keep a reference so Chrome doesn't garbage-collect it mid-speech */
      if(busy)setTimeout(function(){if(id===seq)synth.speak(u);},80);else synth.speak(u);
    }

    return {pick:pick,speak:speak,stop:stop,has:function(lang){return matches(lang).length>0;},supported:!!synth,ready:function(){return voices.length>0;}};
  })();
})(typeof window !== 'undefined' ? window : globalThis);
