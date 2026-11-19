/* Sample reviewer roster for standards; identity enforcement needs a connected workspace. */
document.addEventListener('DOMContentLoaded',()=>{
  const page=document.querySelector('.mp-page');
  const approval=[...page?.querySelectorAll('.mp-section')||[]].find(section=>section.querySelector('h2')?.textContent.trim()==='Approval rules for a connected workspace');
  if(!approval)return;
  const key='mojo-practice-reviewers-v1';
  let names=['Priya Shah'];
  try{const value=JSON.parse(localStorage.getItem(key)||'null');if(Array.isArray(value?.names)&&value.names.length)names=value.names.slice(0,3);}catch{}
  const section=document.createElement('section');
  section.className='mp-section mpr-settings';
  section.id='practice-reviewers';
  section.innerHTML=`<h2>Best practice reviewers</h2><p class="mp-muted">Name one to three MOps reviewers for the weekly standards queue. Authors can draft rules; reviewers decide what becomes approved.</p><form class="mpr-form"><label>Reviewer 1<input name="reviewer-1" required maxlength="70" autocomplete="off"></label><label>Reviewer 2<input name="reviewer-2" maxlength="70" autocomplete="off"></label><label>Reviewer 3<input name="reviewer-3" maxlength="70" autocomplete="off"></label><button type="submit">Save reviewer roster</button></form><p class="mpr-note">This roster is a browser preview. It does not grant access to another person or approve rules automatically.</p><p class="mpr-status" role="status"></p>`;
  approval.after(section);
  names.forEach((name,index)=>{section.querySelector(`[name="reviewer-${index+1}"]`).value=name;});
  section.querySelector('form').addEventListener('submit',event=>{
    event.preventDefault();
    const data=new FormData(event.target);
    const next=[1,2,3].map(index=>String(data.get(`reviewer-${index}`)||'').trim()).filter(Boolean);
    if(!next.length)return;
    localStorage.setItem(key,JSON.stringify({names:next}));
    section.querySelector('.mpr-status').textContent=`Saved ${next.length} ${next.length===1?'reviewer':'reviewers'} in this browser.`;
  });
});
