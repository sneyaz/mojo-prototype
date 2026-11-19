/* Local finding feedback. It records reasons; it never silently reranks findings. */
(() => {
  const key='mojo-finding-feedback-v3';
  let events=[];
  try{const saved=JSON.parse(localStorage.getItem(key)||'[]');if(Array.isArray(saved))events=saved.filter(x=>x&&typeof x.instance==='string').slice(-200)}catch{}
  const types=new Proxy({}, {get:(_,name)=>String(name)});
  const save=()=>{try{localStorage.setItem(key,JSON.stringify(events))}catch{}window.dispatchEvent(new Event('mojo-pattern-learning-change'))};
  window.mojoPatternLearning={
    types,
    seen(){},
    engage(){},
    record(type,kind,instance,reason){events.push({type:String(type||''),kind:String(kind||''),instance:String(instance||''),reason:String(reason||''),at:new Date().toISOString()});events=events.slice(-200);save()},
    ownEvents(type,instance){return events.filter(x=>x.type===String(type||'')&&x.instance===String(instance||''))},
    undo(type,instance){const i=events.findLastIndex(x=>x.type===String(type||'')&&x.instance===String(instance||''));if(i>=0){events.splice(i,1);save()}},
    summary(){return {feedbackCount:events.length,rankingEffect:'none',outcomeEffect:'none'}}
  };
})();
